import { Device, DeviceData } from '../entities/Device';

export interface IDeviceRepository {
  // Device discovery
  startScan(): Promise<void>;
  stopScan(): Promise<void>;
  getScannedDevices(): Promise<Device[]>;
  
  // Device connection
  connectToDevice(deviceId: string): Promise<Device>;
  disconnectFromDevice(deviceId: string): Promise<void>;
  getConnectedDevices(): Promise<Device[]>;
  
  // Data streaming
  startDataStream(deviceId: string): Promise<void>;
  stopDataStream(deviceId: string): Promise<void>;
  onDataReceived(deviceId: string, callback: (data: DeviceData) => void): void;
  offDataReceived(deviceId: string, callback: (data: DeviceData) => void): void;
  
  // Device info
  getDeviceInfo(deviceId: string): Promise<Partial<Device['info']>>;
  
  // Status
  isScanning(): boolean;
  isConnected(deviceId: string): boolean;
  
  // Cleanup
  destroy(): Promise<void>;

  // Optional: Enable/disable real BLE at runtime (for combined repo)
  setEnableRealBLE?(enable: boolean): void;
  getEnableRealBLE?(): boolean;
}

export interface DeviceConnectionConfig {
  timeout?: number;
  retryAttempts?: number;
  autoReconnect?: boolean;
}

export interface DeviceScanConfig {
  timeout?: number;
  filterByType?: string[];
  filterByName?: string[];
} 