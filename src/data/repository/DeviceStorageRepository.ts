import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeviceStorageRepository } from '@/src/domain/repository/DeviceStorageRepository';
import { Device } from '@/src/domain/model/device/Device';

const CACHED_DEVICES_KEY = 'cachedDevices';

class IOException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IOException';
  }
}

export class DeviceStorageRepositoryImpl implements DeviceStorageRepository {
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

  async addDevice(device: Device): Promise<Device> {
    const devices = await this.getDevices();
    if (devices.some(d => d.id === device.id)) {
      throw new Error('Device already exists in cache');
    }
    const newDevices = [...devices, device];
    try {
      await this.saveDevices(newDevices);
    } catch {
      throw new IOException('Failed to save device to cache');
    }
    return device;
  }

  async removeDevice(device: Device): Promise<void> {
    const devices = await this.getDevices();
    const filtered = devices.filter(d => d.id !== device.id);
    try {
      await this.saveDevices(filtered);
    } catch {
      throw new IOException('Failed to remove device from cache');
    }
  }

  async updateDevice(device: Device): Promise<void> {
    const devices = await this.getDevices();
    const idx = devices.findIndex(d => d.id === device.id);
    if (idx === -1) {
      throw new Error('Device not found in cache');
    }
    devices[idx] = device;
    try {
      await this.saveDevices(devices);
    } catch {
      throw new IOException('Failed to update device in cache');
    }
  }
} 