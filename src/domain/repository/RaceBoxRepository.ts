import type { DeviceData } from '../model/DeviceData';
import type { RecordingConfigPayload, AckNackPayload, RecordingStatusPayload, RaceBoxLiveData } from 'racebox-api/types';
import type { Observable } from 'rxjs';

export interface RaceBoxRepository {
  readRecordingConfig(deviceId: string): Promise<RecordingConfigPayload | null>;
  setRecordingConfig(deviceId: string, config: RecordingConfigPayload): Promise<AckNackPayload | null>;
  startRecording(deviceId: string): Promise<AckNackPayload | null>;
  stopRecording(deviceId: string): Promise<AckNackPayload | null>;
  subscribeLiveData(deviceId: string): Observable<DeviceData>;
  readDeviceInfo(deviceId: string): Promise<any>; // Replace 'any' with a proper DeviceInfo type if available
  getRecordingStatus(deviceId: string): Promise<RecordingStatusPayload | null>;
  // Optionally add utility access if needed
} 