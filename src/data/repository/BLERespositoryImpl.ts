import { BleManager } from 'react-native-ble-plx';
import type { BLERespository, ScannedBleDevice } from '@/src/domain/repository/BLERespository';
import type { DeviceStorageRepository } from '@/src/domain/repository/DeviceStorageRepository';
// import { DeviceType } from '@/src/domain/model/device/DeviceType';
import { DeviceType } from '@/src/domain/model/device/Device';
import { Observable } from 'rxjs';

export class BLERespositoryImpl implements BLERespository {
  constructor(
    private manager: BleManager,
    private deviceStorageRepository: DeviceStorageRepository
  ) {}

  scanForDevices(deviceType: DeviceType): Observable<ScannedBleDevice[]> {
    return new Observable<ScannedBleDevice[]>(subscriber => {
      subscriber.next([]);
      subscriber.complete();
    });
  }


  async scanAndConnect(deviceType: DeviceType): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let found = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const subscription = this.manager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          this.manager.startDeviceScan(null, null, async (error, device) => {
            if (error) {
              if (timeoutId) clearTimeout(timeoutId);
              subscription.remove();
              this.manager.stopDeviceScan();
              reject(error);
              return;
            }
            if (
              device &&
              device.name &&
              device.name.startsWith(deviceType)
            ) {
              if (timeoutId) clearTimeout(timeoutId);
              found = true;
              this.manager.stopDeviceScan();
              subscription.remove();
              try {
                const connected = await device.connect();
                await this.deviceStorageRepository.saveConnectedDevice(connected.id, deviceType);
                resolve(true);
              } catch (e) {
                reject(e);
              }
            }
          });
          // Timeout after 10 seconds if not found
          timeoutId = setTimeout(() => {
            if (!found) {
              this.manager.stopDeviceScan();
              subscription.remove();
              resolve(false);
            }
          }, 10000);
        }
      }, true);
    });
  }
} 