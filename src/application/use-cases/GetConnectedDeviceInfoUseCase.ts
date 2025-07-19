import { DeviceRepositoryProvider } from '@/src/domain/DeviceRepositoryProvider';
import { DeviceInfo } from '@/src/domain/model/DeviceInfo';

export class GetConnectedDeviceInfoUseCase {
  constructor(private deviceRepositoryProvider: DeviceRepositoryProvider) {}

  execute(): Promise<DeviceInfo | null> {
    return this.deviceRepositoryProvider.get().then(repository => repository.readDeviceInfo());
  }
  
} 