import { DeviceType } from '@/src/domain/model/device/DeviceType';
import type { Observable } from 'rxjs';

export interface BLERespository {
  scanAndConnect(deviceType: DeviceType): Promise<boolean>;
  scanForDevices(deviceType: DeviceType): Observable<ScannedBleDevice[]>;
  connectToDevice(address: string): Promise<boolean>;
  isDeviceConnected(address: string): Promise<boolean>;
}

export interface ScannedBleDevice {
  id: string;
  name: string;
  rssi: number;
  address: string;
} 