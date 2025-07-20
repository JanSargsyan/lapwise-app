import { DeviceType as DeviceType } from '@/src/domain/model/device/DeviceType';
import { DeviceType as Device } from '@/src/domain/model/device/Device';
import type { Observable } from 'rxjs';

export interface BLERespository {
  scanAndConnect(deviceType: DeviceType): Promise<boolean>;
  scanForDevices(deviceType: Device): Observable<ScannedBleDevice[]>;
}

export interface ScannedBleDevice {
  id: string;
  name: string;
  rssi: number;
} 