import type { BLERespository } from '@/src/domain/repository/BLERespository';
import { Observable } from 'rxjs';

export class IsBLEDeviceConnectedUseCase {
  constructor(private bleRepository: BLERespository) {}

  execute(address: string): Observable<boolean> {
    return this.bleRepository.isDeviceConnected(address);
  }
} 