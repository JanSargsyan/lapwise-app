import { DeviceType } from '@/src/domain/model/DeviceType';
import { BLERespository } from '@/src/domain/repository/BLERespository';

export class ConnectToClosestDeviceUseCase {
  constructor(private bleRepository: BLERespository) {}

  async execute(deviceType: DeviceType): Promise<Boolean> {
    return this.bleRepository.scanAndConnect(deviceType);
  }
} 