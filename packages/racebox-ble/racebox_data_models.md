# RaceBox BLE Protocol Data Models

## Overview
This document defines data models for RaceBox BLE protocol messages in a language-agnostic format. These models can be easily converted to any programming language (TypeScript, C++, Python, Rust, etc.).

---

## 📦 Base Packet Structure

```typescript
// UBX Binary Packet Format
interface UBXPacket {
  header: [0xB5, 0x62];        // 2 bytes - Always 0xB5 0x62
  class: number;                // 1 byte - Message class (0xFF for RaceBox)
  id: number;                   // 1 byte - Message ID
  payloadLength: number;        // 2 bytes - Unsigned int, size of payload
  payload: number[];            // Variable - 0-504 bytes
  checksum: [number, number];   // 2 bytes - CK_A, CK_B
}
```

---

## 📊 Data Message Models

### Live Data Message (0xFF 0x01)
```typescript
interface LiveDataMessage {
  // Time Information
  iTOW: number;                // 4 bytes - GPS time of week (ms)
  year: number;                 // 2 bytes - Year
  month: number;                // 1 byte - Month (1-12)
  day: number;                  // 1 byte - Day (1-31)
  hour: number;                 // 1 byte - Hour (0-23)
  minute: number;               // 1 byte - Minute (0-59)
  second: number;               // 1 byte - Second (0-59)
  validityFlags: number;        // 1 byte - Bitmask
  timeAccuracy: number;         // 4 bytes - Time accuracy (ns)
  nanoseconds: number;          // 4 bytes - Nanoseconds (can be negative)
  
  // GNSS Fix Information
  fixStatus: number;            // 1 byte - Fix status (0=no fix, 2=2D, 3=3D)
  fixStatusFlags: number;       // 1 byte - Bitmask
  dateTimeFlags: number;        // 1 byte - Bitmask
  numSatellites: number;        // 1 byte - Number of satellites
  
  // Position Information
  longitude: number;            // 4 bytes - Longitude (×10⁷)
  latitude: number;             // 4 bytes - Latitude (×10⁷)
  wgsAltitude: number;          // 4 bytes - WGS altitude (mm)
  mslAltitude: number;          // 4 bytes - MSL altitude (mm)
  horizontalAccuracy: number;   // 4 bytes - Horizontal accuracy (mm)
  verticalAccuracy: number;     // 4 bytes - Vertical accuracy (mm)
  
  // Motion Information
  speed: number;                // 4 bytes - Speed (mm/s)
  heading: number;              // 4 bytes - Heading (×10⁵ deg)
  speedAccuracy: number;        // 4 bytes - Speed accuracy (mm/s)
  headingAccuracy: number;      // 4 bytes - Heading accuracy (×10⁵ deg)
  pdop: number;                 // 2 bytes - PDOP (×100)
  latLonFlags: number;          // 1 byte - Bitmask
  
  // System Information
  batteryLevel: number;         // 1 byte - Battery % (Mini/S) or Voltage (Micro)
  
  // Sensor Data
  gForceX: number;              // 2 bytes - G-force X (milli-g)
  gForceY: number;              // 2 bytes - G-force Y (milli-g)
  gForceZ: number;              // 2 bytes - G-force Z (milli-g)
  rotationRateX: number;        // 2 bytes - Rotation rate X (centi-deg/sec)
  rotationRateY: number;        // 2 bytes - Rotation rate Y (centi-deg/sec)
  rotationRateZ: number;        // 2 bytes - Rotation rate Z (centi-deg/sec)
}

// Validity Flags Bitmask
interface ValidityFlags {
  validDate: boolean;           // Bit 0
  validTime: boolean;           // Bit 1
  fullyResolved: boolean;       // Bit 2
  validMagneticDeclination: boolean; // Bit 3
}

// Fix Status Flags Bitmask
interface FixStatusFlags {
  validFix: boolean;            // Bit 0
  differentialCorrections: boolean; // Bit 1
  powerState: number;           // Bits 2-4
  validHeading: boolean;        // Bit 5
  carrierPhaseRange: number;    // Bits 6-7
}

// Date/Time Flags Bitmask
interface DateTimeFlags {
  confirmationAvailable: boolean; // Bit 5
  utcDateConfirmed: boolean;    // Bit 6
  utcTimeConfirmed: boolean;    // Bit 7
}

// Lat/Lon Flags Bitmask
interface LatLonFlags {
  invalidLatLonAlt: boolean;    // Bit 0
  differentialCorrectionAge: number; // Bits 1-4
}
```

