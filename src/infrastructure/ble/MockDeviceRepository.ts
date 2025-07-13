import { IDeviceRepository } from '../../domain/repositories/IDeviceRepository';
import { Device, DeviceInfo, DeviceData, DeviceType } from '../../domain/entities/Device';
import { IDeviceProtocolService } from '../../domain/services/IDeviceProtocolService';

export class MockDeviceRepository implements IDeviceRepository {
  private devices: Map<string, Device> = new Map();
  private connectedDevices: Set<string> = new Set();
  private isScanningState: boolean = false;
  private dataCallbacks: Map<string, Set<(data: DeviceData) => void>> = new Map();
  private protocolService: IDeviceProtocolService;
  private scanInterval: ReturnType<typeof setInterval> | null = null;
  private dataIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor(protocolService: IDeviceProtocolService) {
    console.log('🔧 MockDeviceRepository: Initializing');
    this.protocolService = protocolService;
    this.initializeMockDevices();
  }

  private initializeMockDevices(): void {
    const mockDevices: DeviceInfo[] = [
      {
        id: 'mock-racebox-1',
        name: 'RaceBox Mini',
        type: DeviceType.RACEBOX,
        manufacturer: 'RaceBox',
        model: 'Mini',
        serialNumber: 'RB123456',
        firmwareVersion: 'v3.2.1',
        hardwareVersion: 'v1.0',
      },
      {
        id: 'mock-racebox-2',
        name: 'RaceBox Micro',
        type: DeviceType.RACEBOX,
        manufacturer: 'RaceBox',
        model: 'Micro',
        serialNumber: 'RB789012',
        firmwareVersion: 'v3.1.5',
        hardwareVersion: 'v1.0',
      },
      {
        id: 'mock-device-1',
        name: 'Test Device',
        type: DeviceType.CUSTOM,
        manufacturer: 'Test Manufacturer',
        model: 'Test Model',
        serialNumber: 'TEST001',
        firmwareVersion: 'v1.0.0',
        hardwareVersion: 'v1.0',
      },
    ];

    mockDevices.forEach(deviceInfo => {
      const device = new Device(deviceInfo);
      this.devices.set(deviceInfo.id, device);
    });
  }

  async startScan(): Promise<void> {
    console.log('🔧 MockDeviceRepository: Starting scan');
    this.isScanningState = true;
    this.devices.clear();
    this.initializeMockDevices();

    // Simulate device discovery
    this.scanInterval = setInterval(() => {
      const deviceArray = Array.from(this.devices.values());
      if (deviceArray.length > 0) {
        // Simulate finding devices one by one
        const randomIndex = Math.floor(Math.random() * deviceArray.length);
        const device = deviceArray[randomIndex];
        device.updateLastSeen();
        console.log('🔧 MockDeviceRepository: Found device', device.info.name);
      }
    }, 2000);
  }

  async stopScan(): Promise<void> {
    this.isScanningState = false;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
  }

  async getScannedDevices(): Promise<Device[]> {
    return Array.from(this.devices.values());
  }

  async connectToDevice(deviceId: string): Promise<Device> {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    device.updateStatus({ isConnected: true });
    this.connectedDevices.add(deviceId);

    // Start mock data streaming
    this.startMockDataStream(deviceId);

    return device;
  }

  async disconnectFromDevice(deviceId: string): Promise<void> {
    const device = this.devices.get(deviceId);
    if (device) {
      device.updateStatus({ isConnected: false });
    }
    this.connectedDevices.delete(deviceId);

    // Stop mock data streaming
    this.stopMockDataStream(deviceId);
  }

  async getConnectedDevices(): Promise<Device[]> {
    return Array.from(this.devices.values()).filter(device => 
      this.connectedDevices.has(device.info.id)
    );
  }

  async startDataStream(deviceId: string): Promise<void> {
    console.log('🔧 MockDeviceRepository: Starting data stream for device', deviceId);
    this.startMockDataStream(deviceId);
  }

  async stopDataStream(deviceId: string): Promise<void> {
    this.stopMockDataStream(deviceId);
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
    this.stopScan();
    this.dataIntervals.forEach((interval) => clearInterval(interval));
    this.dataIntervals.clear();
    this.dataCallbacks.clear();
    this.devices.clear();
    this.connectedDevices.clear();
  }

  private startMockDataStream(deviceId: string): void {
    if (this.dataIntervals.has(deviceId)) {
      return; // Already streaming
    }

    const interval = setInterval(() => {
      const mockData = this.generateMockDeviceData(deviceId);
      console.log('🔧 MockDeviceRepository: Generated mock data for device:', deviceId, 'Data:', mockData);
      this.notifyDataCallbacks(deviceId, mockData);
    }, 1000); // Send data every second

    this.dataIntervals.set(deviceId, interval);
  }

  private stopMockDataStream(deviceId: string): void {
    const interval = this.dataIntervals.get(deviceId);
    if (interval) {
      clearInterval(interval);
      this.dataIntervals.delete(deviceId);
    }
  }

  private generateMockDeviceData(deviceId: string): DeviceData {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    // Generate realistic mock data based on device type
    if (device.info.type === DeviceType.RACEBOX) {
      return this.generateMockRaceBoxData();
    } else {
      return this.generateMockGenericData();
    }
  }

  private generateMockRaceBoxData(): DeviceData {
    const now = new Date();
    const latitude = 52.2297 + (Math.random() - 0.5) * 0.01; // Warsaw area
    const longitude = 21.0122 + (Math.random() - 0.5) * 0.01;
    
    return {
      location: {
        latitude,
        longitude,
        altitude: 120 + Math.random() * 20,
        accuracy: 2 + Math.random() * 3,
        speed: 10 + Math.random() * 20,
        heading: Math.random() * 360,
        satellites: 8 + Math.floor(Math.random() * 6),
        fixType: '3d' as const,
      },
      motion: {
        acceleration: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
          z: 9.8 + (Math.random() - 0.5) * 0.5,
        },
        rotationRate: {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10,
          z: (Math.random() - 0.5) * 10,
        },
        gForce: 1.0 + Math.random() * 0.2,
      },
      sensors: {
        batteryLevel: 70 + Math.floor(Math.random() * 30),
      },
      timestamp: now,
      rawData: 'Mock RaceBox data packet',
    };
  }

  private generateMockGenericData(): DeviceData {
    return {
      sensors: {
        temperature: 20 + Math.random() * 10,
        humidity: 40 + Math.random() * 30,
        pressure: 1013 + Math.random() * 20,
      },
      timestamp: new Date(),
      rawData: 'Mock generic device data',
    };
  }

  private notifyDataCallbacks(deviceId: string, data: DeviceData): void {
    const callbacks = this.dataCallbacks.get(deviceId);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
} 