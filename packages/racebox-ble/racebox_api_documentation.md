# RaceBox BLE Client API Documentation

## Overview
The RaceBox BLE Client provides a reactive interface for communicating with RaceBox devices (Mini, Mini S, Micro). It handles all protocol messages and provides both streaming data and command-based interactions.

---

## 📊 Data Streams (Observables)

### Live Data Streams
These streams provide real-time data from the device.

#### `liveData$: Observable<LiveDataMessage>`
**Description**: Raw sensor data including GNSS, accelerometer, gyroscope, and system information.
**Update Frequency**: Up to 25Hz
**Use Cases**: 
- Real-time data logging
- Sensor data analysis
- Performance monitoring

#### `position$: Observable<Position>`
**Description**: GPS position data with converted coordinates and accuracy.
**Data**: `{ latitude, longitude, altitude, accuracy, timestamp }`
**Use Cases**:
- Map display
- Route tracking
- Location-based features

#### `motion$: Observable<MotionData>`
**Description**: Motion data including speed, heading, G-forces, and rotation rates.
**Data**: `{ speed, heading, gForce: {x,y,z}, rotationRate: {x,y,z}, timestamp }`
**Use Cases**:
- Performance analysis
- Driving behavior monitoring
- Motion visualization

#### `deviceState$: Observable<DeviceState>`
**Description**: Complete device state including connection, GNSS, recording, and memory status.
**Use Cases**:
- Status dashboard
- Device monitoring
- State synchronization

### Historical Data Streams

#### `historyData$: Observable<HistoryDataMessage>`
**Description**: Downloaded historical data during memory operations.
**Use Cases**:
- Data playback
- Historical analysis
- Data export

#### `recordingState$: Observable<RecordingState>`
**Description**: Current recording status and configuration.
**Data**: `{ status, memoryLevel, storedMessages, totalCapacity, securityEnabled, memoryUnlocked }`
**Use Cases**:
- Recording status display
- Memory management
- Security status monitoring

#### `downloadProgress$: Observable<number>`
**Description**: Download progress percentage (0-100).
**Use Cases**:
- Progress indicators
- Download status display

### Configuration Streams

#### `deviceConfig$: Observable<DeviceInfo>`
**Description**: Device information and capabilities.
**Data**: `{ name, model, serialNumber, firmwareVersion, hardwareRevision, manufacturer }`
**Use Cases**:
- Device identification
- Capability detection
- Version checking

#### `recordingConfig$: Observable<RecordingConfiguration>`
**Description**: Current recording configuration settings.
**Use Cases**:
- Configuration display
- Settings management
- Configuration validation

#### `gnssConfig$: Observable<GNSSConfiguration>`
**Description**: Current GNSS receiver configuration.
**Use Cases**:
- GNSS settings display
- Configuration management

### Error Streams

#### `connectionErrors$: Observable<RaceBoxError>`
**Description**: BLE connection-related errors.
**Use Cases**:
- Connection status monitoring
- Reconnection logic
- Error reporting

#### `protocolErrors$: Observable<RaceBoxError>`
**Description**: Protocol-related errors (invalid packets, checksums).
**Use Cases**:
- Data integrity monitoring
- Protocol debugging

#### `deviceErrors$: Observable<RaceBoxError>`
**Description**: Device-specific errors (unsupported commands, memory errors).
**Use Cases**:
- Device capability detection
- Error recovery

#### `allErrors$: Observable<RaceBoxError>`
**Description**: Combined error stream from all error sources.
**Use Cases**:
- Global error handling
- Error logging
- User notifications

---

## ⚙️ Commands (Promises)

### Configuration Commands

#### `configureGNSS(config: GNSSConfiguration): Promise<void>`
**Description**: Configure GNSS receiver settings.
**Parameters**:
- `platformModel`: Dynamic platform model (0-8)
- `enable3DSpeed`: Enable 3D speed reporting
- `minHorizontalAccuracy`: Minimum accuracy required (meters)
**Use Cases**:
- Optimize for different use cases (automotive, marine, airborne)
- Enable/disable 3D speed reporting
- Set accuracy requirements

