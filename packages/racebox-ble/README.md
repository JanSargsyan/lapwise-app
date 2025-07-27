# RaceBox BLE Client

A TypeScript client library for communicating with RaceBox devices over Bluetooth Low Energy (BLE), built using Hexagonal Architecture principles.

## Features

- **Hexagonal Architecture**: Clean separation of concerns with ports and adapters
- **TypeScript**: Full type safety and excellent developer experience
- **RxJS Integration**: Reactive programming for data streams
- **Promise-based Commands**: Simple async/await for one-time operations
- **Comprehensive Error Handling**: Detailed error types and recovery strategies
- **Testable Design**: Easy to mock and test all components
- **React Native Ready**: Built for React Native with `react-native-ble-plx`

## Installation

```bash
npm install racebox-ble-client
```

## Quick Start

```typescript
import { RaceBoxClientFactory } from 'racebox-ble-client';

// Create a client with a BLE device
const client = RaceBoxClientFactory.createClient(bleDevice);

// Subscribe to live data
client.liveData$.subscribe(data => {
  console.log('Position:', data.position);
  console.log('Speed:', data.motion.speed);
  console.log('Battery:', data.systemStatus.batteryLevel);
});

// Configure and start recording
await client.configureRecording({
  enabled: true,
  dataRate: DataRate.RATE_10HZ,
  filters: {
    minSpeed: 1.0,
    enableAccelerometer: true
  }
});

await client.startRecording();
```

## Architecture

This library follows Hexagonal Architecture (Ports and Adapters) principles:

### Domain Layer
- **Entities**: Core business objects (LiveDataMessage, RecordingConfiguration, etc.)
- **Value Objects**: Immutable data structures (Position, Speed, etc.)
- **Types**: Enums and interfaces (DataRate, FixStatus, etc.)

### Application Layer
- **Use Cases**: Business logic implementation
- **Controllers**: Orchestration of use cases
- **Services**: Application-level services

### Ports (Interfaces)
- **Primary Ports**: Driven by external actors (RaceBoxClientPort)
- **Secondary Ports**: Driven by the application (BLEDevicePort, PacketParserPort, etc.)

### Adapters (Implementations)
- **Primary Adapters**: Implement primary ports
- **Secondary Adapters**: Implement secondary ports

## API Reference

### Data Streams (Observables)

```typescript
// Live data streams
client.liveData$: Observable<LiveDataMessage>
client.position$: Observable<Position>
client.motion$: Observable<MotionData>
client.deviceState$: Observable<ConnectionState>

// Historical data streams
client.historyData$: Observable<LiveDataMessage>
client.recordingState$: Observable<RecordingState>
client.downloadProgress$: Observable<number>

// Configuration streams
client.deviceConfig$: Observable<DeviceInfo>
client.recordingConfig$: Observable<RecordingConfiguration>
client.gnssConfig$: Observable<GNSSConfiguration>

// Error streams
client.connectionErrors$: Observable<RaceBoxError>
client.protocolErrors$: Observable<RaceBoxError>
client.deviceErrors$: Observable<RaceBoxError>
client.allErrors$: Observable<RaceBoxError>
```

### Commands (Promises)

```typescript
// Configuration commands
await client.configureGNSS(config: GNSSConfiguration)
await client.configureRecording(config: RecordingConfiguration)

// Recording control
await client.startRecording()
await client.stopRecording()
await client.pauseRecording()

// Data management
await client.downloadHistory(): Promise<LiveDataMessage[]>
await client.eraseMemory()
await client.unlockMemory(securityCode: number)

// Status queries
await client.getConnectionState(): Promise<ConnectionState>
await client.getDeviceInfo(): Promise<DeviceInfo>
await client.getRecordingStatus(): Promise<RecordingState>
await client.getGNSSStatus(): Promise<GNSSStatus>
await client.getMemoryStatus(): Promise<MemoryStatus>
```

### Utility Methods

```typescript
// Synchronous checks
client.isConnected(): boolean
client.getConfig(): RaceBoxConfig
client.updateConfig(config: Partial<RaceBoxConfig>): void
```

## Use Cases

### 1. Standalone Recording Screen

