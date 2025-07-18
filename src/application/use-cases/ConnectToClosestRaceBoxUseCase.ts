import { BLERespository } from '@/src/domain/repository/BLERespository';

export class ConnectToClosestRaceBoxUseCase {
  constructor(private bleRepository: BLERespository) {}

  async execute(): Promise<Boolean> {
    return this.bleRepository.scanAndConnectToClosestRaceBox();
  }
} 