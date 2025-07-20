import { type Observable } from 'rxjs';
import type { DeviceData } from '@/src/domain/model/livedata/DeviceData';
import { BLERespository } from '@/src/domain/repository/BLERespository';
import { DeviceType } from '@/src/domain/model/device/Device';

export class ScanForBLEDevicesUseCase {
  constructor(private bleRepository: BLERespository) {}

  execute(deviceType: DeviceType): Observable<DeviceData> {
    return this.bleRepository.scanForBleDevices(deviceType);
  }
} 
