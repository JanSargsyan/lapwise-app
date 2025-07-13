import { BleManager, Device as BLEDevice } from 'react-native-ble-plx';
import { IDeviceRepository, DeviceConnectionConfig, DeviceScanConfig } from '../../domain/repositories/IDeviceRepository';
import { Device, DeviceInfo, DeviceData, DeviceType } from '../../domain/entities/Device';
import { IDeviceProtocolService } from '../../domain/services/IDeviceProtocolService';
import { PermissionsAndroid, Platform } from 'react-native';

export class BLEDeviceRepository implements IDeviceRepository {
  private bleManager: BleManager | null = null;
  private devices: Map<string, Device> = new Map();
  private connectedDevices: Set<string> = new Set();
  private isScanningState: boolean = false;
  private dataCallbacks: Map<string, Set<(data: DeviceData) => void>> = new Map();
  private protocolService: IDeviceProtocolService;

  constructor(protocolService: IDeviceProtocolService) {
    this.protocolService = protocolService;
    this.initializeBLE();
  }

  private async requestBLEPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        console.log('🔧 BLEDeviceRepository: Requesting BLE permissions...');
        
        const permissions = [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        const allGranted = Object.values(granted).every(permission => permission === PermissionsAndroid.RESULTS.GRANTED);
        
        if (allGranted) {
          console.log('🔧 BLEDeviceRepository: All BLE permissions granted');
        } else {
          console.warn('🔧 BLEDeviceRepository: Some BLE permissions denied:', granted);
          // Check which specific permissions were denied
          const deniedPermissions = Object.entries(granted)
            .filter(([_, status]) => status !== PermissionsAndroid.RESULTS.GRANTED)
            .map(([permission, status]) => `${permission}: ${status}`);
          
          console.warn('🔧 BLEDeviceRepository: Denied permissions:', deniedPermissions);
        }
        
        return allGranted;
      } catch (error) {
        console.warn('🔧 BLEDeviceRepository: Permission request failed:', error);
        return false;
      }
    }
    return true; // iOS handles permissions through Info.plist
  }

  private initializeBLE(): void {
    try {
      console.log('🔧 BLEDeviceRepository: Initializing BLE Manager');
      this.bleManager = new BleManager();
      console.log('🔧 BLEDeviceRepository: BLE Manager initialized successfully');
    } catch (error) {
      console.warn('🔧 BLEDeviceRepository: BLE Manager initialization failed:', error);
      this.bleManager = null;
    }
  }

  isBLEAvailable(): boolean {
    return this.bleManager !== null;
  }

  async checkBLEState(): Promise<{ available: boolean; error?: string }> {
    if (!this.bleManager) {
      return { available: false, error: 'BLE Manager not initialized' };
    }

    try {
      const state = await this.bleManager.state();
      console.log('🔧 BLEDeviceRepository: BLE state:', state);
      return { available: state === 'PoweredOn' };
    } catch (error) {
      console.warn('🔧 BLEDeviceRepository: Error checking BLE state:', error);
      return { available: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async startScan(): Promise<void> {
    if (!this.bleManager) {
      throw new Error('BLE Manager not available');
    }

    // Check BLE state first
    const bleState = await this.checkBLEState();
    if (!bleState.available) {
      console.warn('🔧 BLEDeviceRepository: BLE not available:', bleState.error);
      this.isScanningState = false;
      return;
    }

    // Request permissions first
    const permissionsGranted = await this.requestBLEPermissions();
    if (!permissionsGranted) {
      console.warn('🔧 BLEDeviceRepository: BLE permissions not granted, BLE scanning will be disabled');
      // Don't throw error, just log it so the app can continue with mock devices
      this.isScanningState = false;
      return;
    }

    this.isScanningState = true;
    this.devices.clear();

    console.log('🔧 BLEDeviceRepository: Starting BLE scan');
    this.bleManager.startDeviceScan(null, null, (error, bleDevice) => {
      if (error) {
        console.error('🔧 BLEDeviceRepository: BLE scan error:', error);
        return;
      }

      if (bleDevice && !this.devices.has(bleDevice.id)) {
        console.log('🔧 BLEDeviceRepository: Found device:', bleDevice.name || bleDevice.id);
        const device = this.createDeviceFromBLE(bleDevice);
        this.devices.set(bleDevice.id, device);
      }
    });
  }

  async stopScan(): Promise<void> {
    if (this.bleManager) {
      this.bleManager.stopDeviceScan();
    }
    this.isScanningState = false;
  }

  async getScannedDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async connectToDevice(deviceId: string): Promise<Device> {
    if (!this.bleManager) {
      throw new Error('BLE Manager not available');
    }

    const bleDevice = await this.bleManager.connectToDevice(deviceId);
    await bleDevice.discoverAllServicesAndCharacteristics();

    const device = this.devices.get(deviceId);
    if (device) {
      device.updateStatus({ isConnected: true });
      this.connectedDevices.add(deviceId);
    }

    return device || this.createDeviceFromBLE(bleDevice);
  }

  async disconnectFromDevice(deviceId: string): Promise<void> {
    if (!this.bleManager) {
      return;
    }

    try {
      await this.bleManager.cancelDeviceConnection(deviceId);
    } catch (error) {
      console.warn('Error disconnecting device:', error);
    }

    const device = this.devices.get(deviceId);
    if (device) {
      device.updateStatus({ isConnected: false });
    }
    this.connectedDevices.delete(deviceId);
  }

  async getConnectedDevices(): Promise<Device[]> {
    return Array.from(this.devices.values()).filter(device => 
      this.connectedDevices.has(device.info.id)
    );
  }

  async startDataStream(deviceId: string): Promise<void> {
    if (!this.bleManager) {
      throw new Error('BLE Manager not available');
    }

    console.log('🔧 BLEDeviceRepository: Starting data stream for device', deviceId);
    const bleDevice = await this.bleManager.connectToDevice(deviceId);
    const serviceUUIDs = this.protocolService.getServiceUUIDs();
    const characteristicUUIDs = this.protocolService.getCharacteristicUUIDs();

    console.log('🔧 BLEDeviceRepository: Service UUIDs:', serviceUUIDs);
    console.log('🔧 BLEDeviceRepository: Characteristic UUIDs:', characteristicUUIDs);

    // Monitor characteristics for data
    for (const serviceUUID of serviceUUIDs) {
      for (const characteristicUUID of characteristicUUIDs) {
        try {
          console.log('🔧 BLEDeviceRepository: Monitoring', serviceUUID, characteristicUUID);
          bleDevice.monitorCharacteristicForService(
            serviceUUID,
            characteristicUUID,
            (error, characteristic) => {
              if (error) {
                console.error('Characteristic monitoring error:', error);
                return;
              }

              if (characteristic?.value) {
                const rawData = characteristic.value;
                const deviceData = this.protocolService.parseRawData(rawData);
                
                if (deviceData) {
                  this.notifyDataCallbacks(deviceId, deviceData);
                }
              }
            }
          );
        } catch (error) {
          console.warn(`Failed to monitor characteristic ${characteristicUUID}:`, error);
        }
      }
    }
  }

  async stopDataStream(deviceId: string): Promise<void> {
    // Implementation would depend on subscription management
    // For now, just remove callbacks
    this.dataCallbacks.delete(deviceId);
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
    const device = this.devices.get(deviceId);
    return device?.info || {};
  }

  isScanning(): boolean {
    return this.isScanningState;
  }

  isConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }

  async destroy(): Promise<void> {
    if (this.bleManager) {
      this.bleManager.destroy();
    }
    this.devices.clear();
    this.connectedDevices.clear();
    this.dataCallbacks.clear();
  }

  private createDeviceFromBLE(bleDevice: BLEDevice): Device {
    const deviceInfo: DeviceInfo = {
      id: bleDevice.id,
      name: bleDevice.name || bleDevice.localName || 'Unknown Device',
      type: DeviceType.CUSTOM, // Will be updated by protocol service
      manufacturer: undefined,
    };

    const device = new Device(deviceInfo);
    
    // Try to identify device type using protocol service
    if (this.protocolService.canHandleDevice(deviceInfo)) {
      device.info.type = this.protocolService.getSupportedDeviceTypes()[0];
    }

    return device;
  }

  private notifyDataCallbacks(deviceId: string, data: DeviceData): void {
    const callbacks = this.dataCallbacks.get(deviceId);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
} 