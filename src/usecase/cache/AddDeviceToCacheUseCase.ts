import type { Device } from '@/src/domain/model/device/Device';
import type { DeviceStorageRepository } from '@/src/domain/repository/DeviceStorageRepository';

export class AddDeviceToCacheUseCase {
  constructor(private deviceStorageRepository: DeviceStorageRepository) {}

  async execute(device: Device): Promise<Device | null> {
    try {
      return await this.deviceStorageRepository.addDevice(device);
    } catch (e) {
      if (e instanceof Error && e.message === 'Device already exists in cache') {
        return null;
      }
      throw e;
    }
  }
} 