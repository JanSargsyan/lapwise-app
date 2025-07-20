import { type Observable } from 'rxjs';
import { BLERespository, ScannedBleDevice } from '@/src/domain/repository/BLERespository';
import { DeviceType } from '@/src/domain/model/device/Device';

export class ScanForBLEDevicesUseCase {
  constructor(private bleRepository: BLERespository) {}

  execute(deviceType: DeviceType): Observable<ScannedBleDevice[]> {
    return this.bleRepository.scanForDevices(deviceType);
  }
} 