#### `configureRecording(config: RecordingConfiguration): Promise<void>`
**Description**: Configure recording settings without starting recording.
**Parameters**:
- `enableRecording`: Enable/disable recording
- `dataRate`: Recording frequency (0-4)
- `filters`: Filter flags (bitmask)
- `stationarySpeedThreshold`: Speed threshold for stationary detection
- `stationaryTimeout`: Timeout for stationary detection
- `noFixTimeout`: Timeout for no-fix conditions
- `autoShutdownTimeout`: Auto-shutdown timeout
**Use Cases**:
- Set up recording parameters before starting
- Modify recording settings while recording
- Configure filters and timeouts

### Recording Control Commands

#### `startRecording(): Promise<void>`
**Description**: Start recording with current configuration.
**Use Cases**:
- Begin data recording
- Start standalone recording

#### `stopRecording(): Promise<void>`
**Description**: Stop current recording.
**Use Cases**:
- End recording session
- Pause for configuration changes

#### `pauseRecording(): Promise<void>`
**Description**: Pause current recording (Mini S/Micro only).
**Use Cases**:
- Temporary recording pause
- Configuration changes during recording

### Memory Operations

#### `downloadHistory(): Promise<HistoryDataMessage[]>`
**Description**: Download all recorded data from device memory.
**Returns**: Array of historical data messages
**Use Cases**:
- Data export
- Historical analysis
- Backup operations

#### `eraseMemory(): Promise<void>`
**Description**: Erase all recorded data from device memory.
**Use Cases**:
- Memory cleanup
- Fresh start
- Privacy protection

#### `unlockMemory(securityCode: number): Promise<void>`
**Description**: Unlock memory with security code.
**Parameters**:
- `securityCode`: 4-byte security code
**Use Cases**:
- Access protected memory
- Security management

### State Queries

#### `getConnectionState(): Promise<ConnectionState>`
**Description**: Get current connection status.
**Returns**: `{ status, deviceId?, error?, lastConnected? }`
**Use Cases**:
- Connection status checking
- Error diagnosis

#### `getDeviceInfo(): Promise<DeviceInfo>`
**Description**: Get device information and capabilities.
**Use Cases**:
- Device identification
- Capability detection

#### `getRecordingStatus(): Promise<RecordingState>`
**Description**: Get current recording status and memory information.
**Use Cases**:
- Status display
- Memory management

#### `getGNSSState(): Promise<GNSSState>`
**Description**: Get current GNSS fix status and satellite information.
**Use Cases**:
- GNSS status display
- Fix quality monitoring

#### `getMemoryState(): Promise<MemoryState>`
**Description**: Get memory status and security information.
**Use Cases**:
- Memory management
- Security status

---

## 🔧 Utility Methods

#### `isConnected(): boolean`
**Description**: Check if device is currently connected.
**Returns**: Connection status
**Use Cases**:
- Quick connection check
- Conditional operations

#### `getConfig(): RaceBoxConfig`
**Description**: Get current client configuration.
**Use Cases**:
- Configuration inspection
- Settings management

#### `updateConfig(config: Partial<RaceBoxConfig>): void`
**Description**: Update client configuration.
**Use Cases**:
- Runtime configuration changes
- Performance tuning

---

## 📱 Use Case Examples

### 1. Standalone Recording Screen
**Purpose**: Manage recording status and configuration.

**Observables to use**:
- `recordingState$` - Monitor recording status and memory
- `recordingConfig$` - Display current configuration
- `allErrors$` - Handle errors

**Commands to use**:
- `configureRecording()` - Update settings
- `startRecording()` - Begin recording
- `stopRecording()` - End recording
- `pauseRecording()` - Pause recording

**Implementation**:
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
**Purpose**: Display live sensor data and device status.

