# RaceBox BLE Client - Folder Structure

## Overview
This document outlines the complete folder structure for the RaceBox BLE client using Hexagonal Architecture. The structure accommodates all source files, tests, and follows clean architecture principles.

---

## 📁 Root Structure

```
racebox-ble-client/
├── src/                          # Source code
├── tests/                        # Test files
├── docs/                         # Documentation
├── examples/                     # Usage examples
├── scripts/                      # Build and utility scripts
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
├── README.md
└── CHANGELOG.md
```

---

## 📁 Source Code Structure (`src/`)

```
src/
├── domain/                       # Domain Layer (Core Business Logic)
│   ├── entities/                 # Domain entities
│   │   ├── RaceBoxDevice.ts
│   │   ├── LiveDataMessage.ts
│   │   ├── RecordingConfiguration.ts
│   │   ├── GNSSConfiguration.ts
│   │   └── index.ts
│   ├── value-objects/            # Value objects
│   │   ├── Position.ts
│   │   ├── MotionData.ts
│   │   ├── GNSSStatus.ts
│   │   ├── SystemStatus.ts
│   │   ├── SensorData.ts
│   │   ├── Speed.ts
│   │   ├── Heading.ts
│   │   ├── GForce.ts
│   │   ├── RotationRate.ts
│   │   ├── RecordingStatus.ts
│   │   ├── MemoryStatus.ts
│   │   ├── DeviceState.ts
│   │   ├── ConnectionState.ts
│   │   └── index.ts
│   ├── services/                 # Domain services
│   │   ├── RaceBoxProtocolService.ts
│   │   ├── DataConversionService.ts
│   │   ├── ValidationService.ts
│   │   └── index.ts
│   ├── types/                    # Domain types and enums
│   │   ├── DeviceCapabilities.ts
│   │   ├── DataRate.ts
│   │   ├── FixStatus.ts
│   │   ├── PlatformModel.ts
│   │   ├── RecordingFilters.ts
│   │   ├── RecordingThresholds.ts
│   │   ├── RecordingTimeouts.ts
│   │   ├── RaceBoxError.ts
│   │   ├── Acknowledgment.ts
│   │   └── index.ts
│   └── index.ts
├── application/                  # Application Layer (Use Cases)
│   ├── use-cases/               # Use case implementations
│   │   ├── ConnectToDeviceUseCase.ts
│   │   ├── ConfigureGNSSUseCase.ts
│   │   ├── ConfigureRecordingUseCase.ts
│   │   ├── StartRecordingUseCase.ts
│   │   ├── StopRecordingUseCase.ts
│   │   ├── PauseRecordingUseCase.ts
│   │   ├── DownloadHistoryUseCase.ts
│   │   ├── EraseMemoryUseCase.ts
│   │   ├── UnlockMemoryUseCase.ts
│   │   ├── GetDeviceInfoUseCase.ts
│   │   ├── GetRecordingStatusUseCase.ts
│   │   ├── GetGNSSStatusUseCase.ts
│   │   ├── GetMemoryStatusUseCase.ts
│   │   └── index.ts
│   ├── controllers/              # Controllers
│   │   ├── RaceBoxController.ts
│   │   └── index.ts
│   ├── services/                 # Application services
│   │   ├── CommandOrchestrator.ts
│   │   ├── StateManager.ts
│   │   └── index.ts
│   └── index.ts
├── ports/                        # Ports (Interfaces)
│   ├── primary/                  # Primary ports (Driving/Inbound)
│   │   ├── RaceBoxClientPort.ts
│   │   ├── RaceBoxMessageHandlerPort.ts
│   │   └── index.ts
│   ├── secondary/                # Secondary ports (Driven/Outbound)
│   │   ├── BLEDevicePort.ts
│   │   ├── PacketParserPort.ts
│   │   ├── MessageFactoryPort.ts
│   │   ├── DataConverterPort.ts
│   │   ├── ErrorHandlerPort.ts
│   │   ├── StoragePort.ts
│   │   └── index.ts
│   └── index.ts
├── adapters/                     # Adapters (Implementations)
│   ├── primary/                  # Primary adapters (Driving/Inbound)
│   │   ├── RaceBoxClientAdapter.ts
│   │   ├── RaceBoxMessageHandlerAdapter.ts
│   │   └── index.ts
│   ├── secondary/                # Secondary adapters (Driven/Outbound)
│   │   ├── ble/                 # BLE adapters
│   │   │   ├── ReactNativeBLEPLXAdapter.ts
│   │   │   ├── BLEMockAdapter.ts
│   │   │   └── index.ts
│   │   ├── protocol/            # Protocol adapters
│   │   │   ├── UBXPacketParserAdapter.ts
│   │   │   ├── RaceBoxMessageFactoryAdapter.ts
│   │   │   └── index.ts
│   │   ├── data/                # Data conversion adapters
│   │   │   ├── RaceBoxDataConverterAdapter.ts
│   │   │   └── index.ts
│   │   ├── error/               # Error handling adapters
│   │   │   ├── RaceBoxErrorHandlerAdapter.ts
│   │   │   └── index.ts
│   │   ├── storage/             # Storage adapters
│   │   │   ├── LocalStorageAdapter.ts
│   │   │   ├── MemoryStorageAdapter.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   └── index.ts
├── infrastructure/               # Infrastructure Layer
│   ├── di/                      # Dependency injection
│   │   ├── RaceBoxContainer.ts
│   │   ├── RaceBoxModule.ts
│   │   └── index.ts
│   ├── config/                  # Configuration
│   │   ├── RaceBoxConfig.ts
│   │   ├── BLEConfig.ts
│   │   ├── ProtocolConfig.ts
│   │   └── index.ts
│   ├── utils/                   # Utilities
│   │   ├── checksum.ts
│   │   ├── buffer.ts
│   │   ├── validation.ts
│   │   ├── conversion.ts
│   │   └── index.ts
│   └── index.ts
├── shared/                      # Shared code
│   ├── constants/               # Constants
│   │   ├── protocol.ts
│   │   ├── ble.ts
│   │   ├── errors.ts
│   │   └── index.ts
│   ├── types/                   # Shared types
│   │   ├── common.ts
│   │   ├── ble.ts
│   │   ├── protocol.ts
│   │   └── index.ts
│   ├── utils/                   # Shared utilities
│   │   ├── logger.ts
│   │   ├── timer.ts
│   │   ├── retry.ts
│   │   └── index.ts
│   └── index.ts
├── factory/                     # Factory classes
│   ├── RaceBoxClientFactory.ts
│   ├── AdapterFactory.ts
│   └── index.ts
└── index.ts                     # Main entry point
```

