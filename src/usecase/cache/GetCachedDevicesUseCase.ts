import type { Device } from '@/src/domain/model/device/Device';
import type { DeviceStorageRepository } from '@/src/domain/repository/DeviceStorageRepository';

export class GetCachedDevicesUseCase {
  constructor(private deviceStorageRepository: DeviceStorageRepository) {}

  async execute(): Promise<Device[]> {
    return this.deviceStorageRepository.getDevices();
  }
} 