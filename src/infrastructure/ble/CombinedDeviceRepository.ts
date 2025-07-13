import { IDeviceRepository, DeviceConnectionConfig, DeviceScanConfig } from '../../domain/repositories/IDeviceRepository';
import { Device, DeviceData } from '../../domain/entities/Device';
import { IDeviceProtocolService } from '../../domain/services/IDeviceProtocolService';
import { MockDeviceRepository } from './MockDeviceRepository';
import { BLEDeviceRepository } from './BLEDeviceRepository';

export class CombinedDeviceRepository implements IDeviceRepository {
  private mockRepository: MockDeviceRepository;
  private bleRepository: BLEDeviceRepository;
  private devices: Map<string, Device> = new Map();
  private connectedDevices: Set<string> = new Set();
  private isScanningState: boolean = false;
  private dataCallbacks: Map<string, Set<(data: DeviceData) => void>> = new Map();
  private enableRealBLE: boolean = true;

  constructor(protocolService: IDeviceProtocolService) {
    this.mockRepository = new MockDeviceRepository(protocolService);
    this.bleRepository = new BLEDeviceRepository(protocolService);
    this.setupDataForwarding();
  }

  setEnableRealBLE(enable: boolean) {
    this.enableRealBLE = enable;
  }

  getEnableRealBLE() {
    return this.enableRealBLE;
  }

  async checkBLEAvailability(): Promise<{ available: boolean; error?: string }> {
    if (!this.enableRealBLE) {
      return { available: false, error: 'Real BLE is disabled' };
    }
    
    return await this.bleRepository.checkBLEState();
  }

  isBLEAvailable(): boolean {
    return this.enableRealBLE && this.bleRepository.isBLEAvailable();
  }

  private setupDataForwarding(): void {
    // Forward mock device data
    this.mockRepository.onDataReceived('mock-racebox-1', (data) => {
      this.notifyDataCallbacks('mock-racebox-1', data);
    });
    this.mockRepository.onDataReceived('mock-racebox-2', (data) => {
      this.notifyDataCallbacks('mock-racebox-2', data);
    });
    this.mockRepository.onDataReceived('mock-device-1', (data) => {
      this.notifyDataCallbacks('mock-device-1', data);
    });
  }

  async startScan(): Promise<void> {
    this.isScanningState = true;
    this.devices.clear();
    
    console.log('🔧 CombinedDeviceRepository: Starting scan with real BLE enabled:', this.enableRealBLE);
    
    await this.mockRepository.startScan();
    if (this.enableRealBLE) {
      try {
        console.log('🔧 CombinedDeviceRepository: Starting real BLE scan');
        await this.bleRepository.startScan();
        console.log('🔧 CombinedDeviceRepository: Real BLE scan started successfully');
      } catch (error) {
        console.warn('🔧 CombinedDeviceRepository: Error starting BLE scan:', error);
        // Don't throw error, just log it so mock devices still work
        // The BLE repository will handle permission issues internally
      }
    } else {
      console.log('🔧 CombinedDeviceRepository: Real BLE scanning disabled');
    }
  }

  async stopScan(): Promise<void> {
    this.isScanningState = false;
    await this.mockRepository.stopScan();
    if (this.enableRealBLE) {
      try {
        await this.bleRepository.stopScan();
      } catch (error) {
        console.warn('🔧 CombinedDeviceRepository: Error stopping BLE scan:', error);
      }
    }
  }

  async getScannedDevices(): Promise<Device[]> {
    const allDevices: Device[] = [];
    
    try {
      const mockDevices = await this.mockRepository.getScannedDevices();
      console.log('🔧 CombinedDeviceRepository: Found mock devices:', mockDevices.length);
      allDevices.push(...mockDevices);
    } catch (error) {
      console.warn('🔧 CombinedDeviceRepository: Error getting mock devices:', error);
    }
    
    if (this.enableRealBLE) {
      try {
        const bleDevices = await this.bleRepository.getScannedDevices();
        console.log('🔧 CombinedDeviceRepository: Found real BLE devices:', bleDevices.length);
        bleDevices.forEach(device => {
          console.log('🔧 CombinedDeviceRepository: Real device:', device.info.name, device.info.id);
        });
        allDevices.push(...bleDevices);
      } catch (error) {
        console.warn('🔧 CombinedDeviceRepository: Error getting BLE devices:', error);
      }
    } else {
      console.log('🔧 CombinedDeviceRepository: Real BLE scanning disabled, skipping real devices');
    }
    
    this.devices.clear();
    allDevices.forEach(device => {
      this.devices.set(device.info.id, device);
    });
    
    console.log('🔧 CombinedDeviceRepository: Total devices found:', allDevices.length);
    return allDevices;
  }

