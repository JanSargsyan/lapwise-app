import { Observable } from 'rxjs';

export interface BLEDeviceInfo {
  id: string;
  name: string;
  rssi: number;
  manufacturerData?: Uint8Array;
  serviceUUIDs?: string[];
}

export interface BLEError {
  type: 'connection' | 'discovery' | 'communication' | 'permission';
  message: string;
  code?: string;
  deviceId?: string;
}

export interface ConnectionState {
  isConnected: boolean;
  deviceId?: string;
  signalStrength?: number;
  lastSeen?: Date;
}

export interface BLEDevicePort {
  // Connection management
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Data transmission
  sendData(data: Uint8Array): Promise<void>;
  subscribeToCharacteristic(characteristic: string): Observable<Uint8Array>;
  
  // Device discovery
  scanForDevices(): Observable<BLEDeviceInfo[]>;
  getDeviceInfo(): Promise<BLEDeviceInfo>;
  
  // Connection monitoring
  connectionState$: Observable<ConnectionState>;
  connectionError$: Observable<BLEError>;
  
  // Device capabilities
  getSupportedServices(): Promise<string[]>;
  getSupportedCharacteristics(serviceUUID: string): Promise<string[]>;
  
  // Utility methods
  getDeviceId(): string;
  getDeviceName(): string;
  getSignalStrength(): number;
} 