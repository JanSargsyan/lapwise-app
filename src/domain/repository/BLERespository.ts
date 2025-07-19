import { DeviceType } from '@/src/domain/model/livedata/DeviceType';

export interface BLERespository {
  scanAndConnect(deviceType: DeviceType): Promise<boolean>;
} 