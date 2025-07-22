import type { BLERespository } from '@/src/domain/repository/BLERespository';

export class IsBLEDeviceConnectedUseCase {
  constructor(private bleRepository: BLERespository) {}

  async execute(address: string): Promise<boolean> {
    return this.bleRepository.isDeviceConnected(address);
  }
} 