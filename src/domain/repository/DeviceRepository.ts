import type { Observable } from 'rxjs';
import { DeviceData } from '@/src/domain/model/DeviceData';
import { DeviceInfo } from '@/src/domain/model/DeviceInfo';

// TODO update with domain models, Domain layer should not depend on racebox-api

export interface DeviceRepository {
    subscribeLiveData(): Observable<DeviceData>;
    readDeviceInfo(): Promise<DeviceInfo>;
}