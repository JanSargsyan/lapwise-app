import type { Device } from '@/src/domain/model/device/Device';
import type { DeviceStorageRepository } from '@/src/domain/repository/DeviceStorageRepository';

export class AddDeviceToCacheUseCase {
  constructor(private deviceStorageRepository: DeviceStorageRepository) {}

  async execute(device: Device): Promise<Device | null> {
    const devices = await this.deviceStorageRepository.getDevices();
    if (devices.some(d => d.id === device.id)) {
      return null;
    }
    await this.deviceStorageRepository.saveDevices([...devices, device]);
    return device;
  }
} 