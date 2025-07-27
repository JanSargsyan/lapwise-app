import { Observable, Subject, throwError } from 'rxjs';
import { BLEDevicePort, BLEDeviceInfo, BLEError, ConnectionState } from '../../../ports/secondary/BLEDevicePort';

// Import react-native-ble-plx types
interface Device {
  id: string;
  name: string;
  rssi: number;
  connect(): Promise<Device>;
  disconnect(): Promise<Device>;
  discoverAllServicesAndCharacteristics(): Promise<Device>;
  writeCharacteristicWithResponseForService(
    serviceUUID: string,
    characteristicUUID: string,
    data: string
  ): Promise<Characteristic>;
  monitorCharacteristicForService(
    serviceUUID: string,
    characteristicUUID: string,
    listener: (error: any, characteristic: Characteristic) => void
  ): void;
  isConnected(): Promise<boolean>;
}

interface Characteristic {
  uuid: string;
  value: string | null;
  serviceUUID: string;
}

export class ReactNativeBLEPLXAdapter implements BLEDevicePort {
  private device: Device;
  private connectionStateSubject = new Subject<ConnectionState>();
  private connectionErrorSubject = new Subject<BLEError>();
  private isConnectedFlag = false;

  constructor(device: Device) {
    this.device = device;
  }

  // Connection management
  async connect(deviceId: string): Promise<void> {
    try {
      await this.device.connect();
      await this.device.discoverAllServicesAndCharacteristics();
      this.isConnectedFlag = true;
      
      this.connectionStateSubject.next({
        isConnected: true,
        deviceId: this.device.id,
        signalStrength: this.device.rssi,
        lastSeen: new Date()
      });
    } catch (error) {
      const bleError: BLEError = {
        type: 'connection',
        message: `Failed to connect to device ${deviceId}`,
        code: (error as any)?.code || 'CONNECTION_FAILED',
        deviceId
      };
      this.connectionErrorSubject.next(bleError);
      throw bleError;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.device.disconnect();
      this.isConnectedFlag = false;
      
      this.connectionStateSubject.next({
        isConnected: false,
        deviceId: this.device.id,
        lastSeen: new Date()
      });
    } catch (error) {
      const bleError: BLEError = {
        type: 'connection',
        message: 'Failed to disconnect from device',
        code: (error as any)?.code || 'DISCONNECT_FAILED',
        deviceId: this.device.id
      };
      this.connectionErrorSubject.next(bleError);
      throw bleError;
    }
  }

  isConnected(): boolean {
    return this.isConnectedFlag;
  }

  // Data transmission
  async sendData(data: Uint8Array): Promise<void> {
    if (!this.isConnectedFlag) {
      throw new Error('Device not connected');
    }

    try {
      // Convert Uint8Array to base64 string for react-native-ble-plx
      const base64Data = Buffer.from(data).toString('base64');
      
      // RaceBox typically uses a specific service and characteristic UUID
      // These would be configured based on the RaceBox device specifications
      const serviceUUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e'; // UART service
      const characteristicUUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // UART TX
      
      await this.device.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        base64Data
      );
    } catch (error) {
      const bleError: BLEError = {
        type: 'communication',
        message: 'Failed to send data to device',
        code: (error as any)?.code || 'SEND_FAILED',
        deviceId: this.device.id
      };
      throw bleError;
    }
  }

  subscribeToCharacteristic(_characteristic: string): Observable<Uint8Array> {
    if (!this.isConnectedFlag) {
      return throwError(() => new Error('Device not connected'));
    }

    return new Observable<Uint8Array>(subscriber => {
      const listener = (error: any, characteristic: Characteristic) => {
        if (error) {
          subscriber.error(error);
          return;
        }

        if (characteristic.value) {
          try {
            // Convert base64 string back to Uint8Array
            const buffer = Buffer.from(characteristic.value, 'base64');
            const uint8Array = new Uint8Array(buffer);
            subscriber.next(uint8Array);
          } catch (parseError) {
            subscriber.error(new Error('Failed to parse characteristic data'));
          }
        }
      };

      this.device.monitorCharacteristicForService(
        '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // UART service
        '6e400003-b5a3-f393-e0a9-e50e24dcca9e', // UART RX
        listener
      );

      // Return cleanup function
      return () => {
        // Note: react-native-ble-plx doesn't provide a direct way to stop monitoring
        // The monitoring will stop when the device disconnects
      };
    });
  }

  // Device discovery
  scanForDevices(): Observable<BLEDeviceInfo[]> {
    // This would typically use react-native-ble-plx's BleManager
    // For now, return an empty observable as this is handled at a higher level
    return new Observable<BLEDeviceInfo[]>(observer => {
      observer.next([]);
      observer.complete();
    });
  }

  async getDeviceInfo(): Promise<BLEDeviceInfo> {
    return {
      id: this.device.id,
      name: this.device.name,
      rssi: this.device.rssi,
      manufacturerData: undefined as any,
      serviceUUIDs: []
    };
  }

  // Connection monitoring
  get connectionState$(): Observable<ConnectionState> {
    return this.connectionStateSubject.asObservable();
  }

  get connectionError$(): Observable<BLEError> {
    return this.connectionErrorSubject.asObservable();
  }

  // Device capabilities
  async getSupportedServices(): Promise<string[]> {
    // This would be implemented based on the actual device discovery
    // For RaceBox devices, we know the expected services
    return [
      '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // UART service
      '1800', // Generic Access
      '1801'  // Generic Attribute
    ];
  }

  async getSupportedCharacteristics(serviceUUID: string): Promise<string[]> {
    // This would be implemented based on the actual service discovery
    // For RaceBox UART service
    if (serviceUUID === '6e400001-b5a3-f393-e0a9-e50e24dcca9e') {
      return [
        '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // TX
        '6e400003-b5a3-f393-e0a9-e50e24dcca9e'  // RX
      ];
    }
    return [];
  }

  // Utility methods
  getDeviceId(): string {
    return this.device.id;
  }

  getDeviceName(): string {
    return this.device.name;
  }

  getSignalStrength(): number {
    return this.device.rssi;
  }
} 