import { Device } from "@/src/domain/model/device/Device";

export interface DeviceStorageRepository {
  // Methods for caching multiple Device objects
  // TODO: remove this method
  saveDevices(devices: Device[]): Promise<void>;


  getDevices(): Promise<Device[]>;
  clearDevices(): Promise<void>;

  // Add a single device, return added device or throw on error/duplicate
  addDevice(device: Device): Promise<Device>;
  removeDevice(id: string): Promise<boolean>;
  updateDevice(device: Device): Promise<void>;
} 