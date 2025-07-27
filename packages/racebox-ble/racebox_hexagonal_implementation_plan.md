# RaceBox BLE Client - Hexagonal Architecture Implementation Plan

## Overview
This document outlines the implementation plan for a RaceBox BLE client using Hexagonal Architecture (Ports and Adapters). This approach provides better separation of concerns, testability, and maintainability.

---

## 🏗️ Hexagonal Architecture Overview

### Core Principles
- **Domain Logic**: Business rules and core functionality
- **Ports**: Interfaces defining contracts
- **Adapters**: Implementations of ports
- **Dependency Inversion**: Dependencies point inward toward domain

### Architecture Layers
```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                       │
│  (Use Cases, Controllers, Presenters)                     │
├─────────────────────────────────────────────────────────────┤
│                    Domain Layer                            │
│  (Entities, Value Objects, Domain Services)               │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                    │
│  (BLE Adapters, Storage, External Services)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Core Domain (Center)

### 1. Domain Entities

#### `RaceBoxDevice`
```typescript
interface RaceBoxDevice {
  id: string;
  name: string;
  model: 'RaceBox Mini' | 'RaceBox Mini S' | 'RaceBox Micro';
  serialNumber: string;
  firmwareVersion: string;
  capabilities: DeviceCapabilities;
  state: DeviceState;
}
```

#### `LiveDataMessage`
```typescript
interface LiveDataMessage {
  timestamp: Date;
  position: Position;
  motion: MotionData;
  gnssStatus: GNSSStatus;
  systemStatus: SystemStatus;
  sensorData: SensorData;
}
```

#### `RecordingConfiguration`
```typescript
interface RecordingConfiguration {
  enabled: boolean;
  dataRate: DataRate;
  filters: RecordingFilters;
  thresholds: RecordingThresholds;
  timeouts: RecordingTimeouts;
}
```

### 2. Value Objects

#### `Position`
```typescript
interface Position {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  timestamp: Date;
}
```

#### `MotionData`
```typescript
interface MotionData {
  speed: Speed;
  heading: Heading;
  gForce: GForce;
  rotationRate: RotationRate;
}
```

#### `GNSSStatus`
```typescript
interface GNSSStatus {
  fixStatus: FixStatus;
  numSatellites: number;
  pdop: number;
  horizontalAccuracy: number;
  verticalAccuracy: number;
}
```

### 3. Domain Services

#### `RaceBoxProtocolService`
```typescript
interface RaceBoxProtocolService {
  parsePacket(data: Uint8Array): RaceBoxMessage;
  createPacket(message: RaceBoxMessage): Uint8Array;
  validateChecksum(packet: Uint8Array): boolean;
  calculateChecksum(data: Uint8Array): [number, number];
}
```

#### `DataConversionService`
```typescript
interface DataConversionService {
  convertRawPosition(raw: RawPosition): Position;
  convertRawMotion(raw: RawMotion): MotionData;
  convertRawGNSS(raw: RawGNSS): GNSSStatus;
  convertRawSystem(raw: RawSystem): SystemStatus;
}
```

---

## 🔌 Ports (Interfaces)

### 1. Primary Ports (Driving/Inbound)

#### `RaceBoxClientPort`
```typescript
interface RaceBoxClientPort {
  // Data streams
  liveData$: Observable<LiveDataMessage>;
  position$: Observable<Position>;
  motion$: Observable<MotionData>;
  deviceState$: Observable<DeviceState>;
  
  // Configuration streams
  recordingConfig$: Observable<RecordingConfiguration>;
  gnssConfig$: Observable<GNSSConfiguration>;
  
  // Error streams
  errors$: Observable<RaceBoxError>;
  
  // Commands
  configureGNSS(config: GNSSConfiguration): Promise<void>;
  configureRecording(config: RecordingConfiguration): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  pauseRecording(): Promise<void>;
  downloadHistory(): Promise<LiveDataMessage[]>;
  eraseMemory(): Promise<void>;
  unlockMemory(securityCode: number): Promise<void>;
  
