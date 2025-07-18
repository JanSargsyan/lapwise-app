import { RaceBoxApi } from 'racebox-api';
import type { RecordingConfigPayload, AckNackPayload, RecordingStatusPayload, RaceBoxLiveData } from 'racebox-api/types';
import { mapRaceBoxLiveDataToDeviceData } from '../mapper/LiveDataMapper';
import type { DeviceData } from '../../domain/model/DeviceData';
import type { RaceBoxRepository } from '../../domain/repository/RaceBoxRepository';
import { Observable } from 'rxjs';
import { RaceBoxService } from '../service/RaceBoxService';
import { DeviceRepository } from '@/src/domain/repository/DeviceRepository';
import { DeviceInfo } from '@/src/domain/model/DeviceInfo';

export class RaceBoxRepositoryImpl implements RaceBoxRepository, DeviceRepository{
  constructor(private raceBoxService: RaceBoxService) {}

  private async getApi(): Promise<RaceBoxApi> {
    const connected = await this.raceBoxService.getConnectedDevice();
    return new RaceBoxApi(connected);
  }

  async readRecordingConfig(): Promise<RecordingConfigPayload | null> {
    const api = await this.getApi();
    return api.readRecordingConfig();
  }

  async setRecordingConfig(config: RecordingConfigPayload): Promise<AckNackPayload | null> {
    const api = await this.getApi();
    return api.setRecordingConfig(config);
  }

  async startRecording(): Promise<AckNackPayload | null> {
    const api = await this.getApi();
    return api.startRecording();
  }

  async stopRecording(): Promise<AckNackPayload | null> {
    const api = await this.getApi();
    return api.stopRecording();
  }

  subscribeLiveData(): Observable<DeviceData> {
    return new Observable<DeviceData>(subscriber => {
      let unsub: (() => void) | undefined;
      (async () => {
        try {
          const api = await this.getApi();
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

  async readDeviceInfo(): Promise<DeviceInfo> {
    const api = await this.getApi();

    const deviceInfo = await api.readDeviceInfo();

    return {
      model: deviceInfo?.model ?? "",
      serial: deviceInfo?.serial ?? "",
      firmware: deviceInfo?.firmware ?? "",
      hardware: deviceInfo?.hardware ?? "",
      manufacturer: deviceInfo?.manufacturer ?? ""  
    }
  }

  async getRecordingStatus(deviceId: string): Promise<RecordingStatusPayload | null> {
    const api = await this.getApi(deviceId);
    return api.getRecordingStatus();
  }
} 