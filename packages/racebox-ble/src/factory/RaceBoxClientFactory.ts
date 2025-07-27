import { RaceBoxClientPort } from '../ports/primary/RaceBoxClientPort';
import { RaceBoxClientAdapter } from '../adapters/primary/RaceBoxClientAdapter';
import { ReactNativeBLEPLXAdapter } from '../adapters/secondary/ble/ReactNativeBLEPLXAdapter';
import { UBXPacketParserAdapter } from '../adapters/secondary/protocol/UBXPacketParserAdapter';
import { RaceBoxMessageFactoryAdapter } from '../adapters/secondary/protocol/RaceBoxMessageFactoryAdapter';
import { RaceBoxErrorHandlerAdapter } from '../adapters/secondary/error/RaceBoxErrorHandlerAdapter';

// Interface for react-native-ble-plx Device
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
  ): Promise<any>;
  monitorCharacteristicForService(
    serviceUUID: string,
    characteristicUUID: string,
    listener: (error: any, characteristic: any) => void
  ): void;
  isConnected(): Promise<boolean>;
}

export class RaceBoxClientFactory {
  /**
   * Creates a production RaceBox client with all dependencies
   */
  static createClient(device: Device): RaceBoxClientPort {
    // Create secondary adapters
    const bleDevice = new ReactNativeBLEPLXAdapter(device);
    const packetParser = new UBXPacketParserAdapter();
    const messageFactory = new RaceBoxMessageFactoryAdapter();
    const errorHandler = new RaceBoxErrorHandlerAdapter();

    // Create primary adapter
    const client = new RaceBoxClientAdapter(
      bleDevice,
      packetParser,
      messageFactory,
      errorHandler
    );

    return client;
  }

  /**
   * Creates a mock client for testing
   */
  static createMockClient(): RaceBoxClientPort {
    // Create mock device
    const mockDevice: Device = {
      id: 'mock-device-id',
      name: 'Mock RaceBox',
      rssi: -50,
      connect: async () => mockDevice,
      disconnect: async () => mockDevice,
      discoverAllServicesAndCharacteristics: async () => mockDevice,
      writeCharacteristicWithResponseForService: async () => ({}),
      monitorCharacteristicForService: () => {},
      isConnected: async () => true
    };

    return new RaceBoxClientAdapter(
      new ReactNativeBLEPLXAdapter(mockDevice),
      new UBXPacketParserAdapter(),
      new RaceBoxMessageFactoryAdapter(),
      new RaceBoxErrorHandlerAdapter()
    );
  }

  /**
   * Creates a custom client with specific dependencies
   */
  static createCustomClient(
    bleDevice: any,
    packetParser: any,
    messageFactory: any,
    errorHandler: any
  ): RaceBoxClientPort {
    return new RaceBoxClientAdapter(
      bleDevice,
      packetParser,
      messageFactory,
      errorHandler
    );
  }
} 