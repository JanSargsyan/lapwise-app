import { RemoveDeviceFromCacheUseCase } from '@/src/usecase/cache/RemoveDeviceFromCacheUseCase';
import { DisconnectFromDeviceUseCase } from '@/src/usecase/ble/DisconnectFromDeviceUseCase';
import { IsBLEDeviceConnectedUseCase } from '@/src/usecase/ble/IsBLEDeviceConnectedUseCase';
import { Device } from '@/src/domain/model/device/Device';
import { BLEConnectionProps } from '@/src/domain/model/device/ConnectionType';

export class DisconnectAndRemoveBLEDeviceUseCase {
  constructor(
    private removeDeviceFromCacheUseCase: RemoveDeviceFromCacheUseCase,
    private disconnectFromDeviceUseCase: DisconnectFromDeviceUseCase,
    private isBLEDeviceConnectedUseCase: IsBLEDeviceConnectedUseCase
  ) {}

  async execute(device: Device): Promise<boolean> {
    // Check if device is connected
    const connectionProps = device.connectionProps as BLEConnectionProps;
    const address = connectionProps.address ?? "";
    let isConnected = false;
    await new Promise<void>((resolve) => {
      const sub = this.isBLEDeviceConnectedUseCase.execute(address).subscribe((connected: boolean) => {
        isConnected = connected;
        sub.unsubscribe();
        resolve();
      });
    });
    if (isConnected) {
      const disconnected = await this.disconnectFromDeviceUseCase.execute(address);
      if (!disconnected) return false;
    }
    const removed = await this.removeDeviceFromCacheUseCase.execute(device.id);
    return removed;
  }
} 