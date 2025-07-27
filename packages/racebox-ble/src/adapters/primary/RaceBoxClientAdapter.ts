import { Observable, Subject, combineLatest, merge, of, throwError } from 'rxjs';
import { map, catchError, filter, share, startWith, distinctUntilChanged } from 'rxjs/operators';
import { RaceBoxClientPort, DeviceInfo, RecordingState, ConnectionState, MemoryStatus, RaceBoxConfig } from '../../ports/primary/RaceBoxClientPort';
import { BLEDevicePort } from '../../ports/secondary/BLEDevicePort';
import { PacketParserPort } from '../../ports/secondary/PacketParserPort';
import { MessageFactoryPort } from '../../ports/secondary/MessageFactoryPort';
import { DataConverterPort } from '../../ports/secondary/DataConverterPort';
import { ErrorHandlerPort } from '../../ports/secondary/ErrorHandlerPort';
import { LiveDataMessage, RecordingConfiguration, GNSSConfiguration } from '../../domain/entities';
import { Position, MotionData, GNSSStatus, SystemStatus, SensorData } from '../../domain/value-objects';
import { RaceBoxError } from '../../domain/types/RaceBoxError';

export class RaceBoxClientAdapter implements RaceBoxClientPort {
  // Data streams (RxJS for continuous data)
  public readonly liveData$: Observable<LiveDataMessage>;
  public readonly position$: Observable<Position>;
  public readonly motion$: Observable<MotionData>;
  public readonly deviceState$: Observable<ConnectionState>;
  
  // Historical data streams (RxJS for continuous updates)
  public readonly historyData$: Observable<LiveDataMessage>;
  public readonly recordingState$: Observable<RecordingState>;
  public readonly downloadProgress$: Observable<number>;
  
  // Configuration streams (RxJS for state changes)
  public readonly deviceConfig$: Observable<DeviceInfo>;
  public readonly recordingConfig$: Observable<RecordingConfiguration>;
  public readonly gnssConfig$: Observable<GNSSConfiguration>;
  
  // Error streams (RxJS for continuous error monitoring)
  public readonly connectionErrors$: Observable<RaceBoxError>;
  public readonly protocolErrors$: Observable<RaceBoxError>;
  public readonly deviceErrors$: Observable<RaceBoxError>;
  public readonly allErrors$: Observable<RaceBoxError>;

  // Private subjects for internal state management
  private readonly liveDataSubject = new Subject<LiveDataMessage>();
  private readonly positionSubject = new Subject<Position>();
  private readonly motionSubject = new Subject<MotionData>();
  private readonly deviceStateSubject = new Subject<ConnectionState>();
  private readonly historyDataSubject = new Subject<LiveDataMessage>();
  private readonly recordingStateSubject = new Subject<RecordingState>();
  private readonly downloadProgressSubject = new Subject<number>();
  private readonly deviceConfigSubject = new Subject<DeviceInfo>();
  private readonly recordingConfigSubject = new Subject<RecordingConfiguration>();
  private readonly gnssConfigSubject = new Subject<GNSSConfiguration>();
  private readonly connectionErrorSubject = new Subject<RaceBoxError>();
  private readonly protocolErrorSubject = new Subject<RaceBoxError>();
  private readonly deviceErrorSubject = new Subject<RaceBoxError>();

  // Configuration
  private config: RaceBoxConfig = {
    connectionTimeout: 10000,
    commandTimeout: 5000,
    retryAttempts: 3,
    autoReconnect: true,
    dataBufferSize: 1024
  };

