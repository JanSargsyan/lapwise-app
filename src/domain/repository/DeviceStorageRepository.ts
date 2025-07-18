export interface DeviceStorageRepository {
  saveConnectedDeviceId(deviceId: string): Promise<void>;
  getConnectedDeviceId(): Promise<string | null>;
  clearConnectedDeviceId(): Promise<void>;
} 