### History Data Message (0xFF 0x21)
```typescript
// Same structure as LiveDataMessage
type HistoryDataMessage = LiveDataMessage;
```

---

## ⚙️ Configuration Models

### GNSS Configuration (0xFF 0x27)
```typescript
interface GNSSConfiguration {
  platformModel: number;        // 1 byte - Dynamic Platform Model (0-8)
  enable3DSpeed: boolean;       // 1 byte - Enable 3D-Speed reporting
  minHorizontalAccuracy: number; // 1 byte - Min horizontal accuracy (meters)
}

enum PlatformModel {
  AUTOMOTIVE = 4,              // Default
  SEA_USE = 5,
  AIRBORNE_LOW_DYNAMIC = 6,
  AIRBORNE_HIGH_DYNAMIC = 8
}
```

---

## 🧾 Standalone Recording Models

### Recording Status (0xFF 0x22)
```typescript
interface RecordingStatus {
  recordingState: number;       // 1 byte - Non-zero = active
  memoryLevel: number;          // 1 byte - Memory level (0-100%)
  securityFlags: number;        // 1 byte - Memory security flags
  storedMessages: number;       // 4 bytes - Stored messages count
  totalCapacity: number;        // 4 bytes - Total memory capacity
}

interface SecurityFlags {
  securityEnabled: boolean;     // Bit 0
  memoryUnlocked: boolean;      // Bit 1
}
```

### Recording Configuration (0xFF 0x25)
```typescript
interface RecordingConfiguration {
  enableRecording: boolean;     // 1 byte - 1 = on, 0 = off
  dataRate: number;             // 1 byte - Data rate (0-4)
  filters: number;              // 1 byte - Filters & features bitmask
  stationarySpeedThreshold: number; // 2 bytes - Stationary speed threshold (mm/s)
  stationaryTimeout: number;    // 2 bytes - Stationary timeout (seconds)
  noFixTimeout: number;         // 2 bytes - No-fix timeout (seconds)
  autoShutdownTimeout: number;  // 2 bytes - Auto-shutdown timeout (seconds)
}

enum DataRate {
  RATE_25HZ = 0,               // 25Hz
  RATE_10HZ = 1,               // 10Hz
  RATE_5HZ = 2,                // 5Hz
  RATE_1HZ = 3,                // 1Hz
  RATE_20HZ = 4                // 20Hz (firmware 3.3+)
}

interface FilterFlags {
  waitForGNSSFix: boolean;     // Bit 0
  stationaryFilter: boolean;    // Bit 1
  noFixFilter: boolean;         // Bit 2
  autoShutdown: boolean;        // Bit 3
  waitForDataBeforeShutdown: boolean; // Bit 4
}
```

### Data Download (0xFF 0x23)
```typescript
interface DataDownloadRequest {
  action: number;               // 1 byte - 0 = start, 1 = cancel
}

interface DataDownloadResponse {
  maxExpectedMessages: number;  // 4 bytes - Max expected messages
}

enum DownloadAction {
  START = 0,
  CANCEL = 1
}
```

### Memory Erase (0xFF 0x24)
```typescript
interface MemoryEraseRequest {
  action: number;               // 1 byte - 0 = start, 1 = cancel
}

interface MemoryEraseProgress {
  progressPercent: number;      // 1 byte - Erase progress (0-100)
}

enum EraseAction {
  START = 0,
  CANCEL = 1
}
```

### Memory Unlock (0xFF 0x30)
```typescript
interface MemoryUnlockRequest {
  securityCode: number;         // 4 bytes - Security code (UInt32)
}
```

---

## 📡 State Change Models

### Recording State Change (0xFF 0x26)
```typescript
interface RecordingStateChange {
  state: number;                // 1 byte - State (0=stop, 1=start, 2=pause)
  configuration: RecordingConfiguration; // 11 bytes - Same as recording config
}

enum RecordingState {
  STOP = 0,
  START = 1,
  PAUSE = 2
}
```

---

## ✅ Acknowledgment Models

### ACK/NACK (0xFF 0x02/0x03)
```typescript
interface Acknowledgment {
  // No payload - just class and ID
}

enum AcknowledgmentType {
  ACK = 0x02,                  // Success
  NACK = 0x03                  // Failure
}
```

---

