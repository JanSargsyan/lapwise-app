import { BLERespository } from '@/src/domain/repository/BLERespository';

export class ConnectToBLEDeviceUseCase {
  constructor(private bleRepository: BLERespository) {}

  async execute(address: string): Promise<boolean> {
    return this.bleRepository.connectToDevice(address);
  }
} 