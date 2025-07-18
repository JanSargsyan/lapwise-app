import type { Observable } from 'rxjs';
import type { DeviceData } from '../../domain/model/DeviceData';
import { DeviceRepository } from '@/src/domain/repository/DeviceRepository';

export class GetLiveDataUseCase {
  constructor(private deviceRepository: DeviceRepository) {}

  execute(): Observable<DeviceData> {
    return this.deviceRepository.subscribeLiveData();
  }
} 