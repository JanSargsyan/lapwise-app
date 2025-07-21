import { BleManager, Device as BlePlxDevice } from 'react-native-ble-plx';
import type { BLERespository, ScannedBleDevice } from '@/src/domain/repository/BLERespository';
import type { DeviceStorageRepository } from '@/src/domain/repository/DeviceStorageRepository';
import { DeviceType } from '@/src/domain/model/device/Device';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';
import { DeviceCatalog } from '@/src/domain/model/device/DeviceCatalog';
import { BLEConnectionProps } from '@/src/domain/model/device/ConnectionType';

export class BLERespositoryImpl implements BLERespository {
  private discoveredDevices: Map<string, { device: BlePlxDevice; lastSeen: number }> = new Map();
  private devicesSubject = new BehaviorSubject<ScannedBleDevice[]>([]);
  private expiryIntervalSub?: Subscription;
  private scanSubscription?: { remove: () => void };
  private scanning: boolean = false;

  constructor(
    private manager: BleManager,
    private deviceStorageRepository: DeviceStorageRepository
  ) {}

  /**
   * Scans for BLE devices, emitting a map of { [address]: label } for devices seen in the last 5 seconds.
   * Devices are removed if not rediscovered in 5 seconds.
   * Scanning only starts when BLE is powered on.
   */
  scanForDevices(deviceType: DeviceType): Observable<ScannedBleDevice[]> {
    // Stop any previous scan and clear state
    this.stopScanAndCleanup();
    this.discoveredDevices.clear();
    this.devicesSubject.next([]);
    this.scanning = true;

    // Helper: emit current devices as ScannedBleDevice[]
    const emitDevices = () => {
      const now = Date.now();
      const active: ScannedBleDevice[] = [];
      this.discoveredDevices.forEach(({ device, lastSeen }) => {
        if (now - lastSeen <= 5000) {
          active.push({
            id: device.id,
            name: device.name || device.id,
            rssi: device.rssi ?? 0,
          });
        }
      });
      this.devicesSubject.next(active);
    };

    // Start expiry interval
    this.expiryIntervalSub = interval(1000).subscribe(() => {
      const now = Date.now();
      let changed = false;
      for (const [id, { lastSeen }] of this.discoveredDevices.entries()) {
        if (now - lastSeen > 20000) {
          this.discoveredDevices.delete(id);
          changed = true;
        }
      }
      if (changed) emitDevices();
    });

    // Wait for BLE powered on, then scan
    this.scanSubscription = this.manager.onStateChange((state) => {
      if (state === 'PoweredOn' && this.scanning) {
        this.manager.startDeviceScan(null, null, (error, device) => {
          
          if (error) {
            this.stopScanAndCleanup();
            this.devicesSubject.error(error);
            return;
          }
          if (device && device.id) {
            const advertisedNamePrefix = (DeviceCatalog[deviceType].connectionProps as BLEConnectionProps).advertisedNamePrefix;
            if (device.name?.startsWith(advertisedNamePrefix)) {
              this.discoveredDevices.set(device.id, { device, lastSeen: Date.now() });
              emitDevices();
            }
          }
        });
      }
    }, true);

    // Return observable that cleans up on unsubscribe
    return new Observable<ScannedBleDevice[]>(subscriber => {
      const sub = this.devicesSubject.subscribe(subscriber);
      return () => {
        sub.unsubscribe();
        this.stopScanAndCleanup();
      };
    });
  }

  /**
   * Stops scanning and cleans up intervals/subscriptions.
   */
  private stopScanAndCleanup() {
    if (this.scanning) {
      this.manager.stopDeviceScan();
      this.scanning = false;
    }
    if (this.expiryIntervalSub) {
      this.expiryIntervalSub.unsubscribe();
      this.expiryIntervalSub = undefined;
    }
    if (this.scanSubscription) {
      this.scanSubscription.remove();
      this.scanSubscription = undefined;
    }
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

  async connectToDevice(address: string, deviceType: DeviceType): Promise<boolean> {
    try {
      const device = await this.manager.connectToDevice(address);
      await this.deviceStorageRepository.saveConnectedDevice(device.id, deviceType);
      return true;
    } catch {
      return false;
    }
  }
} 