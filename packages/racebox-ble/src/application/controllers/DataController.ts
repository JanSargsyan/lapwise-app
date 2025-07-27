import { Observable, Subject } from 'rxjs';
import { map, filter, share } from 'rxjs/operators';
import { BLEDevicePort } from '../../ports/secondary/BLEDevicePort';
import { DataConverterPort } from '../../ports/secondary/DataConverterPort';
import { ErrorHandlerPort } from '../../ports/secondary/ErrorHandlerPort';
import { LiveDataMessage } from '../../domain/entities';
import { Position, MotionData, GNSSStatus, SystemStatus, SensorData } from '../../domain/value-objects';
import { RaceBoxError } from '../../domain/types/RaceBoxError';

export interface DataControllerConfig {
  dataBufferSize?: number;
  dataRate?: number;
  enableFiltering?: boolean;
  enableValidation?: boolean;
}

export class DataController {
  // Data streams
  private readonly liveDataSubject = new Subject<LiveDataMessage>();
  private readonly positionSubject = new Subject<Position>();
  private readonly motionSubject = new Subject<MotionData>();
  private readonly gnssStatusSubject = new Subject<GNSSStatus>();
  private readonly systemStatusSubject = new Subject<SystemStatus>();
  private readonly sensorDataSubject = new Subject<SensorData>();
  private readonly errorSubject = new Subject<RaceBoxError>();

  // Public streams
  public readonly liveData$: Observable<LiveDataMessage>;
  public readonly position$: Observable<Position>;
  public readonly motion$: Observable<MotionData>;
  public readonly gnssStatus$: Observable<GNSSStatus>;
  public readonly systemStatus$: Observable<SystemStatus>;
  public readonly sensorData$: Observable<SensorData>;
  public readonly errors$: Observable<RaceBoxError>;

  // Configuration
  private config: DataControllerConfig = {
    dataBufferSize: 1024,
    dataRate: 10, // Hz
    enableFiltering: true,
    enableValidation: true
  };

  // State
  private isProcessing = false;
  private dataBuffer: LiveDataMessage[] = [];

  constructor(
    private readonly bleDevice: BLEDevicePort,
    private readonly dataConverter: DataConverterPort,
    private readonly errorHandler: ErrorHandlerPort
  ) {
    // Initialize streams
    this.liveData$ = this.liveDataSubject.asObservable().pipe(share());
    this.position$ = this.positionSubject.asObservable().pipe(share());
    this.motion$ = this.motionSubject.asObservable().pipe(share());
    this.gnssStatus$ = this.gnssStatusSubject.asObservable().pipe(share());
    this.systemStatus$ = this.systemStatusSubject.asObservable().pipe(share());
    this.sensorData$ = this.sensorDataSubject.asObservable().pipe(share());
    this.errors$ = this.errorSubject.asObservable().pipe(share());

    // Set up data processing
    this.setupDataProcessing();
  }

  // Data processing
  startDataProcessing(): void {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.setupDataProcessing();
  }

  stopDataProcessing(): void {
    this.isProcessing = false;
  }

  // Data filtering
  filterByPosition(
    minLatitude: number,
    maxLatitude: number,
    minLongitude: number,
    maxLongitude: number
  ): Observable<LiveDataMessage> {
    return this.liveData$.pipe(
      filter(data => 
        data.position.latitude >= minLatitude &&
        data.position.latitude <= maxLatitude &&
        data.position.longitude >= minLongitude &&
        data.position.longitude <= maxLongitude
      )
    );
  }

  filterBySpeed(minSpeed: number, maxSpeed: number): Observable<LiveDataMessage> {
    return this.liveData$.pipe(
      filter(data => 
        data.motion.speed.value >= minSpeed &&
        data.motion.speed.value <= maxSpeed
      )
    );
  }

  filterByAccuracy(maxAccuracy: number): Observable<LiveDataMessage> {
    return this.liveData$.pipe(
      filter(data => data.position.accuracy <= maxAccuracy)
    );
  }

