import { BleManager } from 'react-native-ble-plx';
import type { BLERespository, ScannedBleDevice } from '@/src/domain/repository/BLERespository';
// import type { DeviceStorageRepository } from '@/src/domain/repository/DeviceStorageRepository';
import { DeviceType } from '@/src/domain/model/device/DeviceType';
import { Observable } from 'rxjs';
import { DeviceCatalog } from '@/src/domain/model/device/DeviceCatalog';
import { BLEConnectionProps } from '@/src/domain/model/device/ConnectionType';


export class BLERespositoryImpl implements BLERespository {

  constructor(
    private manager: BleManager,
    // private deviceStorageRepository: DeviceStorageRepository
  ) {}

  scanForDevices(deviceType: DeviceType): Observable<ScannedBleDevice[]> {
    return new Observable<ScannedBleDevice[]>(subscriber => {
      const devices: Record<string, ScannedBleDevice> = {};
      const subscription = this.manager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          this.manager.startDeviceScan(null, null, (error, device) => {
            if (error) {
              subscriber.error(error);
              this.manager.stopDeviceScan();
              subscription.remove();
              return;
            }
            
            if (
              device &&
              device.name &&
              device.name.startsWith((DeviceCatalog[deviceType].connectionProps as BLEConnectionProps).advertisedNamePrefix)
            ) {
              devices[device.id] = {
                id: device.id, // BLE device UUID
                name: device.name,
                rssi: device.rssi ?? 0,
                address: device.id, // BLE device object does not have a separate address property
              };
              subscriber.next(Object.values(devices));
            }
          });
        }
      }, true);

      // Cleanup logic on unsubscribe
      return () => {
        this.manager.stopDeviceScan();
        subscription.remove();
      };
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
                await device.connect();
                // await this.deviceStorageRepository.saveConnectedDevice(connected.id, deviceType);
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

  async connectToDevice(address: string): Promise<boolean> {
    try {
      await this.manager.connectToDevice(address);
      return true;
    } catch {
      return false;
    }
  }

  async disconnectFromDevice(address: string): Promise<boolean> {
    try {
      await this.manager.cancelDeviceConnection(address);
      return true;
    } catch {
      return false;
    }
  }

  isDeviceConnected(deviceId: string): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      let disconnectSubscription: { remove: () => void } | null = null;
      let cancelled = false;

      // Check initial connection state using isDeviceConnected
      (async () => {
        try {
          const connected = await this.manager.isDeviceConnected(deviceId);
          subscriber.next(connected);
        } catch {
          subscriber.next(false);
        }
      })();

      // Setup disconnection listener
      disconnectSubscription = this.manager.onDeviceDisconnected(deviceId, async (error, device) => {
        if (cancelled) return;
        if (error) {
          console.error(JSON.stringify(error, null, 4));
        }
        if (device) {
          console.info(JSON.stringify(device, null, 4));
          subscriber.next(false);
        }
      });

      return () => {
        cancelled = true;
        if (disconnectSubscription) disconnectSubscription.remove();
      };
    });
  }

} 