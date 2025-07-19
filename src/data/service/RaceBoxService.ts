import { BLERespository } from '@/src/domain/repository/BLERespository';
import { Device as BleDevice } from 'react-native-ble-plx';

export class RaceBoxService {
  constructor(
    private bleRepository: BLERespository
  ) {}

  // TODO: Add device validation, check if device is a RaceBox

  async getConnectedDevice(): Promise<BleDevice> {
    const found = await this.bleRepository.getDevice();
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
    }
    return connected;
  }

  async disconnectDevice(): Promise<void> {
    const found = await this.bleRepository.getDevice();
    if (found) {
      await found.cancelConnection();
    }
  }

  async isDeviceConnected(): Promise<boolean> {
    const found = await this.bleRepository.getDevice();
    if (!found) return false;
    if (typeof found.isConnected === 'function') {
      return found.isConnected();
    }
    return false;
  }
} 