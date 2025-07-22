import { type Observable } from 'rxjs';
import { BLERespository, ScannedBleDevice } from '@/src/domain/repository/BLERespository';
import { DeviceType } from '@/src/domain/model/device/DeviceType';

export class ScanForBLEDevicesUseCase {
  constructor(private bleRepository: BLERespository) {}

  execute(deviceType: DeviceType): Observable<ScannedBleDevice[]> {
    console.log('Scanning for BLE devices for device type:', deviceType);
    return this.bleRepository.scanForDevices(deviceType);
  }
} 