  // Queries
  getDeviceInfo(): Promise<RaceBoxDevice>;
  getRecordingStatus(): Promise<RecordingStatus>;
  getGNSSStatus(): Promise<GNSSStatus>;
  getMemoryStatus(): Promise<MemoryStatus>;
  isConnected(): boolean;
}
```

#### `RaceBoxMessageHandlerPort`
```typescript
interface RaceBoxMessageHandlerPort {
  handleLiveData(message: LiveDataMessage): void;
  handleRecordingStatus(status: RecordingStatus): void;
  handleGNSSStatus(status: GNSSStatus): void;
  handleMemoryStatus(status: MemoryStatus): void;
  handleError(error: RaceBoxError): void;
  handleAcknowledgment(ack: Acknowledgment): void;
}
```

### 2. Secondary Ports (Driven/Outbound)

#### `BLEDevicePort`
```typescript
interface BLEDevicePort {
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  // Data transmission
  sendData(data: Uint8Array): Promise<void>;
  subscribeToCharacteristic(characteristic: string): Observable<Uint8Array>;
  
  // Device discovery
  scanForDevices(): Observable<BLEDeviceInfo[]>;
  getDeviceInfo(): Promise<BLEDeviceInfo>;
  
  // Connection management
  connectionState$: Observable<ConnectionState>;
  connectionError$: Observable<BLEError>;
}
```

#### `PacketParserPort`
```typescript
interface PacketParserPort {
  parsePacket(data: Uint8Array): RaceBoxMessage;
  validateChecksum(packet: Uint8Array): boolean;
  reassemblePackets(fragments: Uint8Array[]): Uint8Array;
}
```

#### `MessageFactoryPort`
```typescript
interface MessageFactoryPort {
  createGNSSConfigRequest(): RaceBoxMessage;
  createGNSSConfigSet(config: GNSSConfiguration): RaceBoxMessage;
  createRecordingConfigRequest(): RaceBoxMessage;
  createRecordingConfigSet(config: RecordingConfiguration): RaceBoxMessage;
  createStartRecordingCommand(): RaceBoxMessage;
  createStopRecordingCommand(): RaceBoxMessage;
  createDownloadHistoryCommand(): RaceBoxMessage;
  createEraseMemoryCommand(): RaceBoxMessage;
  createUnlockMemoryCommand(securityCode: number): RaceBoxMessage;
}
```

#### `DataConverterPort`
```typescript
interface DataConverterPort {
  convertRawPosition(raw: RawPosition): Position;
  convertRawMotion(raw: RawMotion): MotionData;
  convertRawGNSS(raw: RawGNSS): GNSSStatus;
  convertRawSystem(raw: RawSystem): SystemStatus;
  convertRawRecordingStatus(raw: RawRecordingStatus): RecordingStatus;
  convertRawMemoryStatus(raw: RawMemoryStatus): MemoryStatus;
}
```

#### `ErrorHandlerPort`
```typescript
interface ErrorHandlerPort {
  handleConnectionError(error: BLEError): void;
  handleProtocolError(error: ProtocolError): void;
  handleDeviceError(error: DeviceError): void;
  handleTimeoutError(error: TimeoutError): void;
  isRecoverable(error: RaceBoxError): boolean;
  getRecoveryStrategy(error: RaceBoxError): RecoveryStrategy;
}
```

---

## 🔌 Adapters (Implementations)

### 1. Primary Adapters (Driving/Inbound)

#### `RaceBoxClientAdapter`
```typescript
class RaceBoxClientAdapter implements RaceBoxClientPort {
  constructor(
    private messageHandler: RaceBoxMessageHandlerPort,
    private bleDevice: BLEDevicePort,
    private packetParser: PacketParserPort,
    private messageFactory: MessageFactoryPort,
    private dataConverter: DataConverterPort,
    private errorHandler: ErrorHandlerPort
  ) {}
  