## 🔧 Utility Models

### Checksum Calculation
```typescript
interface ChecksumResult {
  ckA: number;                 // First checksum byte
  ckB: number;                 // Second checksum byte
}

// Checksum calculation function signature
function calculateChecksum(packet: number[]): ChecksumResult {
  // Implementation would calculate CK_A and CK_B
  // CK_A = sum of all bytes from class to end of payload
  // CK_B = sum of all CK_A values
}
```

### Packet Builder
```typescript
interface PacketBuilder {
  buildPacket(class: number, id: number, payload: number[]): UBXPacket;
  parsePacket(data: number[]): UBXPacket;
  validateChecksum(packet: UBXPacket): boolean;
}
```

### Message Factory
```typescript
interface MessageFactory {
  createLiveDataMessage(data: LiveDataMessage): UBXPacket;
  createGNSSConfigRequest(): UBXPacket;
  createGNSSConfigSet(config: GNSSConfiguration): UBXPacket;
  createRecordingStatusRequest(): UBXPacket;
  createRecordingConfigSet(config: RecordingConfiguration): UBXPacket;
  createDataDownloadRequest(action: DownloadAction): UBXPacket;
  createMemoryEraseRequest(action: EraseAction): UBXPacket;
  createMemoryUnlockRequest(securityCode: number): UBXPacket;
}
```

---

## 📋 Type Definitions

### Enums for Constants
```typescript
enum MessageClass {
  RACEBOX = 0xFF
}

enum MessageID {
  LIVE_DATA = 0x01,
  ACK = 0x02,
  NACK = 0x03,
  HISTORY_DATA = 0x21,
  RECORDING_STATUS = 0x22,
  DATA_DOWNLOAD = 0x23,
  MEMORY_ERASE = 0x24,
  RECORDING_CONFIG = 0x25,
  STATE_CHANGE = 0x26,
  GNSS_CONFIG = 0x27,
  MEMORY_UNLOCK = 0x30
}

enum FixStatus {
  NO_FIX = 0,
  FIX_2D = 2,
  FIX_3D = 3
}
```

### Conversion Helpers
```typescript
interface ConversionHelpers {
  // Convert raw values to human-readable units
  convertLongitude(raw: number): number;    // ×10⁷ to degrees
  convertLatitude(raw: number): number;     // ×10⁷ to degrees
  convertAltitude(raw: number): number;     // mm to meters
  convertSpeed(raw: number): number;        // mm/s to km/h
  convertHeading(raw: number): number;      // ×10⁵ to degrees
  convertGForce(raw: number): number;       // milli-g to g
  convertRotationRate(raw: number): number; // centi-deg/sec to deg/sec
  convertBatteryLevel(raw: number, deviceType: string): number; // Raw to percentage/voltage
}
```

---

## 🔄 Usage Examples

### Creating a Live Data Message
```typescript
// Example of how to use these models
const liveData: LiveDataMessage = {
  iTOW: 1234567890,
  year: 2024,
  month: 1,
  day: 15,
  hour: 14,
  minute: 30,
  second: 45,
  validityFlags: 0b00000111, // Valid date, time, and fully resolved
  timeAccuracy: 1000000,
  nanoseconds: 500000000,
  fixStatus: FixStatus.FIX_3D,
  // ... rest of the fields
};

// Convert to packet
const packet = messageFactory.createLiveDataMessage(liveData);
```

### Parsing a Received Packet
```typescript
// Parse incoming data
const packet = packetBuilder.parsePacket(receivedData);
const isValid = packetBuilder.validateChecksum(packet);

if (isValid && packet.class === MessageClass.RACEBOX) {
  switch (packet.id) {
    case MessageID.LIVE_DATA:
      const liveData = parseLiveDataMessage(packet.payload);
      break;
    case MessageID.ACK:
      console.log("Command successful");
      break;
    case MessageID.NACK:
      console.log("Command failed");
      break;
  }
}
```

---

## 📝 Notes

1. **Endianness**: All multi-byte values are little-endian
2. **Signed Values**: Some fields can be negative (e.g., nanoseconds)
3. **Bitmasks**: Use bitwise operations to extract individual flags
4. **Validation**: Always validate checksums before processing
5. **Fragmentation**: Handle packet fragmentation in your implementation
6. **Type Safety**: These models can be converted to strongly-typed languages
7. **Extensibility**: Models can be extended for additional validation or conversion logic 