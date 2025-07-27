import { RaceBoxRepository } from '@/src/domain/repository/RaceBoxRepository';
import { RecordingStateChange } from '@/src/domain/model/racebox/RecordingState';
import { Observable } from 'rxjs';

export class SubscribeStateChangesUseCase {
  constructor(private raceBoxRepository: RaceBoxRepository) {}

  execute(address: string): Observable<RecordingStateChange> {
    return this.raceBoxRepository.subscribeStateChanges(address);
  }
} 