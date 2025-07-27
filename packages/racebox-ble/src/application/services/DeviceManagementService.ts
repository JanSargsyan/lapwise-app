import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, share, distinctUntilChanged } from 'rxjs/operators';
import { BLEDevicePort } from '../../ports/secondary/BLEDevicePort';
import { ErrorHandlerPort } from '../../ports/secondary/ErrorHandlerPort';
import { DeviceController } from '../controllers/DeviceController';
import { DataController } from '../controllers/DataController';
import { GNSSConfiguration, RecordingConfiguration } from '../../domain/entities';
import { RaceBoxError } from '../../domain/types/RaceBoxError';

export interface DeviceStatus {
  isConnected: boolean;
  isRecording: boolean;
  deviceId?: string;
  deviceName?: string;
  signalStrength?: number;
  batteryLevel?: number;
  lastSeen?: Date;
}

export interface DeviceManagementConfig {
  autoReconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  connectionTimeout: number;
  commandTimeout: number;
}

export class DeviceManagementService {
  // Status streams
  private readonly deviceStatusSubject = new BehaviorSubject<DeviceStatus>({
    isConnected: false,
    isRecording: false
  });

  public readonly deviceStatus$: Observable<DeviceStatus>;
  public readonly connectionStatus$: Observable<boolean>;
  public readonly recordingStatus$: Observable<boolean>;

  // Error streams
  private readonly errorSubject = new Subject<RaceBoxError>();
  public readonly errors$: Observable<RaceBoxError>;

  // Configuration
  private config: DeviceManagementConfig = {
    autoReconnect: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 3,
    connectionTimeout: 10000,
    commandTimeout: 5000
  };

  // State
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private lastDeviceId?: string;

  constructor(
    private readonly bleDevice: BLEDevicePort,
    private readonly deviceController: DeviceController,
    private readonly dataController: DataController,
    private readonly errorHandler: ErrorHandlerPort
  ) {
    // Initialize streams
    this.deviceStatus$ = this.deviceStatusSubject.asObservable().pipe(share());
    this.connectionStatus$ = this.deviceStatus$.pipe(
      map(status => status.isConnected),
      distinctUntilChanged()
    );
    this.recordingStatus$ = this.deviceStatus$.pipe(
      map(status => status.isRecording),
      distinctUntilChanged()
    );
    this.errors$ = this.errorSubject.asObservable().pipe(share());

    // Set up monitoring
    this.setupDeviceMonitoring();
  }

  // Device connection management
  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      this.lastDeviceId = deviceId;
      this.reconnectAttempts = 0;

      const success = await this.deviceController.connectToDevice(deviceId);
      
      if (success) {
        this.updateDeviceStatus({
          isConnected: true,
          isRecording: false,
          deviceId,
          lastSeen: new Date()
        });

        // Start data processing
        this.dataController.startDataProcessing();
      }

