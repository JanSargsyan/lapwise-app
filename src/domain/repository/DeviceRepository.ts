import type { Observable } from 'rxjs';
import { DeviceData } from '../model/DeviceData';

// TODO update with domain models, Domain layer should not depend on racebox-api

export interface DeviceRepository {
    subscribeLiveData(): Observable<DeviceData>;
    readDeviceInfo(): Promise<any>; // Replace 'any' with a proper DeviceInfo type if available
}