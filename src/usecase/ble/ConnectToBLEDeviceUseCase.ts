import { DeviceType } from '@/src/domain/model/device/Device';
import { BLERespository } from '@/src/domain/repository/BLERespository';

export class ConnectToBLEDeviceUseCase {
  constructor(private bleRepository: BLERespository) {}

  async execute(address: string, deviceType: DeviceType): Promise<boolean> {
    return this.bleRepository.connectToDevice(address, deviceType);
  }
} 