**Observables to use**:
- `liveData$` - Raw sensor data
- `position$` - GPS position
- `motion$` - Motion data
- `deviceState$` - Device status
- `gnssState$` - GNSS status

**Implementation**:
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
**Purpose**: Download and manage historical data.

**Observables to use**:
- `downloadProgress$` - Download progress
- `historyData$` - Downloaded data
- `memoryState$` - Memory status

**Commands to use**:
- `downloadHistory()` - Start download
- `eraseMemory()` - Clear memory
- `unlockMemory()` - Unlock protected memory

**Implementation**:
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

async function clearMemory() {
  try {
    await racebox.eraseMemory();
    showSuccessMessage('Memory cleared');
  } catch (error) {
    showErrorMessage('Failed to clear memory');
  }
}
```

### 4. Device Configuration Screen
**Purpose**: Configure device settings and GNSS parameters.

**Observables to use**:
- `deviceConfig$` - Device information
- `gnssConfig$` - Current GNSS settings
- `recordingConfig$` - Current recording settings

**Commands to use**:
- `configureGNSS()` - Update GNSS settings
- `configureRecording()` - Update recording settings

**Implementation**:
```typescript
// Display current device info
racebox.deviceConfig$.subscribe(deviceInfo => {
  updateDeviceInfo(deviceInfo);
});

// Display current GNSS settings
racebox.gnssConfig$.subscribe(gnssConfig => {
  updateGNSSSettings(gnssConfig);
});

// Update GNSS configuration
async function updateGNSSSettings(newConfig: GNSSConfiguration) {
  try {
    await racebox.configureGNSS(newConfig);
    showSuccessMessage('GNSS settings updated');
  } catch (error) {
    showErrorMessage('Failed to update GNSS settings');
  }
}
```

### 5. Error Handling and Recovery
**Purpose**: Handle errors and implement recovery strategies.

**Observables to use**:
- `connectionErrors$` - Connection issues
- `protocolErrors$` - Protocol errors
- `deviceErrors$` - Device errors
- `allErrors$` - All errors

**Implementation**:
```typescript
// Handle different error types
racebox.connectionErrors$.subscribe(error => {
  handleConnectionError(error);
});

racebox.protocolErrors$.subscribe(error => {
  handleProtocolError(error);
});

racebox.deviceErrors$.subscribe(error => {
  handleDeviceError(error);
});

// Global error handling
racebox.allErrors$.subscribe(error => {
  logError(error);
  notifyUser(error);
  
  // Implement recovery strategies
  if (error.recoverable) {
    attemptRecovery(error);
  }
});

function handleConnectionError(error: RaceBoxError) {
  if (error.type === 'connection') {
    // Attempt reconnection
    setTimeout(() => {
      reconnect();
    }, 5000);
  }
}
```

---

## 🔄 Stream Behavior

### Observable Lifecycle
- **Live Data Streams**: Emit continuously while connected
- **Configuration Streams**: Emit on configuration changes
- **Error Streams**: Emit on error occurrence
- **State Streams**: Emit on state changes

### Error Handling
- **Promise Rejection**: Commands reject on NACK or timeout
- **Stream Errors**: Error streams emit error objects
- **Recovery**: Automatic recovery for recoverable errors

### Performance Considerations
- **Stream Sharing**: Use `share()` for expensive streams
- **Memory Management**: Properly unsubscribe from streams
- **Buffer Management**: Limit buffer sizes for high-frequency streams

---

## ✅ Best Practices

1. **Always handle errors** from both Promises and Observables
2. **Unsubscribe from streams** when components are destroyed
3. **Use appropriate error recovery** strategies
4. **Monitor stream performance** for high-frequency data
5. **Validate configuration** before sending commands
6. **Implement proper state management** for UI updates
7. **Use TypeScript strictly** for type safety
8. **Test error scenarios** thoroughly

This API provides a comprehensive interface for all RaceBox protocol features while maintaining clean separation between streaming data and command operations. 