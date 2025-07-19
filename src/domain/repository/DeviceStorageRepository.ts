import { DeviceType } from "@/src/domain/model/livedata/DeviceType";

export interface DeviceStorageRepository {
  saveConnectedDevice(deviceId: string, deviceType: DeviceType): Promise<void>;
  getConnectedDeviceId(): Promise<string | null>;
  getConnectedDeviceType(): Promise<DeviceType | null>;
  clearConnectedDeviceId(): Promise<void>;
} 