import { DeviceType } from '../model/DeviceType';

export interface BLERespository {
  scanAndConnect(deviceType: DeviceType): Promise<boolean>;
} 