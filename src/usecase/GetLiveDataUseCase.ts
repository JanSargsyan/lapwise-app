import { from, mergeMap, type Observable } from 'rxjs';
import type { DeviceData } from '@/src/domain/model/livedata/DeviceData';
import { DeviceRepositoryProvider } from '@/src/domain/DeviceRepositoryProvider';

export class GetLiveDataUseCase {
  constructor(private deviceRepositoryProvider: DeviceRepositoryProvider) {}

  execute(): Observable<DeviceData> {
    return from(this.deviceRepositoryProvider.get()).pipe(
      mergeMap(repository => repository.subscribeLiveData())
    );
  }
} 