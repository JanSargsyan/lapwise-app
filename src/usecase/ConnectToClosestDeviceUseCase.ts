import { DeviceType } from '@/src/domain/model/device/Device';
import { BLERespository } from '@/src/domain/repository/BLERespository';

export class ConnectToClosestDeviceUseCase {
  constructor(private bleRepository: BLERespository) {}

  async execute(deviceType: DeviceType): Promise<boolean> {
    return this.bleRepository.scanAndConnect(deviceType);
  }
} 