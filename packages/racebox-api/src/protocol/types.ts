export {};

export enum DataRate {
  Hz25 = 0,
  Hz10 = 1,
  Hz5 = 2,
  Hz1 = 3,
  Hz20 = 4, // FW 3.3+
}

export interface RecordingFlags {
  waitForGnssFix: boolean;
  enableStationaryFilter: boolean;
  enableNoFixFilter: boolean;
  enableAutoShutdown: boolean;
  waitForDataBeforeShutdown: boolean;
}

export interface RecordingConfigPayload {
  enable: boolean;
  dataRate: DataRate;
  flags: RecordingFlags;
  stationarySpeedThreshold: number; // mm/s
  stationaryDetectionInterval: number; // s
  noFixDetectionInterval: number; // s
  autoShutdownInterval: number; // s
}

export interface AckNackPayload {
  messageClass: number;
  messageId: number;
}

export interface UnlockMemoryPayload {
  securityCode: number; // UInt32
}

export interface DataDownloadReplyPayload {
  expectedMaxHistoryMessages: number;
}

export interface RecordingStatusPayload {
  recordingState: number; // 0 = inactive, 1 = active
  memoryLevel: number; // 0-100%
  securityFlags: number; // bitmask
  storedMessages: number; // UInt32
  totalCapacity: number; // UInt32
}

export interface RaceBoxLiveData {
  iTOW: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  validityFlags: number;
  timeAccuracy: number;
  nanoseconds: number;
  fixStatus: number;
  fixStatusFlags: number;
  dateTimeFlags: number;
  numSV: number;
  longitude: number;
  latitude: number;
  wgsAltitude: number;
  mslAltitude: number;
  horizontalAccuracy: number;
  verticalAccuracy: number;
  speed: number;
  heading: number;
  speedAccuracy: number;
  headingAccuracy: number;
  pdop: number;
  latLonFlags: number;
  batteryOrVoltage: number;
  gForceX: number;
  gForceY: number;
  gForceZ: number;
  rotationRateX: number;
  rotationRateY: number;
  rotationRateZ: number;
}

export interface StateChangePayload {
  state: number;
  dataRate: DataRate;
  flags: RecordingFlags;
  stationarySpeedThreshold: number;
  stationaryDetectionInterval: number;
  noFixDetectionInterval: number;
  autoShutdownInterval: number;
}

export interface EraseProgressPayload {
  percent: number; // 0-100
}

export interface GnssConfigPayload {
  platformModel: number; // 0-8
  enable3DSpeed: boolean;
  minHorizontalAccuracy: number; // meters
}
