import { RaceBoxRepository } from '@/src/domain/repository/RaceBoxRepository';
import { RecordingConfig } from '@/src/domain/model/racebox/RecordingConfig';

export class StartRecordingUseCase {
  constructor(private raceBoxRepository: RaceBoxRepository) {}

  async execute(address: string): Promise<boolean | null> {
    // Read current recording config
    const currentConfig = await this.raceBoxRepository.readRecordingConfig(address);
    if (!currentConfig) {
      return false;
    }

    // Update enable to true
    const updatedConfig: RecordingConfig = {
      ...currentConfig,
      enable: true
    };

    // Save the updated config
    return await this.raceBoxRepository.setRecordingConfig(address, updatedConfig);
  }
} 