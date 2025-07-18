import type { DeviceData } from '../model/DeviceData';
import type { RecordingConfigPayload, AckNackPayload, RecordingStatusPayload } from 'racebox-api/types';
import type { Observable } from 'rxjs';

// TODO update with domain models, Domain layer should not depend on racebox-api

export interface RaceBoxRepository {
  readRecordingConfig(): Promise<RecordingConfigPayload | null>;
  setRecordingConfig(config: RecordingConfigPayload): Promise<AckNackPayload | null>;
  startRecording(): Promise<AckNackPayload | null>;
  stopRecording(): Promise<AckNackPayload | null>;
  subscribeLiveData(): Observable<DeviceData>;
  readDeviceInfo(): Promise<any>; // Replace 'any' with a proper DeviceInfo type if available
  getRecordingStatus(): Promise<RecordingStatusPayload | null>;
  // Optionally add utility access if needed
}  