import { BLERespository } from '@/src/domain/repository/BLERespository';

export class DisconnectFromDeviceUseCase {
  constructor(private bleRepository: BLERespository) {}

  async execute(address: string): Promise<boolean> {
    return this.bleRepository.disconnectFromDevice(address);
  }
} 