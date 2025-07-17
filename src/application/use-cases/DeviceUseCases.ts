import { BLEManager } from '../../infrastructure/ble/BLEManager';
import { Device as BleDevice } from 'react-native-ble-plx';

export class DeviceUseCases {
  private bleManager: BLEManager;

  constructor(bleManager: BLEManager) {
    this.bleManager = bleManager;
  }

  async connectToClosestRaceBox(): Promise<BleDevice | null> {
    return this.bleManager.scanAndConnectToClosestRaceBox();
  }
} 