  // State tracking
  private isConnected = false;
  private currentRecordingState: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    dataPoints: 0,
    memoryLevel: 0
  };

  constructor(
    private readonly bleDevice: BLEDevicePort,
    private readonly packetParser: PacketParserPort,
    private readonly messageFactory: MessageFactoryPort,
    private readonly dataConverter: DataConverterPort,
    private readonly errorHandler: ErrorHandlerPort
  ) {
    // Initialize streams
    this.liveData$ = this.liveDataSubject.asObservable().pipe(share());
    this.position$ = this.positionSubject.asObservable().pipe(share());
    this.motion$ = this.motionSubject.asObservable().pipe(share());
    this.deviceState$ = this.deviceStateSubject.asObservable().pipe(share());
    this.historyData$ = this.historyDataSubject.asObservable().pipe(share());
    this.recordingState$ = this.recordingStateSubject.asObservable().pipe(share());
    this.downloadProgress$ = this.downloadProgressSubject.asObservable().pipe(share());
    this.deviceConfig$ = this.deviceConfigSubject.asObservable().pipe(share());
    this.recordingConfig$ = this.recordingConfigSubject.asObservable().pipe(share());
    this.gnssConfig$ = this.gnssConfigSubject.asObservable().pipe(share());
    this.connectionErrors$ = this.connectionErrorSubject.asObservable().pipe(share());
    this.protocolErrors$ = this.protocolErrorSubject.asObservable().pipe(share());
    this.deviceErrors$ = this.deviceErrorSubject.asObservable().pipe(share());
    this.allErrors$ = merge(
      this.connectionErrors$,
      this.protocolErrors$,
      this.deviceErrors$
    ).pipe(share());

    // Set up BLE data processing
    this.setupDataProcessing();
    this.setupErrorHandling();
  }

  // Commands (Promises for one-time actions)
  async configureGNSS(config: GNSSConfiguration): Promise<void> {
    try {
      const message = this.messageFactory.createGNSSConfigSet(config);
      const packet = this.messageFactory.messageToPacket(message);
      await this.bleDevice.sendData(packet);
      
      // Update internal state
      this.gnssConfigSubject.next(config);
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError(error);
      this.deviceErrorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  async configureRecording(config: RecordingConfiguration): Promise<void> {
    try {
      const message = this.messageFactory.createRecordingConfigSet(config);
      const packet = this.messageFactory.messageToPacket(message);
      await this.bleDevice.sendData(packet);
      
      // Update internal state
      this.recordingConfigSubject.next(config);
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError(error);
      this.deviceErrorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  async startRecording(): Promise<void> {
    try {
      const message = this.messageFactory.createStartRecordingCommand();
      const packet = this.messageFactory.messageToPacket(message);
      await this.bleDevice.sendData(packet);
      
      // Update recording state
      this.currentRecordingState.isRecording = true;
      this.currentRecordingState.isPaused = false;
      this.currentRecordingState.startTime = new Date();
      this.recordingStateSubject.next(this.currentRecordingState);
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError(error);
      this.deviceErrorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  async stopRecording(): Promise<void> {
    try {
      const message = this.messageFactory.createStopRecordingCommand();
      const packet = this.messageFactory.messageToPacket(message);
      await this.bleDevice.sendData(packet);
      
      // Update recording state
      this.currentRecordingState.isRecording = false;
      this.currentRecordingState.isPaused = false;
      this.recordingStateSubject.next(this.currentRecordingState);
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError(error);
      this.deviceErrorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  async pauseRecording(): Promise<void> {
    try {
      const message = this.messageFactory.createPauseRecordingCommand();
      const packet = this.messageFactory.messageToPacket(message);
      await this.bleDevice.sendData(packet);
      
      // Update recording state
      this.currentRecordingState.isPaused = true;
      this.recordingStateSubject.next(this.currentRecordingState);
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError(error);
      this.deviceErrorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  async downloadHistory(): Promise<LiveDataMessage[]> {
    try {
      const message = this.messageFactory.createDownloadHistoryCommand();
      const packet = this.messageFactory.messageToPacket(message);
      await this.bleDevice.sendData(packet);
      
      // This would typically involve waiting for multiple packets
      // For now, return an empty array
      return [];
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError(error);
      this.deviceErrorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  async eraseMemory(): Promise<void> {
    try {
      const message = this.messageFactory.createEraseMemoryCommand();
      const packet = this.messageFactory.messageToPacket(message);
      await this.bleDevice.sendData(packet);
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError(error);
      this.deviceErrorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  async unlockMemory(securityCode: number): Promise<void> {
    try {
      const message = this.messageFactory.createUnlockMemoryCommand(securityCode);
      const packet = this.messageFactory.messageToPacket(message);
      await this.bleDevice.sendData(packet);
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError(error);
      this.deviceErrorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  // State queries (Promises for one-time state checks)
  async getConnectionState(): Promise<ConnectionState> {
    return {
      isConnected: this.isConnected,
      deviceId: this.bleDevice.getDeviceId(),
      signalStrength: this.bleDevice.getSignalStrength(),
      lastSeen: new Date()
    };
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    try {
      const bleDeviceInfo = await this.bleDevice.getDeviceInfo();
      return {
        id: bleDeviceInfo.id,
        name: bleDeviceInfo.name,
        model: 'RaceBox Mini', // This would come from device
        serialNumber: 'SN123456', // This would come from device
        firmwareVersion: '1.0.0', // This would come from device
        hardwareRevision: '1.0', // This would come from device
        manufacturer: 'RaceBox'
      };
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError(error);
      this.deviceErrorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  async getRecordingStatus(): Promise<RecordingState> {
    return this.currentRecordingState;
  }

  async getGNSSStatus(): Promise<GNSSStatus> {
    // This would typically query the device for current GNSS status
    // For now, return a default status
    return {
      fixStatus: 0,
      numSatellites: 0,
      pdop: 0,
      horizontalAccuracy: 0,
      verticalAccuracy: 0
    };
  }

  async getMemoryStatus(): Promise<MemoryStatus> {
    // This would typically query the device for memory status
    // For now, return a default status
    return {
      totalCapacity: 1024 * 1024 * 1024, // 1GB
      usedCapacity: 512 * 1024 * 1024, // 512MB
      freeCapacity: 512 * 1024 * 1024, // 512MB
      memoryLevel: 50 // 50%
    };
  }

  // Utility methods (Synchronous for simple checks)
  isConnected(): boolean {
    return this.isConnected;
  }

  getConfig(): RaceBoxConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<RaceBoxConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Private helper methods
  private setupDataProcessing(): void {
    // Subscribe to BLE data and process it
    this.bleDevice.subscribeToCharacteristic('rx').pipe(
      map(data => {
        try {
          const message = this.packetParser.parsePacket(data);
          
          if (this.packetParser.isLiveDataMessage(data)) {
            const liveData = this.packetParser.extractLiveData(data);
            this.liveDataSubject.next(liveData);
            this.positionSubject.next(liveData.position);
            this.motionSubject.next(liveData.motion);
          } else if (this.packetParser.isConfigurationMessage(data)) {
            const config = this.packetParser.extractConfiguration(data);
            // Handle configuration updates
          } else if (this.packetParser.isAcknowledgmentMessage(data)) {
            const ack = this.packetParser.extractAcknowledgment(data);
            // Handle acknowledgments
          }
          
          return message;
        } catch (error) {
          const raceBoxError = this.errorHandler.handleProtocolError(error);
          this.protocolErrorSubject.next(raceBoxError);
          throw raceBoxError;
        }
      }),
      catchError(error => {
        const raceBoxError = this.errorHandler.handleProtocolError(error);
        this.protocolErrorSubject.next(raceBoxError);
        return throwError(() => raceBoxError);
      })
    ).subscribe();
  }

  private setupErrorHandling(): void {
    // Subscribe to BLE connection errors
    this.bleDevice.connectionError$.pipe(
      map(error => this.errorHandler.transformBLEError(error))
    ).subscribe(error => {
      this.connectionErrorSubject.next(error);
    });

    // Subscribe to BLE connection state changes
    this.bleDevice.connectionState$.pipe(
      map(state => {
        this.isConnected = state.isConnected;
        return state;
      })
    ).subscribe(state => {
      this.deviceStateSubject.next(state);
    });
  }
} 