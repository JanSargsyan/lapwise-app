import { IDeviceRepository } from '../../domain/repositories/IDeviceRepository';
import { Device, DeviceData } from '../../domain/entities/Device';

export class DeviceUseCases {
  constructor(private deviceRepository: IDeviceRepository) {}

  async scanForDevices(): Promise<void> {
    try {
      await this.deviceRepository.startScan();
    } catch (error) {
      console.error('Error starting device scan:', error);
      throw error;
    }
  }

  async stopScanning(): Promise<void> {
    try {
      await this.deviceRepository.stopScan();
    } catch (error) {
      console.error('Error stopping device scan:', error);
      throw error;
    }
  }

  async getScannedDevices(): Promise<Device[]> {
    try {
      return await this.deviceRepository.getScannedDevices();
    } catch (error) {
      console.error('Error getting scanned devices:', error);
      throw error;
    }
  }

  async connectToDevice(deviceId: string): Promise<Device> {
    try {
      const device = await this.deviceRepository.connectToDevice(deviceId);
      
      // Start data streaming after connection
      await this.deviceRepository.startDataStream(deviceId);
      
      return device;
    } catch (error) {
      console.error('Error connecting to device:', error);
      throw error;
    }
  }

  async disconnectFromDevice(deviceId: string): Promise<void> {
    try {
      await this.deviceRepository.stopDataStream(deviceId);
      await this.deviceRepository.disconnectFromDevice(deviceId);
    } catch (error) {
      console.error('Error disconnecting from device:', error);
      throw error;
    }
  }

  async getConnectedDevices(): Promise<Device[]> {
    try {
      return await this.deviceRepository.getConnectedDevices();
    } catch (error) {
      console.error('Error getting connected devices:', error);
      throw error;
    }
  }

  async getDeviceInfo(deviceId: string): Promise<Partial<Device['info']>> {
    try {
      return await this.deviceRepository.getDeviceInfo(deviceId);
    } catch (error) {
      console.error('Error getting device info:', error);
      throw error;
    }
  }

  isScanning(): boolean {
    return this.deviceRepository.isScanning();
  }

  isConnected(deviceId: string): boolean {
    return this.deviceRepository.isConnected(deviceId);
  }

  onDeviceDataReceived(deviceId: string, callback: (data: DeviceData) => void): void {
    this.deviceRepository.onDataReceived(deviceId, callback);
  }

  offDeviceDataReceived(deviceId: string, callback: (data: DeviceData) => void): void {
    this.deviceRepository.offDataReceived(deviceId, callback);
  }

  async cleanup(): Promise<void> {
    try {
      await this.deviceRepository.destroy();
    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }
} 