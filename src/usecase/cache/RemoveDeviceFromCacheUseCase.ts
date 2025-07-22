import type { DeviceStorageRepository } from '@/src/domain/repository/DeviceStorageRepository';

export class RemoveDeviceFromCacheUseCase {
  constructor(private deviceStorageRepository: DeviceStorageRepository) {}

  async execute(address: string): Promise<boolean> {
    const devices = await this.deviceStorageRepository.getDevices();
    const filtered = devices.filter(d => d.id !== address);
    if (filtered.length === devices.length) {
      return false; // Not found
    }
    await this.deviceStorageRepository.saveDevices(filtered);
    return true;
  }
} 