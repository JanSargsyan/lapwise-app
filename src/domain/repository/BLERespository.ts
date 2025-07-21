import { DeviceType } from '@/src/domain/model/device/Device';
import type { Observable } from 'rxjs';

export interface BLERespository {
  scanAndConnect(deviceType: DeviceType): Promise<boolean>;
  scanForDevices(deviceType: DeviceType): Observable<ScannedBleDevice[]>;
}

export interface ScannedBleDevice {
  id: string;
  name: string;
  rssi: number;
} 