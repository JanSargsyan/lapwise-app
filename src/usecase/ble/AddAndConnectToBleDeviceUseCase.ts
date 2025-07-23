import type { Device } from '@/src/domain/model/device/Device';
import { AddDeviceToCacheUseCase } from '@/src/usecase/cache/AddDeviceToCacheUseCase';
import { ConnectToBLEDeviceUseCase } from '@/src/usecase/ble/ConnectToBLEDeviceUseCase';
import { DeviceType } from '@/src/domain/model/device/DeviceType';
import { DeviceCatalog } from '@/src/domain/model/device/DeviceCatalog';
import { BLEConnectionProps } from '@/src/domain/model/device/ConnectionType';

export class AddAndConnectToBleDeviceUseCase {
  constructor(
    private addDeviceToCacheUseCase: AddDeviceToCacheUseCase,
    private connectToBLEDeviceUseCase: ConnectToBLEDeviceUseCase
  ) {}

  async execute(address: string, deviceType: DeviceType): Promise<Device | null> {
    const device = DeviceCatalog[deviceType];
    if(device.connectionType !== "BLE") {
      throw new Error('Device is not a BLE device');
    }

    (device.connectionProps as BLEConnectionProps).address = address;
    const added = await this.addDeviceToCacheUseCase.execute(device);
    if (!added) {
      return null;
    }
    // device.id is address, device.id is also used as DeviceType in your enums
    const connected = await this.connectToBLEDeviceUseCase.execute(address); // If device.id is not DeviceType, adjust accordingly
    if (!connected) {
      throw new Error('Failed to connect to device');
    }
    return device;
  }
} 