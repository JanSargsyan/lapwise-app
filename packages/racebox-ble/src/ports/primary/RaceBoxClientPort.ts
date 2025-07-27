import { Observable } from 'rxjs';
import { LiveDataMessage, HistoryDataMessage } from '../../domain/entities';
import { Position } from '../../domain/value-objects/Position';
import { MotionData } from '../../domain/value-objects/MotionData';
import { GNSSStatus } from '../../domain/value-objects/GNSSStatus';
import { MemoryStatus } from '../../domain/value-objects/MemoryStatus';
import { RecordingConfiguration, GNSSConfiguration } from '../../domain/entities';
import { RaceBoxError } from '../../domain/types/RaceBoxError';

export interface DeviceInfo {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
  hardwareRevision: string;
  manufacturer: string;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration?: number;
  dataPoints?: number;
  memoryLevel?: number;
  startTime?: Date;
}

export interface ConnectionState {
  isConnected: boolean;
  deviceId?: string;
  signalStrength?: number;
  lastSeen?: Date;
}

export interface RaceBoxConfig {
  connectionTimeout: number;
  commandTimeout: number;
  retryAttempts: number;
  autoReconnect: boolean;
  dataBufferSize: number;
}

export interface RaceBoxClientPort {
  // Data streams (RxJS for continuous data)
  readonly liveData$: Observable<LiveDataMessage>;
  readonly position$: Observable<Position>;
  readonly motion$: Observable<MotionData>;
  readonly deviceState$: Observable<ConnectionState>;
  readonly gnssState$: Observable<GNSSStatus>;
  
  // Historical data streams (RxJS for continuous updates)
  readonly historyData$: Observable<LiveDataMessage>;
  readonly recordingState$: Observable<RecordingState>;
  readonly downloadProgress$: Observable<number>;
  
  // Configuration streams (RxJS for state changes)
  readonly deviceConfig$: Observable<DeviceInfo>;
  readonly recordingConfig$: Observable<RecordingConfiguration>;
  readonly gnssConfig$: Observable<GNSSConfiguration>;
  
  // Error streams (RxJS for continuous error monitoring)
  readonly connectionErrors$: Observable<RaceBoxError>;
  readonly protocolErrors$: Observable<RaceBoxError>;
  readonly deviceErrors$: Observable<RaceBoxError>;
  readonly allErrors$: Observable<RaceBoxError>;

  // Commands (Promises for one-time actions)
  configureGNSS(config: GNSSConfiguration): Promise<void>;
  configureRecording(config: RecordingConfiguration): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  pauseRecording(): Promise<void>;
  downloadHistory(): Promise<HistoryDataMessage[]>;
  eraseMemory(): Promise<void>;
  unlockMemory(securityCode: number): Promise<void>;

  // State queries (Promises for one-time state checks)
  getConnectionState(): Promise<ConnectionState>;
  getDeviceInfo(): Promise<DeviceInfo>;
  getRecordingStatus(): Promise<RecordingState>;
  getGNSSStatus(): Promise<GNSSStatus>;
  getMemoryStatus(): Promise<MemoryStatus>;

  // Utility methods (Synchronous for simple checks)
  isConnected(): boolean;
  getConfig(): RaceBoxConfig;
  updateConfig(config: Partial<RaceBoxConfig>): void;
} 