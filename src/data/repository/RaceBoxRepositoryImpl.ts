import { RaceBoxApi } from 'racebox-api';
import type { RecordingConfigPayload, AckNackPayload, RecordingStatusPayload, RaceBoxLiveData } from 'racebox-api/types';
import { mapRaceBoxLiveDataToDeviceData } from '../mapper/LiveDataMapper';
import type { DeviceData } from '../../domain/model/DeviceData';
import type { RaceBoxRepository } from '../../domain/repository/RaceBoxRepository';
import { Observable } from 'rxjs';
import { RaceBoxService } from '../service/RaceBoxService';
import { ApplicationGraph } from '@/src/application/di';
import { injectable, inject } from 'react-obsidian';

@injectable(ApplicationGraph)
export class RaceBoxRepositoryImpl implements RaceBoxRepository {
  constructor(@inject("RaceBoxService") private raceBoxService: RaceBoxService) {}

  private async getApi(deviceId: string): Promise<RaceBoxApi> {
    const connected = await this.raceBoxService.getConnectedDevice(deviceId);
    return new RaceBoxApi(connected);
  }

  async readRecordingConfig(deviceId: string): Promise<RecordingConfigPayload | null> {
    const api = await this.getApi(deviceId);
    return api.readRecordingConfig();
  }

  async setRecordingConfig(deviceId: string, config: RecordingConfigPayload): Promise<AckNackPayload | null> {
    const api = await this.getApi(deviceId);
    return api.setRecordingConfig(config);
  }

  async startRecording(deviceId: string): Promise<AckNackPayload | null> {
    const api = await this.getApi(deviceId);
    return api.startRecording();
  }

  async stopRecording(deviceId: string): Promise<AckNackPayload | null> {
    const api = await this.getApi(deviceId);
    return api.stopRecording();
  }

  subscribeLiveData(deviceId: string): Observable<DeviceData> {
    return new Observable<DeviceData>(subscriber => {
      let unsub: (() => void) | undefined;
      (async () => {
        try {
          const api = await this.getApi(deviceId);
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

  async readDeviceInfo(deviceId: string): Promise<any> {
    const api = await this.getApi(deviceId);
    return api.readDeviceInfo();
  }

  async getRecordingStatus(deviceId: string): Promise<RecordingStatusPayload | null> {
    const api = await this.getApi(deviceId);
    return api.getRecordingStatus();
  }
} 