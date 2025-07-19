import { DeviceType } from '@/src/domain/model/device/DeviceType';

export interface BLERespository {
  scanAndConnect(deviceType: DeviceType): Promise<boolean>;
} 