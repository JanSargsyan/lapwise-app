import { IDeviceRepository } from '../../domain/repositories/IDeviceRepository';
import { IDeviceProtocolService, ProtocolRegistry } from '../../domain/services/IDeviceProtocolService';
import { BLEDeviceRepository } from '../ble/BLEDeviceRepository';
import { MockDeviceRepository } from '../ble/MockDeviceRepository';
import { CombinedDeviceRepository } from '../ble/CombinedDeviceRepository';

export class Container {
  private static instance: Container;
  private repositories: Map<string, IDeviceRepository> = new Map();
  private protocolServices: Map<string, IDeviceProtocolService> = new Map();
  private protocolRegistry: ProtocolRegistry;

  private constructor() {
    this.protocolRegistry = new ProtocolRegistryImpl();
    this.initializeServices();
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  private initializeServices(): void {
    // Create a proper RaceBox protocol service with actual UUIDs
    const raceBoxProtocolService: IDeviceProtocolService = {
      canHandleDevice: (deviceInfo) => {
        const name = deviceInfo.name?.toLowerCase() || '';
        return name.includes('racebox') || name.includes('race box');
      },
      getSupportedDeviceTypes: () => ['racebox' as any],
      parseRawData: (rawData) => {
        try {
          // Handle both string and Uint8Array input
          let bytes: Uint8Array;
          if (typeof rawData === 'string') {
            // Convert base64 string to Uint8Array
            const binaryString = atob(rawData);
            bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
          } else {
            bytes = rawData;
          }
          
          if (bytes.length < 2) return null;
          
          return {
            timestamp: new Date(),
            rawData: Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''),
          };
        } catch (error) {
          console.warn('🔧 Container: Error parsing RaceBox data:', error);
          return null;
        }
      },
      parseDeviceInfo: (deviceInfo) => ({
        type: 'racebox' as any,
        manufacturer: 'RaceBox',
        model: deviceInfo.name?.includes('Mini') ? 'Mini' : 'Micro',
        firmwareVersion: 'v3.2.1',
        hardwareVersion: 'v1.0',
      }),
      getServiceUUIDs: () => ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'],
      getCharacteristicUUIDs: () => [
        '6e400002-b5a3-f393-e0a9-e50e24dcca9e', // RX
        '6e400003-b5a3-f393-e0a9-e50e24dcca9e', // TX
      ],
      getProtocolName: () => 'RaceBox Protocol',
      getProtocolVersion: () => '1.0',
    };

    // Register protocol services
    this.protocolRegistry.registerProtocol(raceBoxProtocolService);
    this.protocolServices.set('racebox', raceBoxProtocolService);

    // Register combined repository that handles both mock and real devices
    console.log('🔧 Container: Initializing combined repository for mock and real devices');
    
    const combinedRepository = new CombinedDeviceRepository(raceBoxProtocolService);
    this.repositories.set('combined', combinedRepository);
  }

  getDeviceRepository(type: string = 'combined'): IDeviceRepository {
    console.log('🔧 Container: Getting repository for type:', type);
    const repository = this.repositories.get(type);
    if (!repository) {
      throw new Error(`Repository type '${type}' not found`);
    }
    console.log('🔧 Container: Repository type:', repository.constructor.name);
    return repository;
  }

  getProtocolService(name: string): IDeviceProtocolService {
    const service = this.protocolServices.get(name);
    if (!service) {
      throw new Error(`Protocol service '${name}' not found`);
    }
    return service;
  }

  getProtocolRegistry(): ProtocolRegistry {
    return this.protocolRegistry;
  }

  getAllRepositories(): Map<string, IDeviceRepository> {
    return new Map(this.repositories);
  }

  getAllProtocolServices(): Map<string, IDeviceProtocolService> {
    return new Map(this.protocolServices);
  }
}

class ProtocolRegistryImpl implements ProtocolRegistry {
  private protocols: IDeviceProtocolService[] = [];

  registerProtocol(protocol: IDeviceProtocolService): void {
    this.protocols.push(protocol);
  }

  getProtocolForDevice(deviceInfo: Partial<{ name: string; manufacturer: string }>): IDeviceProtocolService | null {
    return this.protocols.find(protocol => protocol.canHandleDevice(deviceInfo)) || null;
  }

  getAllProtocols(): IDeviceProtocolService[] {
    return [...this.protocols];
  }
} 