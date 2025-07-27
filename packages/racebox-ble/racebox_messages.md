# RaceBox BLE Protocol Messages Reference

## Overview
This document lists all RaceBox BLE protocol messages with their parameters, descriptions, and usage details based on the official documentation (Revision 8).

---

## 📊 Data Messages

### Live Data Message
- **Class**: `0xFF`
- **ID**: `0x01`
- **Payload Size**: `80 bytes`
- **Direction**: Device → Client
- **Description**: Contains GNSS location, accelerometer, gyroscope, and system data sent up to 25 times per second
- **Parameters**: None (sent automatically by device)

### History Data Message
- **Class**: `0xFF`
- **ID**: `0x21`
- **Payload Size**: `80 bytes`
- **Direction**: Device → Client
- **Description**: Same format as live data message, sent during history download
- **Parameters**: None (sent automatically during download)

---

## ⚙️ Configuration Messages

### GNSS Receiver Configuration
- **Class**: `0xFF`
- **ID**: `0x27`
- **Payload Size**: `0 bytes` (read) or `3 bytes` (set)
- **Direction**: Bidirectional
- **Description**: Configure GNSS receiver settings
- **Parameters** (when setting):
  - Byte 0: Dynamic Platform Model (0-8)
  - Byte 1: Enable 3D-Speed reporting (bool)
  - Byte 2: Min horizontal accuracy required (meters)

**Platform Model Values:**
- `4`: Automotive (default)
- `5`: Sea use
- `6`: Airborne (low dynamic)
- `8`: Airborne (high speed/dynamic)

---

## 🧾 Standalone Recording Messages (Mini S / Micro only)

### Recording Status
- **Class**: `0xFF`
- **ID**: `0x22`
- **Payload Size**: `0 bytes` (request) or `12 bytes` (response)
- **Direction**: Bidirectional
- **Description**: Get current recording status and memory information
- **Parameters**: None (request)

**Response Structure:**
- Byte 0: Recording state (non-zero = active)
- Byte 1: Memory level (0-100%)
- Byte 2: Memory security flags
- Bytes 4-7: Stored messages count
- Bytes 8-11: Total memory capacity

### Recording Configuration
- **Class**: `0xFF`
- **ID**: `0x25`
- **Payload Size**: `0 bytes` (read) or `12 bytes` (set)
- **Direction**: Bidirectional
- **Description**: Configure standalone recording parameters
- **Parameters** (when setting):
  - Byte 0: Enable Recording (1 = on, 0 = off)
  - Byte 1: Data Rate (0=25Hz, 1=10Hz, 2=5Hz, 3=1Hz, 4=20Hz)
  - Byte 2: Filters & Features (bitmask)
  - Bytes 4-5: Stationary Speed Threshold (mm/s)
  - Bytes 6-7: Stationary Timeout (seconds)
  - Bytes 8-9: No-Fix Timeout (seconds)
  - Bytes 10-11: Auto-Shutdown Timeout (seconds)

**Filter Flags (bitmask):**
- Bit 0: Wait for GNSS fix
- Bit 1: Stationary filter
- Bit 2: No-fix filter
- Bit 3: Auto-shutdown
- Bit 4: Wait for data before shutdown

### Recorded Data Download
- **Class**: `0xFF`
- **ID**: `0x23`
- **Payload Size**: `0 bytes` (start) or `1 byte` (cancel)
- **Direction**: Client → Device
- **Description**: Start or cancel downloading recorded data
- **Parameters**:
  - `0`: Start download
  - `1`: Cancel download

### Memory Erase
- **Class**: `0xFF`
- **ID**: `0x24`
- **Payload Size**: `0 bytes` (start) or `1 byte` (cancel)
- **Direction**: Client → Device
- **Description**: Erase all recorded data from memory
- **Parameters**:
  - `0`: Start erase
  - `1`: Cancel erase

### Memory Unlock
- **Class**: `0xFF`
- **ID**: `0x30`
- **Payload Size**: `4 bytes`
- **Direction**: Client → Device
- **Description**: Unlock memory with security code (required if security enabled)
- **Parameters**:
  - 4 bytes: Security code (UInt32)

---

## 📡 State Change Messages

### Recording State Change
- **Class**: `0xFF`
- **ID**: `0x26`
- **Payload Size**: `12 bytes`
- **Direction**: Device → Client
- **Description**: Sent during history download to indicate recording state changes
- **Parameters**: None (sent automatically)
- **Structure**:
  - Byte 0: State (0=stop, 1=start, 2=pause)
  - Bytes 1-11: Same as recording config structure

---

## ✅ Acknowledgment Messages

### ACK (Acknowledgment)
- **Class**: `0xFF`
- **ID**: `0x02`
- **Payload Size**: `0 bytes`
- **Direction**: Device → Client
- **Description**: Positive acknowledgment for successful command
- **Parameters**: None

### NACK (Negative Acknowledgment)
- **Class**: `0xFF`
- **ID**: `0x03`
- **Payload Size**: `0 bytes`
- **Direction**: Device → Client
- **Description**: Negative acknowledgment for failed command
- **Parameters**: None

---

## 📋 Message Summary Table

| Class | ID | Name | Direction | Payload Size | Description |
|-------|----|------|-----------|--------------|-------------|
| 0xFF | 0x01 | Live Data | Device→Client | 80 bytes | Real-time sensor data |
| 0xFF | 0x02 | ACK | Device→Client | 0 bytes | Success acknowledgment |
| 0xFF | 0x03 | NACK | Device→Client | 0 bytes | Failure acknowledgment |
| 0xFF | 0x21 | History Data | Device→Client | 80 bytes | Recorded sensor data |
| 0xFF | 0x22 | Recording Status | Bidirectional | 0/12 bytes | Get recording status |
| 0xFF | 0x23 | Data Download | Client→Device | 0/1 bytes | Start/cancel download |
| 0xFF | 0x24 | Memory Erase | Client→Device | 0/1 bytes | Erase recorded data |
| 0xFF | 0x25 | Recording Config | Bidirectional | 0/12 bytes | Configure recording |
| 0xFF | 0x26 | State Change | Device→Client | 12 bytes | Recording state events |
| 0xFF | 0x27 | GNSS Config | Bidirectional | 0/3 bytes | Configure GNSS settings |
| 0xFF | 0x30 | Memory Unlock | Client→Device | 4 bytes | Unlock with security code |

---

## 🔧 Usage Notes

1. **Packet Format**: All messages use UBX binary format with 2-byte header (`0xB5 0x62`), class/ID, payload length, payload, and 2-byte checksum.

2. **Checksum**: Calculated over class, ID, length, and payload using the UBX algorithm.

3. **MTU**: Set as high as possible for optimal performance.

4. **Connection**: Use low connection intervals for real-time data.

5. **Fragmentation**: RaceBox may split large messages - clients must buffer and reassemble.

6. **Security**: Memory unlock required on every new connection if security is enabled.

7. **Compatibility**: All messages work with firmware versions 2.x and 3.x. 