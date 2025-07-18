import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeviceStorageRepository } from '../../domain/repository/DeviceStorageRepository';

const DEVICE_ID_KEY = 'connectedDeviceId';

export class DeviceStorageRepositoryImpl implements DeviceStorageRepository {
  async saveConnectedDeviceId(deviceId: string): Promise<void> {
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  async getConnectedDeviceId(): Promise<string | null> {
    return AsyncStorage.getItem(DEVICE_ID_KEY);
  }

  async clearConnectedDeviceId(): Promise<void> {
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
  }
} 