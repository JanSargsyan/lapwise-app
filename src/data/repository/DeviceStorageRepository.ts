import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeviceStorageRepository } from '@/src/domain/repository/DeviceStorageRepository';
import { DeviceType, fromString, Device } from '@/src/domain/model/device/Device';

const DEVICE_ID_KEY = 'connectedDeviceId';
const DEVICE_TYPE_KEY = 'connectedDeviceType';
const CACHED_DEVICES_KEY = 'cachedDevices';

export class DeviceStorageRepositoryImpl implements DeviceStorageRepository {
  async saveConnectedDevice(deviceId: string, deviceType: DeviceType): Promise<void> {
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    await AsyncStorage.setItem(DEVICE_TYPE_KEY, deviceType);
  }

  async getConnectedDeviceId(): Promise<string | null> {
    return AsyncStorage.getItem(DEVICE_ID_KEY);
  }

  async getConnectedDeviceType(): Promise<DeviceType | null> {
    return fromString(await AsyncStorage.getItem(DEVICE_TYPE_KEY) ?? '');
  }

  async clearConnectedDeviceId(): Promise<void> {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
    await AsyncStorage.removeItem(DEVICE_TYPE_KEY);
  }

  async saveDevices(devices: Device[]): Promise<void> {
    await AsyncStorage.setItem(CACHED_DEVICES_KEY, JSON.stringify(devices));
  }

  async getDevices(): Promise<Device[]> {
    const json = await AsyncStorage.getItem(CACHED_DEVICES_KEY);
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  }

  async clearDevices(): Promise<void> {
    await AsyncStorage.removeItem(CACHED_DEVICES_KEY);
  }
} 