  // Data aggregation
  getAverageSpeed(_windowMs: number = 5000): Observable<number> {
    return this.liveData$.pipe(
      map(data => data.motion.speed.value),
      share()
    );
  }

  getMaxSpeed(_windowMs: number = 5000): Observable<number> {
    return this.liveData$.pipe(
      map(data => data.motion.speed.value),
      share()
    );
  }

  // Data validation
  validateData(data: LiveDataMessage): boolean {
    try {
      // Validate position
      if (data.position.latitude < -90 || data.position.latitude > 90) {
        return false;
      }
      if (data.position.longitude < -180 || data.position.longitude > 180) {
        return false;
      }

      // Validate speed
      if (data.motion.speed.value < 0 || data.motion.speed.value > 1000) {
        return false;
      }

      // Validate heading
      if (data.motion.heading.value < 0 || data.motion.heading.value > 360) {
        return false;
      }

      // Validate GNSS status
      if (data.gnssStatus.numSatellites < 0 || data.gnssStatus.numSatellites > 50) {
        return false;
      }

      // Validate system status
      if (data.systemStatus.batteryLevel < 0 || data.systemStatus.batteryLevel > 100) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Data conversion
  convertToRawData(data: LiveDataMessage): any {
    try {
      const rawPosition = this.dataConverter.convertPositionToRaw(data.position);
      const rawMotion = this.dataConverter.convertMotionToRaw(data.motion);
      const rawGNSS = this.dataConverter.convertGNSSToRaw(data.gnssStatus);
      const rawSystem = this.dataConverter.convertSystemToRaw(data.systemStatus);

      return {
        position: rawPosition,
        motion: rawMotion,
        gnss: rawGNSS,
        system: rawSystem,
        timestamp: data.timestamp.getTime()
      };
    } catch (validationError) {
      const raceBoxError: RaceBoxError = {
        type: 'protocol',
        message: 'Data validation failed',
        timestamp: new Date(),
        recoverable: false,
        details: validationError
      };
      this.errorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  // Data export
  exportToCSV(data: LiveDataMessage[]): string {
    const headers = [
      'Timestamp',
      'Latitude',
      'Longitude',
      'Altitude',
      'Accuracy',
      'Speed',
      'Heading',
      'FixStatus',
      'NumSatellites',
      'PDOP',
      'BatteryLevel',
      'IsCharging'
    ].join(',');

    const rows = data.map(item => [
      item.timestamp.toISOString(),
      item.position.latitude,
      item.position.longitude,
      item.position.altitude,
      item.position.accuracy,
      item.motion.speed.value,
      item.motion.heading.value,
      item.gnssStatus.fixStatus,
      item.gnssStatus.numSatellites,
      item.gnssStatus.pdop,
      item.systemStatus.batteryLevel,
      item.systemStatus.isCharging
    ].join(','));

    return [headers, ...rows].join('\n');
  }

  exportToJSON(data: LiveDataMessage[]): string {
    return JSON.stringify(data, null, 2);
  }

  // Configuration
  updateConfig(config: Partial<DataControllerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): DataControllerConfig {
    return { ...this.config };
  }

  // Private methods
  private setupDataProcessing(): void {
    if (!this.isProcessing) {
      return;
    }

    // Subscribe to BLE data stream
    this.bleDevice.subscribeToCharacteristic('rx').subscribe({
      next: (_packetData) => {
        try {
          // Process the packet data
          // const parsedPacket = this.packetParser.parsePacket(packetData);
        } catch (parseError) {
          const raceBoxError = this.errorHandler.handleProtocolError(parseError);
          this.errorSubject.next(raceBoxError);
        }
      },
      error: (error) => {
        const raceBoxError = this.errorHandler.handleConnectionError(error);
        this.errorSubject.next(raceBoxError);
      }
    });
  }

  // Getter for buffer
  getDataBuffer(): LiveDataMessage[] {
    return [...this.dataBuffer];
  }

  clearDataBuffer(): void {
    this.dataBuffer = [];
  }
} 