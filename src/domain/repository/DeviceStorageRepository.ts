import { DeviceType, Device } from "@/src/domain/model/device/Device";

export interface DeviceStorageRepository {
  saveConnectedDevice(deviceId: string, deviceType: DeviceType): Promise<void>;
  getConnectedDeviceId(): Promise<string | null>;
  getConnectedDeviceType(): Promise<DeviceType | null>;
  clearConnectedDeviceId(): Promise<void>;

  // New methods for caching multiple Device objects
  saveDevices(devices: Device[]): Promise<void>;
  getDevices(): Promise<Device[]>;
  clearDevices(): Promise<void>;
} 