export enum RecordingState {
  STOPPED = 0,
  RECORDING = 1,
  PAUSED = 2
}

export interface RecordingStateChange {
  state: RecordingState;
  timestamp: Date;
  config?: RecordingConfig;
} 