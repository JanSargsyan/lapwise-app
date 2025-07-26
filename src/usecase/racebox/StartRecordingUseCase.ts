import { RaceBoxRepository } from '@/src/domain/repository/RaceBoxRepository';

export class StartRecordingUseCase {
  constructor(private raceBoxRepository: RaceBoxRepository) {}

  async execute(address: string): Promise<boolean | null> {
    return this.raceBoxRepository.startRecording(address);
  }
} 