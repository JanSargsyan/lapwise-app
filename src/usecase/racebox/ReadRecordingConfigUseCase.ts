import { RaceBoxRepository } from '@/src/domain/repository/RaceBoxRepository';
import { RecordingConfig } from '@/src/domain/model/racebox/RecordingConfig';

export class ReadRecordingConfigUseCase {
  constructor(private raceBoxRepository: RaceBoxRepository) {}

  async execute(address: string): Promise<RecordingConfig | null> {
    return this.raceBoxRepository.readRecordingConfig(address);
  }
} 