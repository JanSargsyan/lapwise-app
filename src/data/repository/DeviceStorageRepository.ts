import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeviceStorageRepository } from '@/src/domain/repository/DeviceStorageRepository';
import { DeviceType, fromString } from '@/src/domain/model/DeviceType';

const DEVICE_ID_KEY = 'connectedDeviceId';
const DEVICE_TYPE_KEY = 'connectedDeviceType';

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
} 