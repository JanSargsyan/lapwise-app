# LapWise App - Clean Architecture with Dependency Injection

## Overview

This application implements a clean architecture pattern with dependency injection to abstract device communication technologies. The architecture is designed to be technology-agnostic, allowing devices to be implemented using different communication protocols (BLE, WiFi, USB, etc.).

## Architecture Layers

### 1. Domain Layer (`src/domain/`)

**Core business logic and entities that are technology-independent.**

#### Entities (`src/domain/entities/`)
- `Device.ts` - Core device entity with info, status, and data structures
- `DeviceType` - Enum for different device types (RACEBOX, RACELOGIC, CUSTOM)
- `DeviceData` - Interface for device sensor data (location, motion, sensors)

#### Repositories (`src/domain/repositories/`)
- `IDeviceRepository.ts` - Abstract interface for device communication
- Defines methods for scanning, connecting, and data streaming
- Technology-agnostic contract that any implementation must follow

#### Services (`src/domain/services/`)
- `IDeviceProtocolService.ts` - Abstract interface for device-specific protocols
- `ProtocolRegistry` - Registry pattern for managing multiple protocols
- Handles device identification and data parsing

### 2. Application Layer (`src/application/`)

**Use cases that orchestrate domain operations.**

#### Use Cases (`src/application/use-cases/`)
- `DeviceUseCases.ts` - Orchestrates device operations
- Provides high-level business logic
- Handles error management and logging

### 3. Infrastructure Layer (`src/infrastructure/`)

**Technology-specific implementations and external dependencies.**

#### BLE Implementation (`src/infrastructure/ble/`)
- `BLEDeviceRepository.ts` - Real BLE implementation
- `MockDeviceRepository.ts` - Mock implementation for testing
- `RaceBoxProtocolService.ts` - RaceBox-specific protocol implementation

#### Dependency Injection (`src/infrastructure/di/`)
- `Container.ts` - DI container managing all dependencies
- Singleton pattern for service registration
- Environment-aware (mock vs real implementations)

### 4. Presentation Layer (`src/presentation/`)

**React components and hooks for UI.**

#### Hooks (`src/presentation/hooks/`)
- `useDeviceManager.ts` - React hook providing device management
- Manages state and provides actions to components

#### Components (`src/presentation/components/`)
- `DeviceManager.tsx` - Main UI component using the clean architecture

## Key Features

### 1. Technology Abstraction
```typescript
// Domain interface - technology agnostic
interface IDeviceRepository {
  startScan(): Promise<void>;
  connectToDevice(deviceId: string): Promise<Device>;
  // ...
}

// Infrastructure implementations
class BLEDeviceRepository implements IDeviceRepository { /* ... */ }
class WiFiDeviceRepository implements IDeviceRepository { /* ... */ }
class USBDeviceRepository implements IDeviceRepository { /* ... */ }
```

### 2. Dependency Injection
```typescript
// Container manages all dependencies
const container = Container.getInstance();
const deviceRepository = container.getDeviceRepository('ble');
const protocolService = container.getProtocolService('racebox');
```

### 3. Protocol Extensibility
```typescript
// Easy to add new device protocols
class RaceLogicProtocolService implements IDeviceProtocolService { /* ... */ }
class CustomProtocolService implements IDeviceProtocolService { /* ... */ }

// Register in container
container.getProtocolRegistry().registerProtocol(new RaceLogicProtocolService());
```

### 4. Environment-Aware Implementation
```typescript
// Development uses mock, production uses real
const isDevelopment = __DEV__;
if (isDevelopment) {
  return new MockDeviceRepository(protocolService);
} else {
  return new BLEDeviceRepository(protocolService);
}
```

## Usage Example

### Adding a New Device Type

1. **Create Protocol Service:**
```typescript
// src/infrastructure/ble/protocols/NewDeviceProtocolService.ts
export class NewDeviceProtocolService implements IDeviceProtocolService {
  canHandleDevice(deviceInfo: Partial<{ name: string; manufacturer: string }>): boolean {
    return deviceInfo.name?.includes('newdevice') || false;
  }
  
  parseRawData(rawData: string | Uint8Array): DeviceData | null {
    // Parse device-specific data format
  }
  
  // ... other required methods
}
```

2. **Register in Container:**
```typescript
// src/infrastructure/di/Container.ts
private initializeServices(): void {
  const newDeviceProtocol = new NewDeviceProtocolService();
  this.protocolRegistry.registerProtocol(newDeviceProtocol);
  this.protocolServices.set('newdevice', newDeviceProtocol);
}
```

3. **Add Device Type:**
```typescript
// src/domain/entities/Device.ts
export enum DeviceType {
  RACEBOX = 'racebox',
  RACELOGIC = 'racelogic',
  NEWDEVICE = 'newdevice', // Add new type
  CUSTOM = 'custom',
}
```

### Adding a New Communication Technology

1. **Create Repository Implementation:**
```typescript
// src/infrastructure/wifi/WiFiDeviceRepository.ts
export class WiFiDeviceRepository implements IDeviceRepository {
  // Implement all required methods
  async startScan(): Promise<void> { /* ... */ }
  async connectToDevice(deviceId: string): Promise<Device> { /* ... */ }
  // ... other methods
}
```

2. **Register in Container:**
```typescript
// src/infrastructure/di/Container.ts
const wifiRepository = new WiFiDeviceRepository(protocolService);
this.repositories.set('wifi', wifiRepository);
```

3. **Use in Application:**
```typescript
const wifiRepository = container.getDeviceRepository('wifi');
const deviceUseCases = new DeviceUseCases(wifiRepository);
```

## Benefits

1. **Separation of Concerns** - Each layer has a specific responsibility
2. **Testability** - Easy to mock dependencies and test in isolation
3. **Extensibility** - Easy to add new device types and communication technologies
4. **Maintainability** - Clear structure and dependencies
5. **Technology Independence** - Domain logic doesn't depend on specific technologies
6. **Dependency Injection** - Loose coupling between components

## File Structure

```
src/
├── domain/
│   ├── entities/
│   │   └── Device.ts
│   ├── repositories/
│   │   └── IDeviceRepository.ts
│   └── services/
│       └── IDeviceProtocolService.ts
├── application/
│   └── use-cases/
│       └── DeviceUseCases.ts
├── infrastructure/
│   ├── ble/
│   │   ├── BLEDeviceRepository.ts
│   │   ├── MockDeviceRepository.ts
│   │   └── protocols/
│   │       └── RaceBoxProtocolService.ts
│   └── di/
│       └── Container.ts
└── presentation/
    ├── components/
    │   └── DeviceManager.tsx
    └── hooks/
        └── useDeviceManager.ts
```

## Testing

The architecture supports easy testing through:
- Mock implementations for development
- Dependency injection for easy mocking
- Clear interfaces for unit testing
- Separation of concerns for integration testing

## Future Enhancements

1. **Additional Communication Technologies**
   - WiFi device support
   - USB device support
   - Serial communication

2. **Additional Device Types**
   - RaceLogic devices
   - Custom protocols
   - Generic sensor devices

3. **Advanced Features**
   - Device firmware updates
   - Configuration management
   - Data logging and analytics
   - Real-time collaboration 