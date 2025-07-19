import type { Device } from 'react-native-ble-plx';
import { DeviceType } from '../model/DeviceType';

export interface BLERespository {
  scanAndConnectToClosestRaceBox(): Promise<boolean>;
  scanAndConnect(deviceType: DeviceType): Promise<boolean>;
  getDevice(): Promise<Device | null>;
} 