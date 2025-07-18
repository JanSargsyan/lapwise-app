import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'connectedDeviceId';

export async function saveConnectedDeviceId(deviceId: string): Promise<void> {
  await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
}

export async function getConnectedDeviceId(): Promise<string | null> {
  return AsyncStorage.getItem(DEVICE_ID_KEY);
}

export async function clearConnectedDeviceId(): Promise<void> {
  await AsyncStorage.removeItem(DEVICE_ID_KEY);
} 