  // Implementation of all port methods
  // Handles the public API contract
}
```

#### `RaceBoxMessageHandlerAdapter`
```typescript
class RaceBoxMessageHandlerAdapter implements RaceBoxMessageHandlerPort {
  constructor(
    private liveDataSubject: Subject<LiveDataMessage>,
    private positionSubject: Subject<Position>,
    private motionSubject: Subject<MotionData>,
    private deviceStateSubject: Subject<DeviceState>,
    private recordingConfigSubject: Subject<RecordingConfiguration>,
    private gnssConfigSubject: Subject<GNSSConfiguration>,
    private errorSubject: Subject<RaceBoxError>
  ) {}
  
  // Implementation of message handling
  // Updates subjects based on received messages
}
```

### 2. Secondary Adapters (Driven/Outbound)

#### `BLEPLXAdapter`
```typescript
class BLEPLXAdapter implements BLEDevicePort {
  constructor(private bleDevice: Device) {}
  
  // Implementation using ble-plx library
  // Handles actual BLE communication
}
```

#### `UBXPacketParserAdapter`
```typescript
class UBXPacketParserAdapter implements PacketParserPort {
  // Implementation of UBX packet parsing
  // Handles packet validation and reassembly
}
```

#### `RaceBoxMessageFactoryAdapter`
```typescript
class RaceBoxMessageFactoryAdapter implements MessageFactoryPort {
  // Implementation of message creation
  // Creates properly formatted UBX packets
}
```

#### `RaceBoxDataConverterAdapter`
```typescript
class RaceBoxDataConverterAdapter implements DataConverterPort {
  // Implementation of data conversion
  // Converts raw values to domain objects
}
```

#### `RaceBoxErrorHandlerAdapter`
```typescript
class RaceBoxErrorHandlerAdapter implements ErrorHandlerPort {
  // Implementation of error handling
  // Provides error recovery strategies
}
```

---

## 🏛️ Application Layer

### 1. Use Cases

#### `ConnectToDeviceUseCase`
```typescript
class ConnectToDeviceUseCase {
  constructor(
    private bleDevice: BLEDevicePort,
    private messageHandler: RaceBoxMessageHandlerPort
  ) {}
  
  async execute(deviceId: string): Promise<void> {
    await this.bleDevice.connect(deviceId);
    // Initialize message handling
  }
}
```

#### `ConfigureRecordingUseCase`
```typescript
class ConfigureRecordingUseCase {
  constructor(
    private bleDevice: BLEDevicePort,
    private messageFactory: MessageFactoryPort,
    private errorHandler: ErrorHandlerPort
  ) {}
  
  async execute(config: RecordingConfiguration): Promise<void> {
    const message = this.messageFactory.createRecordingConfigSet(config);
    const packet = this.createPacket(message);
    await this.bleDevice.sendData(packet);
    // Wait for acknowledgment
  }
}
```

#### `StartRecordingUseCase`
```typescript
class StartRecordingUseCase {
  constructor(
    private bleDevice: BLEDevicePort,
    private messageFactory: MessageFactoryPort
  ) {}
  
  async execute(): Promise<void> {
    const message = this.messageFactory.createStartRecordingCommand();
    const packet = this.createPacket(message);
    await this.bleDevice.sendData(packet);
  }
}
```

#### `DownloadHistoryUseCase`
```typescript
class DownloadHistoryUseCase {
  constructor(
    private bleDevice: BLEDevicePort,
    private messageFactory: MessageFactoryPort,
    private dataConverter: DataConverterPort
  ) {}
  
  async execute(): Promise<LiveDataMessage[]> {
    const message = this.messageFactory.createDownloadHistoryCommand();
    const packet = this.createPacket(message);
    await this.bleDevice.sendData(packet);
    // Collect history data from stream
    return this.collectHistoryData();
  }
}
```

### 2. Controllers

#### `RaceBoxController`
```typescript
class RaceBoxController {
  constructor(
    private connectUseCase: ConnectToDeviceUseCase,
    private configureRecordingUseCase: ConfigureRecordingUseCase,
    private startRecordingUseCase: StartRecordingUseCase,
    private stopRecordingUseCase: StopRecordingUseCase,
    private downloadHistoryUseCase: DownloadHistoryUseCase
  ) {}
  