      return success;
    } catch (error) {
      const raceBoxError = this.errorHandler.handleConnectionError(error);
      this.errorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  async disconnectFromDevice(): Promise<void> {
    try {
      // Stop recording if active
      if (this.deviceController.getRecordingStatus()) {
        await this.deviceController.stopRecording();
      }

      // Stop data processing
      this.dataController.stopDataProcessing();

      // Disconnect from BLE device
      await this.bleDevice.disconnect();

      // Clear reconnect timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      this.updateDeviceStatus({
        isConnected: false,
        isRecording: false
      });
    } catch (error) {
      const raceBoxError = this.errorHandler.handleConnectionError(error);
      this.errorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  // Configuration management
  async configureGNSS(config: GNSSConfiguration): Promise<boolean> {
    try {
      const success = await this.deviceController.configureGNSS(config);
      
      if (success) {
        // Update device status with new configuration
        const currentStatus = this.deviceStatusSubject.value;
        this.updateDeviceStatus(currentStatus);
      }

      return success;
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError(error);
      this.errorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  async configureRecording(config: RecordingConfiguration): Promise<boolean> {
    try {
      const success = await this.deviceController.configureRecording(config);
      
      if (success) {
        // Update device status with new configuration
        const currentStatus = this.deviceStatusSubject.value;
        this.updateDeviceStatus(currentStatus);
      }

      return success;
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError(error);
      this.errorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  // Recording management
  async startRecording(): Promise<boolean> {
    try {
      const success = await this.deviceController.startRecording();
      
      if (success) {
        this.updateDeviceStatus({
          ...this.deviceStatusSubject.value,
          isRecording: true
        });
      }

      return success;
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError(error);
      this.errorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  async stopRecording(): Promise<boolean> {
    try {
      const success = await this.deviceController.stopRecording();
      
      if (success) {
        this.updateDeviceStatus({
          ...this.deviceStatusSubject.value,
          isRecording: false
        });
      }

      return success;
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError(error);
      this.errorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  async pauseRecording(): Promise<boolean> {
    try {
      return await this.deviceController.pauseRecording();
    } catch (error) {
      const raceBoxError = this.errorHandler.handleDeviceError(error);
      this.errorSubject.next(raceBoxError);
      throw raceBoxError;
    }
  }

  // Auto-reconnect functionality
  private setupAutoReconnect(): void {
    if (!this.config.autoReconnect || !this.lastDeviceId) {
      return;
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      const error = this.errorHandler.createError('connection', 'Max reconnection attempts reached');
      this.errorSubject.next(error);
      return;
    }

    this.reconnectTimer = setTimeout(async () => {
      try {
        this.reconnectAttempts++;
        await this.connectToDevice(this.lastDeviceId!);
        
        // Reset reconnect attempts on successful connection
        this.reconnectAttempts = 0;
      } catch (error) {
        // Continue trying to reconnect
        this.setupAutoReconnect();
      }
    }, this.config.reconnectInterval);
  }

  // Device monitoring
  private setupDeviceMonitoring(): void {
    // Monitor BLE connection state
    this.bleDevice.connectionState$.subscribe({
      next: (state) => {
        const currentStatus = this.deviceStatusSubject.value;
        
        if (!state.isConnected && currentStatus.isConnected) {
          // Device disconnected
          this.updateDeviceStatus({
            ...currentStatus,
            isConnected: false,
            isRecording: false
          });

          // Stop data processing
          this.dataController.stopDataProcessing();

          // Setup auto-reconnect if enabled
          if (this.config.autoReconnect) {
            this.setupAutoReconnect();
          }
        } else if (state.isConnected && !currentStatus.isConnected) {
          // Device connected
          this.updateDeviceStatus({
            ...currentStatus,
            isConnected: state.isConnected,
            deviceId: state.deviceId,
            signalStrength: state.signalStrength,
            lastSeen: state.lastSeen
          });

          // Start data processing
          this.dataController.startDataProcessing();
        }
      },
      error: (error) => {
        const raceBoxError = this.errorHandler.handleConnectionError(error);
        this.errorSubject.next(raceBoxError);
      }
    });

    // Monitor BLE errors
    this.bleDevice.connectionError$.subscribe({
      next: (error) => {
        const raceBoxError = this.errorHandler.transformBLEError(error);
        this.errorSubject.next(raceBoxError);
      }
    });
  }

  // Status management
  private updateDeviceStatus(status: Partial<DeviceStatus>): void {
    const currentStatus = this.deviceStatusSubject.value;
    const newStatus = { ...currentStatus, ...status };
    this.deviceStatusSubject.next(newStatus);
  }

  // Configuration
  updateConfig(config: Partial<DeviceManagementConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): DeviceManagementConfig {
    return { ...this.config };
  }

  // Status queries
  getDeviceStatus(): DeviceStatus {
    return this.deviceStatusSubject.value;
  }

  isConnected(): boolean {
    return this.deviceStatusSubject.value.isConnected;
  }

  isRecording(): boolean {
    return this.deviceStatusSubject.value.isRecording;
  }

  // Cleanup
  dispose(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.deviceStatusSubject.complete();
    this.errorSubject.complete();
  }
} 