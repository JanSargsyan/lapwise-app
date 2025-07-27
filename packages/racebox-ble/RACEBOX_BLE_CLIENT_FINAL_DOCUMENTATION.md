# RaceBox BLE Client - Complete Implementation Documentation

## Overview
This document provides the complete implementation guide for the RaceBox BLE client using Hexagonal Architecture (Ports and Adapters). It includes the architecture, folder structure, interfaces, models, and implementation details.

---

## 🏗️ Architecture Overview

### Hexagonal Architecture Principles
- **Domain Layer**: Core business logic and entities
- **Application Layer**: Use cases and application services
- **Ports**: Interfaces defining contracts
- **Adapters**: Implementations of ports
- **Infrastructure**: External dependencies and configuration

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

## 📁 Complete Folder Structure

```
racebox-ble-client/
├── src/                          # Source code
│   ├── domain/                   # Domain Layer (Core Business Logic)
│   │   ├── entities/             # Domain entities
│   │   │   ├── RaceBoxDevice.ts
│   │   │   ├── LiveDataMessage.ts
│   │   │   ├── RecordingConfiguration.ts
│   │   │   ├── GNSSConfiguration.ts
│   │   │   └── index.ts
│   │   ├── value-objects/        # Value objects
│   │   │   ├── Position.ts
│   │   │   ├── MotionData.ts
│   │   │   ├── GNSSStatus.ts
│   │   │   ├── SystemStatus.ts
│   │   │   ├── SensorData.ts
│   │   │   ├── Speed.ts
│   │   │   ├── Heading.ts
│   │   │   ├── GForce.ts
│   │   │   ├── RotationRate.ts
│   │   │   ├── RecordingStatus.ts
│   │   │   ├── MemoryStatus.ts
│   │   │   ├── DeviceState.ts
│   │   │   ├── ConnectionState.ts
│   │   │   └── index.ts
│   │   ├── services/             # Domain services
│   │   │   ├── RaceBoxProtocolService.ts
│   │   │   ├── DataConversionService.ts
│   │   │   ├── ValidationService.ts
│   │   │   └── index.ts
│   │   ├── types/                # Domain types and enums
│   │   │   ├── DeviceCapabilities.ts
│   │   │   ├── DataRate.ts
│   │   │   ├── FixStatus.ts
│   │   │   ├── PlatformModel.ts
│   │   │   ├── RecordingFilters.ts
│   │   │   ├── RecordingThresholds.ts
│   │   │   ├── RecordingTimeouts.ts
│   │   │   ├── RaceBoxError.ts
│   │   │   ├── Acknowledgment.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── application/              # Application Layer (Use Cases)
│   │   ├── use-cases/           # Use case implementations
│   │   │   ├── ConnectToDeviceUseCase.ts
│   │   │   ├── ConfigureGNSSUseCase.ts
│   │   │   ├── ConfigureRecordingUseCase.ts
│   │   │   ├── StartRecordingUseCase.ts
│   │   │   ├── StopRecordingUseCase.ts
│   │   │   ├── PauseRecordingUseCase.ts
│   │   │   ├── DownloadHistoryUseCase.ts
│   │   │   ├── EraseMemoryUseCase.ts
│   │   │   ├── UnlockMemoryUseCase.ts
│   │   │   ├── GetDeviceInfoUseCase.ts
│   │   │   ├── GetRecordingStatusUseCase.ts
│   │   │   ├── GetGNSSStatusUseCase.ts
│   │   │   ├── GetMemoryStatusUseCase.ts
│   │   │   └── index.ts
│   │   ├── controllers/          # Controllers
│   │   │   ├── RaceBoxController.ts
│   │   │   └── index.ts
│   │   ├── services/             # Application services
│   │   │   ├── CommandOrchestrator.ts
│   │   │   ├── StateManager.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── ports/                    # Ports (Interfaces)
│   │   ├── primary/              # Primary ports (Driving/Inbound)
│   │   │   ├── RaceBoxClientPort.ts
│   │   │   ├── RaceBoxMessageHandlerPort.ts
│   │   │   └── index.ts
│   │   ├── secondary/            # Secondary ports (Driven/Outbound)
│   │   │   ├── BLEDevicePort.ts
│   │   │   ├── PacketParserPort.ts
│   │   │   ├── MessageFactoryPort.ts
│   │   │   ├── DataConverterPort.ts
│   │   │   ├── ErrorHandlerPort.ts
│   │   │   ├── StoragePort.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── adapters/                 # Adapters (Implementations)
│   │   ├── primary/              # Primary adapters (Driving/Inbound)
│   │   │   ├── RaceBoxClientAdapter.ts
│   │   │   ├── RaceBoxMessageHandlerAdapter.ts
│   │   │   └── index.ts
│   │   ├── secondary/            # Secondary adapters (Driven/Outbound)
│   │   │   ├── ble/             # BLE adapters
│   │   │   │   ├── ReactNativeBLEPLXAdapter.ts
│   │   │   │   ├── BLEMockAdapter.ts
│   │   │   │   └── index.ts
│   │   │   ├── protocol/        # Protocol adapters
│   │   │   │   ├── UBXPacketParserAdapter.ts
│   │   │   │   ├── RaceBoxMessageFactoryAdapter.ts
│   │   │   │   └── index.ts
│   │   │   ├── data/            # Data conversion adapters
│   │   │   │   ├── RaceBoxDataConverterAdapter.ts
│   │   │   │   └── index.ts
│   │   │   ├── error/           # Error handling adapters
│   │   │   │   ├── RaceBoxErrorHandlerAdapter.ts
│   │   │   │   └── index.ts
│   │   │   ├── storage/         # Storage adapters
│   │   │   │   ├── LocalStorageAdapter.ts
│   │   │   │   ├── MemoryStorageAdapter.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── infrastructure/           # Infrastructure Layer
│   │   ├── di/                  # Dependency injection
│   │   │   ├── RaceBoxContainer.ts
│   │   │   ├── RaceBoxModule.ts
│   │   │   └── index.ts
│   │   ├── config/              # Configuration
│   │   │   ├── RaceBoxConfig.ts
│   │   │   ├── BLEConfig.ts
│   │   │   ├── ProtocolConfig.ts
│   │   │   └── index.ts
│   │   ├── utils/               # Utilities
│   │   │   ├── checksum.ts
│   │   │   ├── buffer.ts
│   │   │   ├── validation.ts
│   │   │   ├── conversion.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── shared/                  # Shared code
│   │   ├── constants/           # Constants
│   │   │   ├── protocol.ts
│   │   │   ├── ble.ts
│   │   │   ├── errors.ts
│   │   │   └── index.ts
│   │   ├── types/               # Shared types
│   │   │   ├── common.ts
│   │   │   ├── ble.ts
│   │   │   ├── protocol.ts
│   │   │   └── index.ts
│   │   ├── utils/               # Shared utilities
│   │   │   ├── logger.ts
│   │   │   ├── timer.ts
│   │   │   ├── retry.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── factory/                 # Factory classes
│   │   ├── RaceBoxClientFactory.ts
│   │   ├── AdapterFactory.ts
│   │   └── index.ts
│   └── index.ts                 # Main entry point
├── tests/                       # Test files
│   ├── unit/                    # Unit tests
│   │   ├── domain/              # Domain layer tests
│   │   ├── application/         # Application layer tests
│   │   ├── ports/               # Port tests
│   │   └── index.test.ts
│   ├── integration/             # Integration tests
│   │   ├── adapters/            # Adapter integration tests
│   │   ├── infrastructure/      # Infrastructure integration tests
│   │   └── index.test.ts
│   ├── e2e/                     # End-to-end tests
│   │   ├── scenarios/           # Test scenarios
│   │   ├── fixtures/            # Test fixtures
│   │   └── index.test.ts
│   ├── mocks/                   # Mock implementations
│   ├── helpers/                 # Test helpers
│   └── setup/                   # Test setup
├── docs/                        # Documentation
├── examples/                    # Usage examples
├── scripts/                     # Build and utility scripts
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
├── README.md
└── CHANGELOG.md
```