---

## 📁 Test Structure (`tests/`)

```
tests/
├── unit/                        # Unit tests
│   ├── domain/                  # Domain layer tests
│   │   ├── entities/
│   │   │   ├── RaceBoxDevice.test.ts
│   │   │   ├── LiveDataMessage.test.ts
│   │   │   ├── RecordingConfiguration.test.ts
│   │   │   └── index.test.ts
│   │   ├── value-objects/
│   │   │   ├── Position.test.ts
│   │   │   ├── MotionData.test.ts
│   │   │   ├── GNSSStatus.test.ts
│   │   │   └── index.test.ts
│   │   ├── services/
│   │   │   ├── RaceBoxProtocolService.test.ts
│   │   │   ├── DataConversionService.test.ts
│   │   │   └── index.test.ts
│   │   └── index.test.ts
│   ├── application/             # Application layer tests
│   │   ├── use-cases/
│   │   │   ├── ConnectToDeviceUseCase.test.ts
│   │   │   ├── ConfigureRecordingUseCase.test.ts
│   │   │   ├── StartRecordingUseCase.test.ts
│   │   │   └── index.test.ts
│   │   ├── controllers/
│   │   │   ├── RaceBoxController.test.ts
│   │   │   └── index.test.ts
│   │   └── index.test.ts
│   ├── ports/                   # Port tests
│   │   ├── primary/
│   │   │   ├── RaceBoxClientPort.test.ts
│   │   │   ├── RaceBoxMessageHandlerPort.test.ts
│   │   │   └── index.test.ts
│   │   ├── secondary/
│   │   │   ├── BLEDevicePort.test.ts
│   │   │   ├── PacketParserPort.test.ts
│   │   │   └── index.test.ts
│   │   └── index.test.ts
│   └── index.test.ts
├── integration/                 # Integration tests
│   ├── adapters/               # Adapter integration tests
│   │   ├── primary/
│   │   │   ├── RaceBoxClientAdapter.test.ts
│   │   │   ├── RaceBoxMessageHandlerAdapter.test.ts
│   │   │   └── index.test.ts
│   │   ├── secondary/
│   │   │   ├── ble/
│   │   │   │   ├── ReactNativeBLEPLXAdapter.test.ts
│   │   │   │   └── index.test.ts
│   │   │   ├── protocol/
│   │   │   │   ├── UBXPacketParserAdapter.test.ts
│   │   │   │   ├── RaceBoxMessageFactoryAdapter.test.ts
│   │   │   │   └── index.test.ts
│   │   │   ├── data/
│   │   │   │   ├── RaceBoxDataConverterAdapter.test.ts
│   │   │   │   └── index.test.ts
│   │   │   └── index.test.ts
│   │   └── index.test.ts
│   ├── infrastructure/          # Infrastructure integration tests
│   │   ├── di/
│   │   │   ├── RaceBoxContainer.test.ts
│   │   │   └── index.test.ts
│   │   ├── config/
│   │   │   ├── RaceBoxConfig.test.ts
│   │   │   └── index.test.ts
│   │   └── index.test.ts
│   └── index.test.ts
├── e2e/                        # End-to-end tests
│   ├── scenarios/              # Test scenarios
│   │   ├── connection.test.ts
│   │   ├── recording.test.ts
│   │   ├── configuration.test.ts
│   │   ├── data-download.test.ts
│   │   ├── error-handling.test.ts
│   │   └── index.test.ts
│   ├── fixtures/               # Test fixtures
│   │   ├── sample-data/
│   │   │   ├── live-data.json
│   │   │   ├── recording-config.json
│   │   │   ├── gnss-config.json
│   │   │   └── index.json
│   │   ├── mock-devices/
│   │   │   ├── racebox-mini.json
│   │   │   ├── racebox-mini-s.json
│   │   │   ├── racebox-micro.json
│   │   │   └── index.json
│   │   └── index.json
│   └── index.test.ts
├── mocks/                      # Mock implementations
│   ├── ble/
│   │   ├── MockBLEDevice.ts
│   │   ├── MockBLEService.ts
│   │   ├── MockBLECharacteristic.ts
│   │   └── index.ts
│   ├── protocol/
│   │   ├── MockPacketParser.ts
│   │   ├── MockMessageFactory.ts
│   │   └── index.ts
│   ├── data/
│   │   ├── MockDataConverter.ts
│   │   └── index.ts
│   ├── error/
│   │   ├── MockErrorHandler.ts
│   │   └── index.ts
│   └── index.ts
├── helpers/                    # Test helpers
│   ├── TestUtils.ts
│   ├── MockFactory.ts
│   ├── AssertionHelpers.ts
│   ├── AsyncHelpers.ts
│   └── index.ts
└── setup/                      # Test setup
    ├── jest.setup.ts
    ├── test-environment.ts
    └── index.ts
```

