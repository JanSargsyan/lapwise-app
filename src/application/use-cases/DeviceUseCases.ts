import { BLEManager } from '../../infrastructure/ble/BLEManager';
import { Device as BleDevice } from 'react-native-ble-plx';
import { RaceBoxApi } from 'racebox-api';
import type { RaceBoxLiveData } from 'racebox-api/types';
import { mapRaceBoxLiveDataToDeviceData } from './LiveDataMapper';
import type { DeviceData } from '../../domain/model/DeviceData';

export class DeviceUseCases {
  private bleManager: BLEManager;

  constructor(bleManager: BLEManager) {
    this.bleManager = bleManager;
  }

  async connectToClosestRaceBox(): Promise<BleDevice | null> {
    return this.bleManager.scanAndConnectToClosestRaceBox();
  }

  async subscribeToLiveData(deviceId: string, onData: (data: DeviceData) => void): Promise<() => void> {
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
    }
    const api = new RaceBoxApi(connected);
    const unsubscribe = api.subscribeLiveData((live: RaceBoxLiveData) => {
      onData(mapRaceBoxLiveDataToDeviceData(live));
    });
    return unsubscribe;
  }
} 