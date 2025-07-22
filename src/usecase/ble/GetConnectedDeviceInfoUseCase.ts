import { DeviceRepositoryProvider } from '@/src/domain/DeviceRepositoryProvider';
import { DeviceInfo } from '@/src/domain/model/device/DeviceInfo';

// TODO: remove this use case
export class GetConnectedDeviceInfoUseCase {
  constructor(private deviceRepositoryProvider: DeviceRepositoryProvider) {}

  execute(): Promise<DeviceInfo | null> {
    return this.deviceRepositoryProvider.get().then(repository => repository.readDeviceInfo());
  }
  
} 