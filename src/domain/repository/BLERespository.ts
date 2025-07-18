import type { Device } from 'react-native-ble-plx';

export interface BLERespository {
  scanAndConnectToClosestRaceBox(): Promise<boolean>;
  getDevice(): Promise<Device | null>;
} 