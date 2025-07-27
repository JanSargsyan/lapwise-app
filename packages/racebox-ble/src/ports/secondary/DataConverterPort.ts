import { Position, MotionData, GNSSStatus, SystemStatus, SensorData } from '../../domain/value-objects';
import { RecordingStatus, MemoryStatus } from '../../domain/value-objects';

export interface RawPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
}

export interface RawMotion {
  speed: number;
  heading: number;
  gForceX: number;
  gForceY: number;
  gForceZ: number;
  rotationRateX: number;
  rotationRateY: number;
  rotationRateZ: number;
}

export interface RawGNSS {
  fixStatus: number;
  numSatellites: number;
  pdop: number;
  horizontalAccuracy: number;
  verticalAccuracy: number;
}

export interface RawSystem {
  batteryLevel: number;
  isCharging: boolean;
  temperature?: number;
}

export interface RawRecordingStatus {
  isRecording: boolean;
  isPaused: boolean;
  startTime: number;
  duration: number;
  dataPoints: number;
  memoryLevel: number;
}

export interface RawMemoryStatus {
  totalCapacity: number;
  usedCapacity: number;
  freeCapacity: number;
  memoryLevel: number;
}

export interface DataConverterPort {
  // Position conversion
  convertRawPosition(raw: RawPosition): Position;
  convertPositionToRaw(position: Position): RawPosition;
  
  // Motion conversion
  convertRawMotion(raw: RawMotion): MotionData;
  convertMotionToRaw(motion: MotionData): RawMotion;
  
  // GNSS conversion
  convertRawGNSS(raw: RawGNSS): GNSSStatus;
  convertGNSSToRaw(gnss: GNSSStatus): RawGNSS;
  
  // System conversion
  convertRawSystem(raw: RawSystem): SystemStatus;
  convertSystemToRaw(system: SystemStatus): RawSystem;
  
  // Sensor conversion
  convertRawSensorData(raw: RawMotion): SensorData;
  convertSensorDataToRaw(sensor: SensorData): RawMotion;
  
  // Status conversion
  convertRawRecordingStatus(raw: RawRecordingStatus): RecordingStatus;
  convertRawMemoryStatus(raw: RawMemoryStatus): MemoryStatus;
  
  // Utility methods
  validateRawData(raw: any): boolean;
  sanitizeRawData(raw: any): any;
} 