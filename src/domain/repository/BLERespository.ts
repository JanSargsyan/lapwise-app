import { DeviceType } from '@/src/domain/model/DeviceType';

export interface BLERespository {
  scanAndConnect(deviceType: DeviceType): Promise<boolean>;
} 