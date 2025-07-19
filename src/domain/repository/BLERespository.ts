import type { Device } from 'react-native-ble-plx';
import { DeviceType } from '../model/DeviceType';

export interface BLERespository {
  scanAndConnectToClosestRaceBox(): Promise<boolean>;
  scanAndConnect(deviceType: DeviceType): Promise<boolean>;
  // Invalid, should not depend on the external library
  getDevice(): Promise<Device | null>;
} 