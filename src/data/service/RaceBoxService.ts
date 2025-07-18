import { BLEManager } from '../bluetooth/BLEManager';
import { Device as BleDevice } from 'react-native-ble-plx';

export class RaceBoxService {
  constructor(private bleManager: BLEManager) {}

  async getConnectedDevice(deviceId: string): Promise<BleDevice> {
    const found = await this.bleManager.getDeviceById(deviceId);
    if (!found) throw new Error('Device not found');
    let connected = found;
    if (typeof found.isConnected === 'function') {
      const isConnected = await found.isConnected();
      if (!isConnected) {
        connected = await found.connect();
      }
    }
    if (typeof connected.discoverAllServicesAndCharacteristics === 'function') {
      connected = await connected.discoverAllServicesAndCharacteristics();
      console.log(connected.characteristicsForService)
    }
    return connected;
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const found = await this.bleManager.getDeviceById(deviceId);
    if (found) {
      await found.cancelConnection();
    }
  }

  async isDeviceConnected(deviceId: string): Promise<boolean> {
    const found = await this.bleManager.getDeviceById(deviceId);
    if (!found) return false;
    if (typeof found.isConnected === 'function') {
      return found.isConnected();
    }
    return false;
  }
} 