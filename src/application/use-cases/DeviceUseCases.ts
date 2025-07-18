import { BLEManager } from '../../data/bluetooth/BLEManager';
import { Device as BleDevice } from 'react-native-ble-plx';
import { RaceBoxApi } from 'racebox-api';
import type { RaceBoxLiveData } from 'racebox-api/types';
import { mapRaceBoxLiveDataToDeviceData } from '../../data/mapper/LiveDataMapper';
import type { DeviceData } from '../../domain/model/DeviceData';
import { Observable } from 'rxjs';

export class DeviceUseCases {
  private bleManager: BLEManager;

  constructor(bleManager: BLEManager) {
    this.bleManager = bleManager;
  }

  async connectToClosestRaceBox(): Promise<BleDevice | null> {
    return this.bleManager.scanAndConnectToClosestRaceBox();
  }

  observeLiveData(deviceId: string): Observable<DeviceData> {
    return new Observable<DeviceData>(subscriber => {
      let unsub: (() => void) | undefined;
      (async () => {
        try {
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
          unsub = api.subscribeLiveData((live: RaceBoxLiveData) => {
            subscriber.next(mapRaceBoxLiveDataToDeviceData(live));
          });
        } catch (e) {
          subscriber.error(e);
        }
      })();
      return () => {
        if (unsub) unsub();
      };
    });
  }
} 