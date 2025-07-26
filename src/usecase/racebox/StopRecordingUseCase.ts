import { RaceBoxRepository } from '@/src/domain/repository/RaceBoxRepository';

export class StopRecordingUseCase {
  constructor(private raceBoxRepository: RaceBoxRepository) {}

  async execute(address: string): Promise<boolean | null> {
    return this.raceBoxRepository.stopRecording(address);
  }
} 