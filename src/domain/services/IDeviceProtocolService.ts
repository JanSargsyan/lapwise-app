import { DeviceData, DeviceType } from '../entities/Device';

export interface IDeviceProtocolService {
  // Protocol identification
  canHandleDevice(deviceInfo: Partial<{ name: string; manufacturer: string }>): boolean;
  getSupportedDeviceTypes(): DeviceType[];
  
  // Data parsing
  parseRawData(rawData: string | Uint8Array): DeviceData | null;
  parseDeviceInfo(rawInfo: any): Partial<{ name: string; manufacturer: string; model: string; serialNumber: string; firmwareVersion: string }>;
  
  // Protocol-specific methods
  getServiceUUIDs(): string[];
  getCharacteristicUUIDs(): string[];
  getProtocolName(): string;
  getProtocolVersion(): string;
}

export interface ProtocolRegistry {
  registerProtocol(protocol: IDeviceProtocolService): void;
  getProtocolForDevice(deviceInfo: Partial<{ name: string; manufacturer: string }>): IDeviceProtocolService | null;
  getAllProtocols(): IDeviceProtocolService[];
} 