```typescript
// Subscribe to recording state changes
client.recordingState$.subscribe(state => {
  updateRecordingStatus(state);
  updateMemoryDisplay(state.memoryLevel);
});

// Subscribe to configuration changes
client.recordingConfig$.subscribe(config => {
  updateConfigurationDisplay(config);
});

// Subscribe to errors
client.allErrors$.subscribe(error => {
  showErrorMessage(error);
});

// User actions
async function startRecording() {
  try {
    await client.startRecording();
    showSuccessMessage('Recording started');
  } catch (error) {
    showErrorMessage('Failed to start recording');
  }
}

async function updateConfiguration(newConfig: RecordingConfiguration) {
  try {
    await client.configureRecording(newConfig);
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
  client.position$,
  client.motion$,
  client.deviceState$
]).subscribe(([position, motion, deviceState]) => {
  updateDashboard({
    position,
    motion,
    deviceState
  });
});

// Monitor GNSS status separately
client.gnssState$.subscribe(gnssState => {
  updateGNSSStatus(gnssState);
});
```

### 3. Data Download Manager

```typescript
// Monitor download progress
client.downloadProgress$.subscribe(progress => {
  updateProgressBar(progress);
});

// Handle downloaded data
client.historyData$.subscribe(data => {
  processHistoricalData(data);
});

// Download management
async function downloadAllData() {
  try {
    const data = await client.downloadHistory();
    saveToFile(data);
    showSuccessMessage('Download completed');
  } catch (error) {
    showErrorMessage('Download failed');
  }
}
```

## Error Handling

The library provides comprehensive error handling with specific error types:

```typescript
// Error types
interface RaceBoxError {
  type: 'connection' | 'protocol' | 'device' | 'configuration' | 'timeout';
  message: string;
  code?: string;
  timestamp: Date;
  recoverable: boolean;
  details?: any;
}

// Error handling
client.allErrors$.subscribe(error => {
  switch (error.type) {
    case 'connection':
      handleConnectionError(error);
      break;
    case 'protocol':
      handleProtocolError(error);
      break;
    case 'device':
      handleDeviceError(error);
      break;
    case 'timeout':
      handleTimeoutError(error);
      break;
  }
});
```

## Configuration

```typescript
// Default configuration
const config: RaceBoxConfig = {
  connectionTimeout: 10000, // 10 seconds
  commandTimeout: 5000,     // 5 seconds
  retryAttempts: 3,
  autoReconnect: true,
  dataBufferSize: 1024
};

// Update configuration
client.updateConfig({
  connectionTimeout: 15000,
  retryAttempts: 5
});
```

## Testing

The library is designed for easy testing:

```typescript
// Mock BLE device
const mockBLEDevice = {
  connect: jest.fn(),
  sendData: jest.fn(),
  subscribeToCharacteristic: jest.fn()
};

// Create client with mock
const client = RaceBoxClientFactory.createClient(mockBLEDevice);

// Test commands
await client.startRecording();
expect(mockBLEDevice.sendData).toHaveBeenCalledWith(expect.any(Uint8Array));

// Test streams
client.liveData$.subscribe(data => {
  expect(data).toHaveProperty('position');
  expect(data).toHaveProperty('motion');
});
```

## Development

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- TypeScript >= 5.0.0

### Setup

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

### Project Structure

```
src/
├── domain/           # Domain layer
│   ├── entities/     # Domain entities
│   ├── value-objects/ # Value objects
│   ├── types/        # Domain types
│   └── services/     # Domain services
├── application/      # Application layer
│   ├── use-cases/    # Use case implementations
│   ├── controllers/  # Controllers
│   └── services/     # Application services
├── ports/           # Ports (interfaces)
│   ├── primary/     # Primary ports
│   └── secondary/   # Secondary ports
├── adapters/        # Adapters (implementations)
│   ├── primary/     # Primary adapters
│   └── secondary/   # Secondary adapters
├── infrastructure/  # Infrastructure layer
│   ├── di/          # Dependency injection
│   ├── config/      # Configuration
│   └── utils/       # Utilities
├── shared/          # Shared code
│   ├── constants/   # Constants
│   ├── types/       # Shared types
│   └── utils/       # Shared utilities
└── factory/         # Factory classes
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the examples

## Changelog

See CHANGELOG.md for version history and changes. 