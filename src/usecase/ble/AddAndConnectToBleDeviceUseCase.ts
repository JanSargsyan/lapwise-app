import type { Device } from '@/src/domain/model/device/Device';
import { AddDeviceToCacheUseCase } from '../cache/AddDeviceToCacheUseCase';
import { ConnectToBLEDeviceUseCase } from './ConnectToBLEDeviceUseCase';

export class AddAndConnectToBleDeviceUseCase {
  constructor(
    private addDeviceToCacheUseCase: AddDeviceToCacheUseCase,
    private connectToBLEDeviceUseCase: ConnectToBLEDeviceUseCase
  ) {}

  async execute(device: Device): Promise<Device | null> {
    const added = await this.addDeviceToCacheUseCase.execute(device);
    if (!added) {
      return null;
    }
    // device.id is address, device.id is also used as DeviceType in your enums
    const connected = await this.connectToBLEDeviceUseCase.execute(device.id, device.id as any); // If device.id is not DeviceType, adjust accordingly
    if (!connected) {
      throw new Error('Failed to connect to device');
    }
    return device;
  }
} 