  async connectToDevice(deviceId: string): Promise<Device> {
    if (deviceId.startsWith('mock-')) {
      const device = await this.mockRepository.connectToDevice(deviceId);
      this.connectedDevices.add(deviceId);
      return device;
    } else if (this.enableRealBLE) {
      try {
        const device = await this.bleRepository.connectToDevice(deviceId);
        this.connectedDevices.add(deviceId);
        return device;
      } catch (error) {
        console.error('🔧 CombinedDeviceRepository: Failed to connect to BLE device:', error);
        throw error;
      }
    } else {
      throw new Error('Real BLE is disabled');
    }
  }

  async disconnectFromDevice(deviceId: string): Promise<void> {
    if (deviceId.startsWith('mock-')) {
      await this.mockRepository.disconnectFromDevice(deviceId);
    } else if (this.enableRealBLE) {
      try {
        await this.bleRepository.disconnectFromDevice(deviceId);
      } catch (error) {
        console.warn('🔧 CombinedDeviceRepository: Error disconnecting from BLE device:', error);
      }
    }
    this.connectedDevices.delete(deviceId);
  }

  async getConnectedDevices(): Promise<Device[]> {
    const connectedDevices: Device[] = [];
    try {
      const mockConnected = await this.mockRepository.getConnectedDevices();
      connectedDevices.push(...mockConnected);
    } catch (error) {
      console.warn('🔧 CombinedDeviceRepository: Error getting connected mock devices:', error);
    }
    if (this.enableRealBLE) {
      try {
        const bleConnected = await this.bleRepository.getConnectedDevices();
        connectedDevices.push(...bleConnected);
      } catch (error) {
        console.warn('🔧 CombinedDeviceRepository: Error getting connected BLE devices:', error);
      }
    }
    return connectedDevices;
  }

  async startDataStream(deviceId: string): Promise<void> {
    if (deviceId.startsWith('mock-')) {
      await this.mockRepository.startDataStream(deviceId);
    } else if (this.enableRealBLE) {
      try {
        await this.bleRepository.startDataStream(deviceId);
      } catch (error) {
        console.error('🔧 CombinedDeviceRepository: Failed to start BLE data stream:', error);
        throw error;
      }
    } else {
      throw new Error('Real BLE is disabled');
    }
  }

  async stopDataStream(deviceId: string): Promise<void> {
    if (deviceId.startsWith('mock-')) {
      await this.mockRepository.stopDataStream(deviceId);
    } else if (this.enableRealBLE) {
      try {
        await this.bleRepository.stopDataStream(deviceId);
      } catch (error) {
        console.warn('🔧 CombinedDeviceRepository: Error stopping BLE data stream:', error);
      }
    }
  }

  onDataReceived(deviceId: string, callback: (data: DeviceData) => void): void {
    if (!this.dataCallbacks.has(deviceId)) {
      this.dataCallbacks.set(deviceId, new Set());
    }
    this.dataCallbacks.get(deviceId)!.add(callback);
  }

  offDataReceived(deviceId: string, callback: (data: DeviceData) => void): void {
    const callbacks = this.dataCallbacks.get(deviceId);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  async getDeviceInfo(deviceId: string): Promise<Partial<Device['info']>> {
    if (deviceId.startsWith('mock-')) {
      return await this.mockRepository.getDeviceInfo(deviceId);
    } else if (this.enableRealBLE) {
      try {
        return await this.bleRepository.getDeviceInfo(deviceId);
      } catch (error) {
        console.warn('🔧 CombinedDeviceRepository: Error getting BLE device info:', error);
        return {};
      }
    } else {
      return {};
    }
  }

  isScanning(): boolean {
    return this.isScanningState;
  }

  isConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }

  async destroy(): Promise<void> {
    try {
      await this.mockRepository.destroy();
      await this.bleRepository.destroy();
    } catch (error) {
      console.warn('🔧 CombinedDeviceRepository: Error during cleanup:', error);
    }
    this.devices.clear();
    this.connectedDevices.clear();
    this.dataCallbacks.clear();
  }

  private notifyDataCallbacks(deviceId: string, data: DeviceData): void {
    const callbacks = this.dataCallbacks.get(deviceId);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
} 