---

## 🔌 Core Interfaces (Ports)

### Primary Ports (Driving/Inbound)

#### `RaceBoxClientPort` - Main Public API
```typescript
interface RaceBoxClientPort {
  // Data streams (RxJS for continuous data)
  liveData$: Observable<LiveDataMessage>;
  position$: Observable<Position>;
  motion$: Observable<MotionData>;
  deviceState$: Observable<DeviceState>;
  
  // Historical data streams (RxJS for continuous updates)
  historyData$: Observable<HistoryDataMessage>;
  recordingState$: Observable<RecordingState>;
  downloadProgress$: Observable<number>;
  
  // Configuration streams (RxJS for state changes)
  deviceConfig$: Observable<DeviceInfo>;
  recordingConfig$: Observable<RecordingConfiguration>;
  gnssConfig$: Observable<GNSSConfiguration>;
  
  // Error streams (RxJS for continuous error monitoring)
  connectionErrors$: Observable<RaceBoxError>;
  protocolErrors$: Observable<RaceBoxError>;
  deviceErrors$: Observable<RaceBoxError>;
  allErrors$: Observable<RaceBoxError>;
  
  // Commands (Promises for one-time actions)
  configureGNSS(config: GNSSConfiguration): Promise<void>;
  configureRecording(config: RecordingConfiguration): Promise<void>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<void>;
  pauseRecording(): Promise<void>;
  downloadHistory(): Promise<HistoryDataMessage[]>;
  eraseMemory(): Promise<void>;
  unlockMemory(securityCode: number): Promise<void>;
  
  // State queries (Promises for one-time state checks)
  getConnectionState(): Promise<ConnectionState>;
  getDeviceInfo(): Promise<DeviceInfo>;
  getRecordingStatus(): Promise<RecordingState>;
  getGNSSStatus(): Promise<GNSSStatus>;
  getMemoryStatus(): Promise<MemoryStatus>;
  
  // Utility methods (Synchronous for simple checks)
  isConnected(): boolean;
  getConfig(): RaceBoxConfig;
  updateConfig(config: Partial<RaceBoxConfig>): void;
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

### Secondary Ports (Driven/Outbound)

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

## 📦 Domain Models

### Core Entities

#### `RaceBoxDevice`
```typescript
interface RaceBoxDevice {
  id: string;
  name: string;
  model: 'RaceBox Mini' | 'RaceBox Mini S' | 'RaceBox Micro';
  serialNumber: string;
  firmwareVersion: string;
  hardwareRevision: string;
  manufacturer: string;
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

#### `GNSSConfiguration`
```typescript
interface GNSSConfiguration {
  platformModel: PlatformModel;
  enable3DSpeed: boolean;
  minHorizontalAccuracy: number;
}
```

### Value Objects

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
  timestamp: Date;
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

#### `SystemStatus`
```typescript
interface SystemStatus {
  batteryLevel: number;
  batteryVoltage?: number;
  isCharging: boolean;
  temperature?: number;
}
```

#### `SensorData`
```typescript
interface SensorData {
  gForce: GForce;
  rotationRate: RotationRate;
  timestamp: Date;
}
```

### Enums and Types

#### `DataRate`
```typescript
enum DataRate {
  RATE_25HZ = 0,
  RATE_10HZ = 1,
  RATE_5HZ = 2,
  RATE_1HZ = 3,
  RATE_20HZ = 4
}
```

#### `FixStatus`
```typescript
enum FixStatus {
  NO_FIX = 0,
  FIX_2D = 2,
  FIX_3D = 3
}
```

#### `PlatformModel`
```typescript
enum PlatformModel {
  AUTOMOTIVE = 4,
  SEA_USE = 5,
  AIRBORNE_LOW_DYNAMIC = 6,
  AIRBORNE_HIGH_DYNAMIC = 8
}
```

#### `RaceBoxError`
```typescript
interface RaceBoxError {
  type: 'connection' | 'protocol' | 'device' | 'configuration' | 'timeout';
  message: string;
  code?: string;
  timestamp: Date;
  recoverable: boolean;
  details?: any;
}
```

---

## 🔌 Adapter Implementations

### Primary Adapters (Driving/Inbound)

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

### Secondary Adapters (Driven/Outbound)

#### `ReactNativeBLEPLXAdapter`
```typescript
class ReactNativeBLEPLXAdapter implements BLEDevicePort {
  private device: Device;
  private connectionStateSubject = new Subject<ConnectionState>();
  private connectionErrorSubject = new Subject<BLEError>();
  
  constructor(device: Device) {
    this.device = device;
  }
  
  async connect(deviceId: string): Promise<void> {
    // Implementation using react-native-ble-plx
  }
  
  async sendData(data: Uint8Array): Promise<void> {
    // Send data via BLE characteristic
  }
  
  subscribeToCharacteristic(characteristic: string): Observable<Uint8Array> {
    // Subscribe to BLE characteristic notifications
  }
}
```

#### `UBXPacketParserAdapter`
```typescript
class UBXPacketParserAdapter implements PacketParserPort {
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

#### `RaceBoxMessageFactoryAdapter`
```typescript
class RaceBoxMessageFactoryAdapter implements MessageFactoryPort {
  createGNSSConfigRequest(): RaceBoxMessage {
    // Create GNSS config request message
  }
  
