import { RaceBoxRepository } from '@/src/domain/repository/RaceBoxRepository';
import { RecordingConfig } from '@/src/domain/model/racebox/RecordingConfig';

export class SetRecordingConfigUseCase {
  constructor(private raceBoxRepository: RaceBoxRepository) {}

  async execute(address: string, config: RecordingConfig): Promise<boolean | null> {
    return this.raceBoxRepository.setRecordingConfig(address, config);
  }
} 