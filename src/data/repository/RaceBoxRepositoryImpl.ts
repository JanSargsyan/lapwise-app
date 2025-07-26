import { RaceBoxApi } from 'racebox-api';
import type { AckNackPayload, RecordingStatusPayload, RaceBoxLiveData } from 'racebox-api/types';
import { mapRaceBoxLiveDataToDeviceData } from '@/src/data/mapper/LiveDataMapper';
import type { DeviceData } from '@/src/domain/model/livedata/DeviceData';
import { Observable } from 'rxjs';
import { DeviceInfo } from '@/src/domain/model/device/DeviceInfo';
import { RecordingConfig } from '@/src/domain/model/racebox/RecordingConfig';
import { RaceBoxRepository } from '@/src/domain/repository/RaceBoxRepository';
import { mapRecordingConfigPayloadToDomain, mapRecordingConfigDomainToPayload } from '@/src/data/mapper/RecordingConfigMapper';
import { BleManager } from 'react-native-ble-plx';

export class RaceBoxRepositoryImpl implements RaceBoxRepository {
  private apiCache = new Map<string, RaceBoxApi>();

  constructor(
    private manager: BleManager,
  ) {}

  private async getApi(address: string): Promise<RaceBoxApi> {
    // Check if we already have a cached API instance
    if (this.apiCache.has(address)) {
      const cachedApi = this.apiCache.get(address)!;
      // Verify the device is still connected
      const isConnected = await this.manager.isDeviceConnected(address);
      if (isConnected) {
        return cachedApi;
      } else {
        // Device disconnected, remove from cache
        this.apiCache.delete(address);
      }
    }

    // Create new API instance
    const isConnected = await this.manager.isDeviceConnected(address);
    if (!isConnected) {
      throw new Error('Device not connected');
    }

    const devices = await this.manager.devices([address]);
    const device = devices[0];
    const api = new RaceBoxApi(device);
    
    // Cache the API instance
    this.apiCache.set(address, api);
    return api;
  }

  async readRecordingConfig(address: string): Promise<RecordingConfig | null> {
    const api = await this.getApi(address);
    const payload = await api.readRecordingConfig();
    console.log("readRecordingConfig answer", payload);
    if (!payload) return null;
    return mapRecordingConfigPayloadToDomain(payload);
  }

  async setRecordingConfig(address: string, config: RecordingConfig): Promise<boolean | null> {
    const api = await this.getApi(address);
    const payload = mapRecordingConfigDomainToPayload(config);
    const ackNack = await api.setRecordingConfig(payload);
    console.log("setRecordingConfig answer", ackNack);
    return ackNack?.messageId == 2;
  }

  async startRecording(address: string): Promise<boolean | null> {
    const api = await this.getApi(address);
    const ackNack = await api.startRecording();
    console.log("startRecording answer", ackNack);
    return ackNack?.messageId == 2;

  }

  async stopRecording(address: string): Promise<boolean | null> {
    const api = await this.getApi(address);
    const ackNack = await api.stopRecording();
    console.log("stopRecording answer", ackNack);
    return ackNack?.messageId == 2;
  }

  subscribeLiveData(address: string): Observable<DeviceData> {
    return new Observable<DeviceData>(subscriber => {
      let unsub: (() => void) | undefined;
      (async () => {
        try {
          const api = await this.getApi(address);
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

  async readDeviceInfo(address: string): Promise<DeviceInfo> {
    const api = await this.getApi(address);

    const deviceInfo = await api.readDeviceInfo();

    return {
      model: deviceInfo?.model ?? "",
      serial: deviceInfo?.serial ?? "",
      firmware: deviceInfo?.firmware ?? "",
      hardware: deviceInfo?.hardware ?? "",
      manufacturer: deviceInfo?.manufacturer ?? ""  
    }
  }

  async getRecordingStatus(address: string): Promise<RecordingStatusPayload | null> {
    const api = await this.getApi(address);
    return api.getRecordingStatus();
  }
} 