  createRecordingConfigSet(config: RecordingConfiguration): RaceBoxMessage {
    // Create recording config set message
  }
  
  // Other message creation methods
}
```

#### `RaceBoxDataConverterAdapter`
```typescript
class RaceBoxDataConverterAdapter implements DataConverterPort {
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

## 🏛️ Application Layer

### Use Cases

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

### Controllers

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

### Dependency Injection

#### `RaceBoxContainer`
```typescript
class RaceBoxContainer {
  static create(): RaceBoxClientPort {
    // Create and wire all dependencies
    const bleDevice = new ReactNativeBLEPLXAdapter(device);
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

### Factory Pattern

#### `RaceBoxClientFactory`
```typescript
class RaceBoxClientFactory {
  static createClient(bleDevice: Device, config?: RaceBoxConfig): RaceBoxClientPort {
    return RaceBoxContainer.create();
  }
}
```

---

## 🔄 Data Flow Architecture

### 1. Incoming Data Flow
```
BLE Device → ReactNativeBLEPLXAdapter → UBXPacketParser → MessageHandler → Domain Objects → Observables
```

### 2. Outgoing Data Flow
```
Use Case → MessageFactory → Packet Creation → ReactNativeBLEPLXAdapter → BLE Device
```

### 3. Error Flow
```
Error Source → ErrorHandler → Recovery Strategy → Domain Objects → Observables
```

---

## 🧪 Testing Strategy

### Unit Tests
- **Domain Tests**: Test business logic in isolation
- **Port Tests**: Test interface contracts
- **Use Case Tests**: Test application logic

### Integration Tests
- **Adapter Tests**: Test adapter implementations
- **Infrastructure Tests**: Test infrastructure components

### End-to-End Tests
- **Scenario Tests**: Test complete user workflows
- **Real Device Tests**: Test with actual RaceBox devices

---

## 📱 Use Case Examples

### 1. Standalone Recording Screen
```typescript
// Subscribe to recording state changes
racebox.recordingState$.subscribe(state => {
  updateRecordingStatus(state);
  updateMemoryDisplay(state.memoryLevel);
});

// Subscribe to configuration changes
racebox.recordingConfig$.subscribe(config => {
  updateConfigurationDisplay(config);
});

// Subscribe to errors
racebox.allErrors$.subscribe(error => {
  showErrorMessage(error);
});

// User actions
async function startRecording() {
  try {
    await racebox.startRecording();
    showSuccessMessage('Recording started');
  } catch (error) {
    showErrorMessage('Failed to start recording');
  }
}

async function updateConfiguration(newConfig: RecordingConfiguration) {
  try {
    await racebox.configureRecording(newConfig);
    showSuccessMessage('Configuration updated');
  } catch (error) {
    showErrorMessage('Failed to update configuration');
  }
}
```

### 2. Real-time Data Dashboard
```typescript
// Combine multiple streams for dashboard
combineLatest([
  racebox.position$,
  racebox.motion$,
  racebox.deviceState$
]).subscribe(([position, motion, deviceState]) => {
  updateDashboard({
    position,
    motion,
    deviceState
  });
});

// Monitor GNSS status separately
racebox.gnssState$.subscribe(gnssState => {
  updateGNSSStatus(gnssState);
});
```

### 3. Data Download Manager
```typescript
// Monitor download progress
racebox.downloadProgress$.subscribe(progress => {
  updateProgressBar(progress);
});

// Handle downloaded data
racebox.historyData$.subscribe(data => {
  processHistoricalData(data);
});

// Download management
async function downloadAllData() {
  try {
    const data = await racebox.downloadHistory();
    saveToFile(data);
    showSuccessMessage('Download completed');
  } catch (error) {
    showErrorMessage('Download failed');
  }
}
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

## 📄 Configuration Files

### `package.json`
```json
{
  "name": "racebox-ble-client",
  "version": "1.0.0",
  "description": "RaceBox BLE Client using Hexagonal Architecture",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "jest --config jest.e2e.config.js",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "dev": "ts-node scripts/dev/dev-server.ts"
  },
  "dependencies": {
    "rxjs": "^7.8.0",
    "react-native-ble-plx": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "ts-node": "^10.9.0"
  }
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### `jest.config.js`
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts']
};
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

This comprehensive implementation provides:

1. **Clean Architecture**: Hexagonal Architecture with clear separation
2. **High Testability**: Easy to mock and test components
3. **Flexible Design**: Easy to adapt to changing requirements
4. **Maintainable Code**: Clear structure and responsibilities
5. **Scalable Architecture**: Easy to extend and enhance

The RaceBox BLE client is designed to be robust, testable, and maintainable while providing a clean API for consumers. The hexagonal architecture ensures that the system can evolve and adapt to future requirements while maintaining excellent code quality and developer experience. 