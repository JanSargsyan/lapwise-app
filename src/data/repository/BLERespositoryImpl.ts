import { BleManager, Device } from 'react-native-ble-plx';
import type { BLERespository } from '../../domain/repository/BLERespository';
import type { DeviceStorageRepository } from '../../domain/repository/DeviceStorageRepository';
import { DeviceType } from '@/src/domain/model/DeviceType';

export class BLERespositoryImpl implements BLERespository {
  constructor(
    private manager: BleManager,
    private deviceStorageRepository: DeviceStorageRepository
  ) {}

  // TODO: Make generic

  async scanAndConnectToClosestRaceBox(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let closestDevice: Device | null = null;
      let strongestRssi = -Infinity;
      const subscription = this.manager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          this.manager.startDeviceScan(null, null, (error, device) => {
            if (error) {
              subscription.remove();
              this.manager.stopDeviceScan();
              reject(error);
              return;
            }
            if (device && device.name && device.name.startsWith('RaceBox')) {
              if (device.rssi !== null && device.rssi > strongestRssi) {
                closestDevice = device;
                strongestRssi = device.rssi;
              }
            }
          });
          // Stop scan after 10 seconds and connect
          setTimeout(async () => {
            this.manager.stopDeviceScan();
            subscription.remove();
            if (closestDevice) {
              try {
                const connected = await closestDevice.connect();
                await this.deviceStorageRepository.saveConnectedDeviceId(connected.id);
                resolve(true);
              } catch (e) {
                reject(e);
              }
            } else {
              resolve(false);
            }
          }, 10000);
        }
      }, true);
    });
  }

  async scanAndConnect(deviceType: DeviceType): Promise<boolean> {
    return new Promise((resolve, reject) => {
        let closestDevice: Device | null = null;
        let strongestRssi = -Infinity;
        const subscription = this.manager.onStateChange((state) => {
          if (state === 'PoweredOn') {
            this.manager.startDeviceScan(null, null, (error, device) => {
              if (error) {
                subscription.remove();
                this.manager.stopDeviceScan();
                reject(error);
                return;
              }
              if (device && device.name && device.name.startsWith(deviceType)) {
                if (device.rssi !== null && device.rssi > strongestRssi) {
                  closestDevice = device;
                  strongestRssi = device.rssi;
                }
              }
            });
            // Stop scan after 10 seconds and connect
            setTimeout(async () => {
              this.manager.stopDeviceScan();
              subscription.remove();
              if (closestDevice) {
                try {
                  const connected = await closestDevice.connect();
                  await this.deviceStorageRepository.saveConnectedDevice(connected.id, deviceType);
                  resolve(true);
                } catch (e) {
                  reject(e);
                }
              } else {
                resolve(false);
              }
            }, 10000);
          }
        }, true);
      });
  }

  async getDevice(): Promise<Device | null> {
    const id = await this.deviceStorageRepository.getConnectedDeviceId();
    if (!id) return null;
    try {
      const device = await this.manager.devices([id]);
      return device && device.length > 0 ? device[0] : null;
    } catch {
      return null;
    }
  }
} 