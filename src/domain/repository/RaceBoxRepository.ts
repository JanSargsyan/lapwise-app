import type { DeviceData } from '@/src/domain/model/livedata/DeviceData';
import type { RecordingStatusPayload } from 'racebox-api/types';
import type { Observable } from 'rxjs';
import { DeviceInfo } from '@/src/domain/model/device/DeviceInfo';
import { RecordingConfig } from '@/src/domain/model/racebox/RecordingConfig';

// TODO update with domain models, Domain layer should not depend on racebox-api

export interface RaceBoxRepository {
  readRecordingConfig(address: string): Promise<RecordingConfig | null>;
  setRecordingConfig(address: string, config: RecordingConfig): Promise<boolean | null>;
  subscribeLiveData(address: string): Observable<DeviceData>;
  readDeviceInfo(address: string): Promise<DeviceInfo>;
  getRecordingStatus(address: string): Promise<RecordingStatusPayload | null>;
  // Optionally add utility access if needed
}  