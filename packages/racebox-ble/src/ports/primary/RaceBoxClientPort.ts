import { Observable } from 'rxjs';
import { LiveDataMessage, Position, MotionData, GNSSStatus, SystemStatus, SensorData } from '../../domain/entities';
import { RecordingConfiguration, GNSSConfiguration } from '../../domain/entities';
import { RaceBoxError } from '../../domain/types';

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
  startTime?: Date;
  duration: number; // seconds
  dataPoints: number;
  memoryLevel: number; // percentage
}

export interface ConnectionState {
  isConnected: boolean;
  deviceId?: string;
  signalStrength?: number;
  lastSeen?: Date;
}

export interface MemoryStatus {
  totalCapacity: number; // bytes
  usedCapacity: number; // bytes
  freeCapacity: number; // bytes
  memoryLevel: number; // percentage
}

export interface RaceBoxConfig {
  connectionTimeout: number; // milliseconds
  commandTimeout: number; // milliseconds
  retryAttempts: number;
  autoReconnect: boolean;
  dataBufferSize: number;
}

export interface RaceBoxClientPort {
  // Data streams (RxJS for continuous data)
  liveData$: Observable<LiveDataMessage>;
  position$: Observable<Position>;
  motion$: Observable<MotionData>;
  deviceState$: Observable<ConnectionState>;
  
  // Historical data streams (RxJS for continuous updates)
  historyData$: Observable<LiveDataMessage>;
  recordingState$: Observable<RecordingState>;
  downloadProgress$: Observable<number>;
  
  // Configuration streams (RxJS for state changes)
  deviceConfig$: Observable<DeviceInfo>;
  recordingConfig$: Observable<RecordingConfiguration>;
  gnssConfig$: Observable<GNSSConfiguration>;
  
  // Error streams (RxJS for continuous error monitoring)
  connectionErrors$: Observable<RaceBoxError>;
  protocolErrors$: Observable<RaceBoxError>;
  deviceErrors$: Observable<RaceBoxError>;
  allErrors$: Observable<RaceBoxError>;
  
  // Commands (Promises for one-time actions)
  configureGNSS(config: GNSSConfiguration): Promise<void>;
  configureRecording(config: RecordingConfiguration): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  pauseRecording(): Promise<void>;
  downloadHistory(): Promise<LiveDataMessage[]>;
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