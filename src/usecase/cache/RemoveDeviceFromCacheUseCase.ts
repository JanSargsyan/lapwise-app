import type { DeviceStorageRepository } from '@/src/domain/repository/DeviceStorageRepository';

export class RemoveDeviceFromCacheUseCase {
  constructor(private deviceStorageRepository: DeviceStorageRepository) {}

  async execute(id: string): Promise<boolean> {
    return this.deviceStorageRepository.removeDevice(id);
  }
} 