import { RaceBoxClientPort } from '../ports/primary/RaceBoxClientPort';
import { RaceBoxClientAdapter } from '../adapters/primary/RaceBoxClientAdapter';
import { ReactNativeBLEPLXAdapter } from '../adapters/secondary/ble/ReactNativeBLEPLXAdapter';
import { UBXPacketParserAdapter } from '../adapters/secondary/protocol/UBXPacketParserAdapter';
import { RaceBoxMessageFactoryAdapter } from '../adapters/secondary/protocol/RaceBoxMessageFactoryAdapter';
import { RaceBoxDataConverterAdapter } from '../adapters/secondary/data/RaceBoxDataConverterAdapter';
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
   * Creates a RaceBox client instance with all dependencies properly configured
   * @param bleDevice - The react-native-ble-plx Device instance
   * @param config - Optional configuration overrides
   * @returns A fully configured RaceBox client
   */
  static createClient(bleDevice: Device, config?: Partial<any>): RaceBoxClientPort {
    // Create secondary adapters (infrastructure layer)
    const bleAdapter = new ReactNativeBLEPLXAdapter(bleDevice);
    const packetParser = new UBXPacketParserAdapter();
    const messageFactory = new RaceBoxMessageFactoryAdapter();
    const dataConverter = new RaceBoxDataConverterAdapter();
    const errorHandler = new RaceBoxErrorHandlerAdapter();

    // Create primary adapter (application layer)
    const client = new RaceBoxClientAdapter(
      bleAdapter,
      packetParser,
      messageFactory,
      dataConverter,
      errorHandler
    );

    // Apply configuration if provided
    if (config) {
      client.updateConfig(config);
    }

    return client;
  }

  /**
   * Creates a mock client for testing purposes
   * @param mockBleDevice - Mock BLE device implementation
   * @returns A RaceBox client with mock dependencies
   */
  static createMockClient(mockBleDevice: any): RaceBoxClientPort {
    // Create mock adapters for testing
    const bleAdapter = mockBleDevice;
    const packetParser = new UBXPacketParserAdapter();
    const messageFactory = new RaceBoxMessageFactoryAdapter();
    const dataConverter = new RaceBoxDataConverterAdapter();
    const errorHandler = new RaceBoxErrorHandlerAdapter();

    return new RaceBoxClientAdapter(
      bleAdapter,
      packetParser,
      messageFactory,
      dataConverter,
      errorHandler
    );
  }

  /**
   * Creates a client with custom adapters for advanced use cases
   * @param adapters - Object containing custom adapter implementations
   * @returns A RaceBox client with custom adapters
   */
  static createCustomClient(adapters: {
    bleDevice?: any;
    packetParser?: any;
    messageFactory?: any;
    dataConverter?: any;
    errorHandler?: any;
  }): RaceBoxClientPort {
    const bleAdapter = adapters.bleDevice || new ReactNativeBLEPLXAdapter({} as Device);
    const packetParser = adapters.packetParser || new UBXPacketParserAdapter();
    const messageFactory = adapters.messageFactory || new RaceBoxMessageFactoryAdapter();
    const dataConverter = adapters.dataConverter || new RaceBoxDataConverterAdapter();
    const errorHandler = adapters.errorHandler || new RaceBoxErrorHandlerAdapter();

    return new RaceBoxClientAdapter(
      bleAdapter,
      packetParser,
      messageFactory,
      dataConverter,
      errorHandler
    );
  }
} 