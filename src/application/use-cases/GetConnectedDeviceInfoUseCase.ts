import { DeviceInfo } from '@/src/domain/model/DeviceInfo';
import { DeviceRepository } from '@/src/domain/repository/DeviceRepository';

export class GetConnectedDeviceInfoUseCase {
  constructor(private deviceRepository: DeviceRepository) {}

  execute(): Promise<DeviceInfo | null> {
    return this.deviceRepository.readDeviceInfo();
  }
  
} 