  // Orchestrates use cases
  // Handles application flow
}
```

---

## 🏗️ Infrastructure Layer

### 1. BLE Infrastructure

#### `BLEPLXDeviceAdapter`
```typescript
class BLEPLXDeviceAdapter implements BLEDevicePort {
  private device: Device;
  private connectionStateSubject = new Subject<ConnectionState>();
  private connectionErrorSubject = new Subject<BLEError>();
  
  constructor(device: Device) {
    this.device = device;
  }
  
  async connect(deviceId: string): Promise<void> {
    // Implementation using ble-plx
  }
  
  async sendData(data: Uint8Array): Promise<void> {
    // Send data via BLE characteristic
  }
  
  subscribeToCharacteristic(characteristic: string): Observable<Uint8Array> {
    // Subscribe to BLE characteristic notifications
  }
}
```

### 2. Protocol Infrastructure

#### `UBXPacketParser`
```typescript
class UBXPacketParser implements PacketParserPort {
  parsePacket(data: Uint8Array): RaceBoxMessage {
    // Parse UBX packet format
    // Validate headers and checksum
    // Extract message type and payload
  }
  
  validateChecksum(packet: Uint8Array): boolean {
    // Validate UBX checksum
  }
  
  reassemblePackets(fragments: Uint8Array[]): Uint8Array {
    // Reassemble fragmented packets
  }
}
```

#### `RaceBoxMessageFactory`
```typescript
class RaceBoxMessageFactory implements MessageFactoryPort {
  createGNSSConfigRequest(): RaceBoxMessage {
    // Create GNSS config request message
  }
  
  createRecordingConfigSet(config: RecordingConfiguration): RaceBoxMessage {
    // Create recording config set message
  }
  
  // Other message creation methods
}
```

### 3. Data Conversion Infrastructure

#### `RaceBoxDataConverter`
```typescript
class RaceBoxDataConverter implements DataConverterPort {
  convertRawPosition(raw: RawPosition): Position {
    // Convert raw position data to domain object
  }
  
  convertRawMotion(raw: RawMotion): MotionData {
    // Convert raw motion data to domain object
  }
  
  // Other conversion methods
}
```

---

## 🔄 Data Flow Architecture

### 1. Incoming Data Flow
```
BLE Device → BLEPLXAdapter → UBXPacketParser → MessageHandler → Domain Objects → Observables
```

### 2. Outgoing Data Flow
```
Use Case → MessageFactory → Packet Creation → BLEPLXAdapter → BLE Device
```

### 3. Error Flow
```
Error Source → ErrorHandler → Recovery Strategy → Domain Objects → Observables
```

---

## 🧪 Testing Strategy

### 1. Unit Tests

#### Domain Layer Tests
```typescript
describe('RaceBoxDevice', () => {
  it('should validate device capabilities', () => {
    // Test domain logic
  });
});

describe('DataConversionService', () => {
  it('should convert raw position correctly', () => {
    // Test data conversion
  });
});
```

#### Port Tests
```typescript
describe('RaceBoxClientPort', () => {
  it('should emit live data when received', () => {
    // Test observable behavior
  });
});
```

### 2. Integration Tests

#### Adapter Tests
```typescript
describe('BLEPLXAdapter', () => {
  it('should connect to device successfully', () => {
    // Test BLE adapter with mock device
  });
});

