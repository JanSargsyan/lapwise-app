import { IDeviceProtocolService } from '../../../domain/services/IDeviceProtocolService';
import { DeviceData, DeviceType, LocationData, MotionData, SensorData } from '../../../domain/entities/Device';

export class RaceBoxProtocolService implements IDeviceProtocolService {
  private readonly serviceUUIDs = ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'];
  private readonly characteristicUUIDs = ['6e400003-b5a3-f393-e0a9-e50e24dcca9e'];
  private readonly deviceInfoServiceUUID = '0000180a-0000-1000-8000-00805f9b34fb';
  private readonly deviceInfoCharacteristics = {
    model: '00002a24-0000-1000-8000-00805f9b34fb',
    serial: '00002a25-0000-1000-8000-00805f9b34fb',
    firmware: '00002a26-0000-1000-8000-00805f9b34fb',
    hardware: '00002a27-0000-1000-8000-00805f9b34fb',
    manufacturer: '00002a29-0000-1000-8000-00805f9b34fb',
  };

  canHandleDevice(deviceInfo: Partial<{ name: string; manufacturer: string }>): boolean {
    const name = deviceInfo.name?.toLowerCase() || '';
    const manufacturer = deviceInfo.manufacturer?.toLowerCase() || '';
    
    return name.includes('racebox') || 
           name.includes('race') || 
           manufacturer.includes('racebox') ||
           manufacturer.includes('race');
  }

  getSupportedDeviceTypes(): DeviceType[] {
    return [DeviceType.RACEBOX];
  }

  parseRawData(rawData: string | Uint8Array): DeviceData | null {
    try {
      const data = typeof rawData === 'string' ? this.hexToBytes(rawData) : rawData;
      
      if (!this.isValidRaceBoxPacket(data)) {
        return null;
      }

      const packetClass = data[2];
      const packetId = data[3];
      const payloadLength = data[4] | (data[5] << 8);

      // Handle RaceBox Data Message (class 0xFF, id 0x01)
      if (packetClass === 0xFF && packetId === 0x01) {
        return this.parseRaceBoxDataMessage(data.slice(6, 6 + payloadLength));
      }

      return null;
    } catch (error) {
      console.error('Error parsing RaceBox data:', error);
      return null;
    }
  }

  parseDeviceInfo(rawInfo: any): Partial<{ name: string; manufacturer: string; model: string; serialNumber: string; firmwareVersion: string }> {
    const info: any = {};
    
    if (rawInfo.model) info.model = rawInfo.model;
    if (rawInfo.serial) info.serialNumber = rawInfo.serial;
    if (rawInfo.firmware) info.firmwareVersion = rawInfo.firmware;
    if (rawInfo.hardware) info.hardwareVersion = rawInfo.hardware;
    if (rawInfo.manufacturer) info.manufacturer = rawInfo.manufacturer;
    
    return info;
  }

  getServiceUUIDs(): string[] {
    return this.serviceUUIDs;
  }

  getCharacteristicUUIDs(): string[] {
    return this.characteristicUUIDs;
  }

  getProtocolName(): string {
    return 'RaceBox Protocol';
  }

  getProtocolVersion(): string {
    return '1.0';
  }

  private isValidRaceBoxPacket(data: Uint8Array): boolean {
    if (data.length < 8) return false;
    
    // Check header (0xB5 0x62)
    if (data[0] !== 0xB5 || data[1] !== 0x62) return false;
    
    // Check checksum
    const payloadLength = data[4] | (data[5] << 8);
    const expectedLength = 6 + payloadLength + 2; // header + payload + checksum
    
    if (data.length !== expectedLength) return false;
    
    let CK_A = 0, CK_B = 0;
    for (let i = 2; i < data.length - 2; i++) {
      CK_A = (CK_A + data[i]) & 0xFF;
      CK_B = (CK_B + CK_A) & 0xFF;
    }
    
    return data[data.length - 2] === CK_A && data[data.length - 1] === CK_B;
  }

  private parseRaceBoxDataMessage(payload: Uint8Array): DeviceData {
    const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    
    // Parse iTOW (ms of GPS week)
    const iTOW = view.getUint32(0, true);
    
    // Parse date/time
    const year = view.getUint16(4, true);
    const month = view.getUint8(6);
    const day = view.getUint8(7);
    const hour = view.getUint8(8);
    const minute = view.getUint8(9);
    const second = view.getUint8(10);
    const validity = view.getUint8(11);
    
    // Parse location data
    const longitude = view.getInt32(24, true) / 1e7;
    const latitude = view.getInt32(28, true) / 1e7;
    const altitude = view.getInt32(32, true) / 1000;
    const mslAltitude = view.getInt32(36, true) / 1000;
    const horizontalAccuracy = view.getUint32(40, true) / 1000;
    const verticalAccuracy = view.getUint32(44, true) / 1000;
    const speed = view.getInt32(48, true) / 1000;
    const heading = view.getInt32(52, true) / 1e5;
    
    // Parse motion data
    const accelX = view.getInt16(68, true) / 1000;
    const accelY = view.getInt16(70, true) / 1000;
    const accelZ = view.getInt16(72, true) / 1000;
    const gyroX = view.getInt16(74, true) / 100;
    const gyroY = view.getInt16(76, true) / 100;
    const gyroZ = view.getInt16(78, true) / 100;
    
    // Parse status
    const fixStatus = view.getUint8(20);
    const satellites = view.getUint8(22);
    const batteryLevel = view.getUint8(67);
    
    const locationData: LocationData = {
      latitude,
      longitude,
      altitude,
      accuracy: horizontalAccuracy,
      speed,
      heading,
      satellites,
      fixType: this.getFixType(fixStatus),
    };

    const motionData: MotionData = {
      acceleration: { x: accelX, y: accelY, z: accelZ },
      rotationRate: { x: gyroX, y: gyroY, z: gyroZ },
      gForce: Math.sqrt(accelX * accelX + accelY * accelY + accelZ * accelZ),
    };

    const sensorData: SensorData = {
      batteryLevel,
    };

    return {
      location: locationData,
      motion: motionData,
      sensors: sensorData,
      timestamp: new Date(),
      rawData: this.bytesToHex(payload),
    };
  }

  private getFixType(fixStatus: number): 'none' | '2d' | '3d' {
    switch (fixStatus & 0x07) {
      case 0: return 'none';
      case 1: return '2d';
      case 2: return '3d';
      default: return 'none';
    }
  }

  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
  }
} 