---

## 📁 Documentation Structure (`docs/`)

```
docs/
├── api/                        # API documentation
│   ├── README.md
│   ├── interfaces.md
│   ├── examples.md
│   └── migration.md
├── architecture/               # Architecture documentation
│   ├── hexagonal-overview.md
│   ├── domain-model.md
│   ├── ports-and-adapters.md
│   └── data-flow.md
├── development/                # Development guides
│   ├── setup.md
│   ├── testing.md
│   ├── contributing.md
│   └── deployment.md
├── protocols/                  # Protocol documentation
│   ├── racebox-ble-protocol.md
│   ├── ubx-packet-format.md
│   └── message-types.md
└── index.md
```

---

## 📁 Examples Structure (`examples/`)

```
examples/
├── basic-usage/               # Basic usage examples
│   ├── simple-connection.ts
│   ├── live-data-streaming.ts
│   ├── recording-management.ts
│   └── README.md
├── advanced-usage/            # Advanced usage examples
│   ├── multi-device.ts
│   ├── custom-adapters.ts
│   ├── error-recovery.ts
│   └── README.md
├── react-native/              # React Native examples
│   ├── App.tsx
│   ├── RaceBoxScreen.tsx
│   ├── RecordingScreen.tsx
│   └── README.md
├── web/                      # Web examples
│   ├── index.html
│   ├── app.js
│   ├── racebox-client.js
│   └── README.md
└── index.md
```

---

## 📁 Scripts Structure (`scripts/`)

```
scripts/
├── build/                     # Build scripts
│   ├── build.ts
│   ├── build-web.ts
│   ├── build-react-native.ts
│   └── index.ts
├── test/                      # Test scripts
│   ├── run-tests.ts
│   ├── coverage.ts
│   ├── e2e.ts
│   └── index.ts
├── dev/                       # Development scripts
│   ├── dev-server.ts
│   ├── watch.ts
│   ├── lint.ts
│   └── index.ts
├── deploy/                    # Deployment scripts
│   ├── publish.ts
│   ├── version.ts
│   └── index.ts
└── index.ts
```

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

## 🔄 Import/Export Structure

### Main Entry Point (`src/index.ts`)
```typescript
// Public API exports
export { RaceBoxClientFactory } from './factory/RaceBoxClientFactory';
export { RaceBoxClientPort } from './ports/primary/RaceBoxClientPort';

// Domain exports
export * from './domain/entities';
export * from './domain/value-objects';
export * from './domain/types';

// Configuration exports
export * from './infrastructure/config';

// Error types
export * from './domain/types/RaceBoxError';
```

### Domain Exports (`src/domain/index.ts`)
```typescript
// Entities
export * from './entities';
export * from './value-objects';
export * from './services';
export * from './types';
```

### Ports Exports (`src/ports/index.ts`)
```typescript
// Primary ports
export * from './primary';

// Secondary ports
export * from './secondary';
```

---

## 🧪 Test Organization

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

### Mock Structure
- **BLE Mocks**: Mock BLE device behavior
- **Protocol Mocks**: Mock protocol responses
- **Data Mocks**: Mock data conversion
- **Error Mocks**: Mock error scenarios

---

## 📊 Benefits of This Structure

### 1. **Clear Separation**
- Domain logic isolated from infrastructure
- Ports define clear contracts
- Adapters handle external dependencies

### 2. **Testability**
- Easy to mock dependencies
- Isolated unit tests
- Comprehensive test coverage

### 3. **Maintainability**
- Clear file organization
- Consistent naming conventions
- Modular architecture

### 4. **Scalability**
- Easy to add new features
- Parallel development possible
- Clear extension points

### 5. **Documentation**
- Self-documenting structure
- Clear examples
- Comprehensive guides

This folder structure provides a solid foundation for implementing the RaceBox BLE client using Hexagonal Architecture while maintaining excellent testability and maintainability. 