describe('UBXPacketParser', () => {
  it('should parse valid packets correctly', () => {
    // Test packet parsing with sample data
  });
});
```

### 3. End-to-End Tests

#### Use Case Tests
```typescript
describe('ConfigureRecordingUseCase', () => {
  it('should configure recording successfully', async () => {
    // Test complete use case flow
  });
});
```

---

## 🏗️ Implementation Phases

### Phase 1: Domain Layer (Week 1-2)
**Components**:
- Domain entities and value objects
- Domain services
- Port interfaces
- Basic use cases

**Deliverables**:
- Complete domain model
- Port contracts
- Basic use case implementations

### Phase 2: Infrastructure Layer (Week 3-4)
**Components**:
- BLE adapters
- Protocol parsers
- Message factories
- Data converters

**Deliverables**:
- BLE communication layer
- Protocol handling
- Data conversion utilities

### Phase 3: Application Layer (Week 5-6)
**Components**:
- Use case implementations
- Controllers
- Application services
- Error handling

**Deliverables**:
- Complete application logic
- Error recovery mechanisms
- Use case orchestration

### Phase 4: Integration & Testing (Week 7-8)
**Components**:
- Dependency injection setup
- Integration tests
- End-to-end tests
- Performance optimization

**Deliverables**:
- Fully integrated system
- Comprehensive test suite
- Performance benchmarks

---

## 🔧 Dependency Injection Setup

### 1. Container Configuration
```typescript
class RaceBoxContainer {
  static create(): RaceBoxClientPort {
    // Create and wire all dependencies
    const bleDevice = new BLEPLXAdapter(device);
    const packetParser = new UBXPacketParser();
    const messageFactory = new RaceBoxMessageFactory();
    const dataConverter = new RaceBoxDataConverter();
    const errorHandler = new RaceBoxErrorHandlerAdapter();
    
    const messageHandler = new RaceBoxMessageHandlerAdapter(
      new Subject<LiveDataMessage>(),
      new Subject<Position>(),
      // ... other subjects
    );
    
    return new RaceBoxClientAdapter(
      messageHandler,
      bleDevice,
      packetParser,
      messageFactory,
      dataConverter,
      errorHandler
    );
  }
}
```

### 2. Factory Pattern
```typescript
class RaceBoxClientFactory {
  static createClient(bleDevice: Device, config?: RaceBoxConfig): RaceBoxClientPort {
    return RaceBoxContainer.create();
  }
}
```

---

## 📊 Benefits of Hexagonal Architecture

### 1. Testability
- **Domain Logic**: Can be tested in isolation
- **Adapters**: Can be mocked easily
- **Use Cases**: Can be tested independently

### 2. Maintainability
- **Clear Separation**: Domain logic separate from infrastructure
- **Loose Coupling**: Changes in one layer don't affect others
- **Single Responsibility**: Each component has one clear purpose

### 3. Flexibility
- **Technology Agnostic**: Domain logic doesn't depend on specific technologies
- **Easy to Replace**: Adapters can be swapped without changing domain
- **Multiple Implementations**: Can have different adapters for different scenarios

### 4. Scalability
- **Modular Design**: Easy to add new features
- **Parallel Development**: Teams can work on different layers
- **Clear Interfaces**: Well-defined contracts between layers

---

## 🔮 Future Enhancements

### 1. Additional Adapters
- **WebSocket Adapter**: For web-based communication
- **File Storage Adapter**: For local data persistence
- **Cloud Storage Adapter**: For cloud data synchronization

### 2. Advanced Features
- **Multi-Device Support**: Multiple device management
- **Plugin System**: Extensible architecture
- **Real-time Analytics**: Advanced data processing

### 3. Performance Optimizations
- **Caching Adapter**: For frequently accessed data
- **Compression Adapter**: For data compression
- **Batch Processing Adapter**: For bulk operations

---

## 📝 Conclusion

This Hexagonal Architecture implementation plan provides:

1. **Clean Separation**: Domain logic isolated from infrastructure
2. **High Testability**: Easy to mock and test components
3. **Flexible Design**: Easy to adapt to changing requirements
4. **Maintainable Code**: Clear structure and responsibilities
5. **Scalable Architecture**: Easy to extend and enhance

The architecture ensures that the RaceBox BLE client is robust, testable, and maintainable while providing a clean API for consumers. 