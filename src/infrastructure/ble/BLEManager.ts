import { BleManager, Device } from 'react-native-ble-plx';

export class BLEManager {
  private manager: BleManager;

  constructor() {
    this.manager = new BleManager();
  }

  async scanAndConnectToClosestRaceBox(): Promise<Device | null> {
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
          // Stop scan after 5 seconds and connect
          setTimeout(async () => {
            this.manager.stopDeviceScan();
            subscription.remove();
            if (closestDevice) {
              try {
                const connected = await closestDevice.connect();
                resolve(connected);
              } catch (e) {
                reject(e);
              }
            } else {
              resolve(null);
            }
          }, 5000);
        }
      }, true);
    });
  }
} 