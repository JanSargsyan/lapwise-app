# RaceBox BLE Protocol Documentation  
**Revision 8**

---

## 📘 Before We Begin

By using this documentation to read and write commands to your **RaceBox Mini**, **RaceBox Mini S**, or **RaceBox Micro**, you agree that RaceBox LLC is not responsible for any damage caused by incorrect commands or configuration. Warranty claims will be void.

---

## 📖 Preface

RaceBox Mini, Mini S, and Micro include a GNSS receiver, Gyroscope, and Accelerometer. The data from the sensors is combined and provided using **UART-over-BLE**.

This document applies to firmware versions 2.x and 3.x. There are **no breaking changes** from 1.x to 2.x or from 2.x to 3.x.

Apps built around older versions will work but may not have access to the new features.

---

## 🔍 Identifying a RaceBox Device Model

BLE advertising names:

- `"RaceBox Mini <serial>"`
- `"RaceBox Mini S <serial>"`
- `"RaceBox Micro <serial>"`

### Device Information Service
| Field              | UUID                                      |
|-------------------|--------------------------------------------|
| Device Info Service | `0000180a-0000-1000-8000-00805f9b34fb`     |
| Model              | `00002a24-0000-1000-8000-00805f9b34fb`     |
| Serial Number      | `00002a25-0000-1000-8000-00805f9b34fb`     |
| Firmware Revision  | `00002a26-0000-1000-8000-00805f9b34fb`     |
| Hardware Revision  | `00002a27-0000-1000-8000-00805f9b34fb`     |
| Manufacturer       | `00002a29-0000-1000-8000-00805f9b34fb`     |

The **Model Characteristic** contains:  
- `"RaceBox Mini"`  
- `"RaceBox Mini S"`  
- `"RaceBox Micro"`

The **Firmware Revision** is in format `major.minor`, e.g. `"2.6"`.

---

## 🔄 UART-over-BLE

### Standard UART Service
| Characteristic | UUID                                      |
|---------------|--------------------------------------------|
| UART Service  | `6E400001-B5A3-F393-E0A9-E50E24DCCA9E`     |
| RX            | `6E400002-B5A3-F393-E0A9-E50E24DCCA9E`     |
| TX            | `6E400003-B5A3-F393-E0A9-E50E24DCCA9E`     |

Clients write to RX and subscribe to TX for:
- Command responses
- Periodic messages (e.g., live data)

### NMEA UART (firmware 3.3+)
| Characteristic | UUID                                      |
|---------------|--------------------------------------------|
| Service       | `00001101-0000-1000-8000-00805F9B34FB`     |
| RX            | `00001102-0000-1000-8000-00805F9B34FB`     |
| TX            | `00001103-0000-1000-8000-00805F9B34FB`     |

> ⚠️ NMEA RX is ignored; it's **read-only**. Avoid using both RaceBox Protocol and NMEA — it causes **high packet loss**.

---

## 📏 MTU and BLE Connection Considerations

- Set **MTU as high as possible**.
- Set **Connection Interval as low as possible**.
- RaceBox splits messages if MTU is low — clients **must buffer and reassemble**.

---

## 📦 Packet Format (UBX Binary)

| Segment         | Size     | Description                                                  |
|-----------------|----------|--------------------------------------------------------------|
| Packet Start    | 2 bytes  | Always `0xB5 0x62`                                           |
| Class & ID      | 2 bytes  | 1st byte = class, 2nd byte = ID                              |
| Payload Length  | 2 bytes  | Unsigned int, size of payload                                |
| Payload         | Variable | Optional, 0–504 bytes (max 512 total including headers)      |
| Checksum        | 2 bytes  | Checksum over class, ID, length, and payload                |

### 🔢 Checksum Formula (UBX)
```c
byte CK_A = 0, CK_B = 0;
for (int i = 2; i < len(Packet)-2; i++) {
    CK_A = CK_A + Packet[i];
    CK_B = CK_B + CK_A;
}
Packet[len(Packet)-2] = CK_A;
Packet[len(Packet)-1] = CK_B;
```

> Clients must **buffer fragmented packets**, **validate checksum**, and **ensure headers are intact**.

---

## 🛰️ RaceBox Data Message

- **Message Class**: `0xFF`
- **Message ID**: `0x01`
- **Payload Size**: `80 bytes`

This message includes GNSS location, accelerometer, gyroscope, and system data up to **25 times per second**.

### 🧱 Payload Structure

| Offset | Size | Type   | Description                         |
|--------|------|--------|-------------------------------------|
| 0      | 4    | UInt32 | iTOW (ms since GPS week start)      |
| 4      | 2    | UInt16 | Year                                |
| 6      | 1    | Byte   | Month (1 = Jan)                     |
| 7      | 1    | Byte   | Day                                 |
| 8      | 1    | Byte   | Hour                                |
| 9      | 1    | Byte   | Minute                              |
| 10     | 1    | Byte   | Second                              |
| 11     | 1    | Bitmask| Validity Flags                      |
| 12     | 4    | UInt32 | Time Accuracy (ns)                  |
| 16     | 4    | Int32  | Nanoseconds (can be negative)       |
| 20     | 1    | Enum   | Fix Status                          |
| 21     | 1    | Bitmask| Fix Status Flags                    |
| 22     | 1    | Bitmask| Date/Time Flags                     |
| 23     | 1    | Byte   | Number of SVs                       |
| 24     | 4    | Int32  | Longitude (×10⁷)                    |
| 28     | 4    | Int32  | Latitude (×10⁷)                     |
| 32     | 4    | Int32  | WGS Altitude (mm)                   |
| 36     | 4    | Int32  | MSL Altitude (mm)                   |
| 40     | 4    | UInt32 | Horizontal Accuracy (mm)            |
| 44     | 4    | UInt32 | Vertical Accuracy (mm)              |
| 48     | 4    | Int32  | Speed (mm/s)                        |
| 52     | 4    | Int32  | Heading (×10⁵ deg)                  |
| 56     | 4    | UInt32 | Speed Accuracy (mm/s)               |
| 60     | 4    | UInt32 | Heading Accuracy (×10⁵ deg)         |
| 64     | 2    | UInt16 | PDOP (×100)                         |
| 66     | 1    | Bitmask| Lat/Lon Flags                       |
| 67     | 1    | Byte   | Battery % (Mini/S) or Voltage (Micro)|
| 68     | 2    | Int16  | GForce X (milli-g)                  |
| 70     | 2    | Int16  | GForce Y (milli-g)                  |
| 72     | 2    | Int16  | GForce Z (milli-g)                  |
| 74     | 2    | Int16  | Rotation rate X (centi-deg/sec)     |
| 76     | 2    | Int16  | Rotation rate Y (centi-deg/sec)     |
| 78     | 2    | Int16  | Rotation rate Z (centi-deg/sec)     |

---

### 🧮 Field Details

#### Validity Flags (bitmask at offset 11):
- Bit 0 = Valid date
- Bit 1 = Valid time
- Bit 2 = Fully resolved
- Bit 3 = Valid magnetic declination

#### Fix Status (byte at offset 20):
- `0`: No fix
- `2`: 2D fix
- `3`: 3D fix

#### Fix Status Flags:
- Bit 0 = Valid fix
- Bit 1 = Differential corrections applied
- Bits 2–4 = Power state
- Bit 5 = Valid heading
- Bits 6–7 = Carrier phase range solution

#### Date/Time Flags:
- Bit 5 = Confirmation available
- Bit 6 = UTC Date confirmed
- Bit 7 = UTC Time confirmed

#### Lat/Lon Flags:
- Bit 0 = Invalid Lat/Lon/Alt
- Bits 1–4 = Differential correction age

#### Battery Status:
- **Mini/Mini S**: Bit 7 = Charging, Bits 0–6 = Battery level (%)
- **Micro**: Value × 0.1 = Voltage (e.g., `0x79` = 12.1V)

#### G-forces:
Divide by `1000` to convert milli-g to `g`.

#### Rotation rates:
Divide by `100` to convert centi-deg/sec to deg/sec.

---

### ✅ Sample Packet (Hex)
```
B5 62 FF 01 50 00 A0 E7 0C 07 E6 07 01 0A 08 33
08 37 19 00 00 00 2A AD 4D 0E 03 01 EA 0B C6 93
E1 0D 3B 37 6F 19 61 8C 09 00 0F 01 09 00 9C 03
00 00 2C 07 00 00 23 00 00 00 00 00 00 00 D0 00
00 00 88 A9 DD 00 2C 01 00 59 FD FF 71 00 CE 03
2F FF 56 00 FC FF 06 DB
```

Decoded:
- Fix: 3D
- SVs: 11
- Lat/Lon: 42.6719°, 23.2887°
- Altitude: 625.76m WGS / 590.09m MSL
- Speed: 0.126 km/h
- Battery: 89%

---

---

## 🧭 GNSS Receiver Configuration

- **Message Class**: `0xFF`
- **Message ID**: `0x27`
- **Payload**: `0` (read current), `3 bytes` (set config)

### 📥 Read Payload Structure (3 bytes)

| Offset | Size | Type   | Description                                      |
|--------|------|--------|--------------------------------------------------|
| 0      | 1    | Byte   | Dynamic Platform Model (0–8)                     |
| 1      | 1    | Bool   | Enable 3D-Speed reporting                        |
| 2      | 1    | Byte   | Min horizontal accuracy required (in meters)     |

If unsupported, device returns **NACK (`0xFF 0x03`)**.

### 🌍 Platform Model Values

| Value | Model               |
|-------|---------------------|
| 4     | Automotive (default)|
| 5     | Sea use             |
| 6     | Airborne (low dynamic) |
| 8     | Airborne (high speed/dynamic) |

---

## 🧾 Standalone Recording (Mini S / Micro only)

> Not supported on RaceBox Mini.

### Memory Security

- Lockable with **security code**
- Commands **require unlock** if enabled
- Use `0xFF 0x30` to unlock memory

---

### 🧠 Standalone Recording Status
- **Message Class**: `0xFF`
- **Message ID**: `0x22`
- **Payload**: `0` to request status  
- **Response**: `12 bytes`

| Offset | Size | Type   | Description                                  |
|--------|------|--------|----------------------------------------------|
| 0      | 1    | Byte   | Recording state (non-zero = active)          |
| 1      | 1    | Byte   | Memory level (0–100%)                        |
| 2      | 1    | Bitmask| Memory security flags                        |
| 4      | 4    | UInt32 | Stored messages                              |
| 8      | 4    | UInt32 | Total memory capacity (in messages)          |

### Security Flags

- Bit 0 = Security Enabled  
- Bit 1 = Memory Unlocked

---

### ⚙️ Recording Configuration

- **Message Class**: `0xFF`
- **Message ID**: `0x25`
- **Payload**: `12 bytes` (to configure), or `0` (to read)

| Offset | Size | Type   | Description                                   |
|--------|------|--------|-----------------------------------------------|
| 0      | 1    | Byte   | Enable Recording (1 = on, 0 = off)             |
| 1      | 1    | Byte   | Data Rate                                     |
| 2      | 1    | Bitmask| Filters & Features                            |
| 4      | 2    | UInt16 | Stationary Speed Threshold (mm/s)             |
| 6      | 2    | UInt16 | Stationary Timeout (s)                         |
| 8      | 2    | UInt16 | No-Fix Timeout (s)                             |
| 10     | 2    | UInt16 | Auto-Shutdown Timeout (s)                      |

### Data Rate Options

| Value | Rate |
|-------|------|
| 0     | 25Hz |
| 1     | 10Hz |
| 2     | 5Hz  |
| 3     | 1Hz  |
| 4     | 20Hz (firmware 3.3+) |

### Filter Flags (bitmask)

- Bit 0 = Wait for GNSS fix
- Bit 1 = Stationary filter
- Bit 2 = No-fix filter
- Bit 3 = Auto-shutdown
- Bit 4 = Wait for data before shutdown

---

### Recommended Setup Example

- **Stationary**: <5 kph for 30s = pause recording
- **No-Fix**: pause after 30s loss
- **Auto Shutdown**: power off after 5 mins idle
- **Wait for GNSS fix before start**

Hex packet:
```
B5 62 FF 25 0C 00 01 00 1F 00 6D 05 1E 00 1E 00 2C 01 2B 15
```

---

## 💾 Recorded Data Download

- **Message Class**: `0xFF`
- **Message ID**: `0x23`
- **Payload**: `0` = start, `1 byte` = cancel

### Response Payload (start)
| Offset | Size | Type   | Description                  |
|--------|------|--------|------------------------------|
| 0      | 4    | UInt32 | Max expected messages        |

Device then sends:
- `0xFF 0x21` History Data Messages
- `0xFF 0x26` Recording State Changes
- Final `0xFF 0x02` ACK

---

## 🕰️ History Data Message

- **Message Class**: `0xFF`
- **Message ID**: `0x21`
- **Payload**: 80 bytes  
(Same format as `0x01` live data)

---

## ⏸️ Standalone State Change Message

- **Message Class**: `0xFF`
- **Message ID**: `0x26`
- **Payload**: 12 bytes

| Offset | Size | Type | Description                        |
|--------|------|------|------------------------------------|
| 0      | 1    | Byte | State: 0 = stop, 1 = start, 2 = pause |
| 1–11   |      |      | Same as recording config structure |

> These are stored during pause/start/stop events and help segment downloaded history.

---

## ❌ Memory Erase

- **Message Class**: `0xFF`
- **Message ID**: `0x24`
- **Payload**: `0` = start erase, `1 byte` = cancel

Device will:
- Stop live messages
- Erase memory in chunks (64KB)
- Send erase progress (`0xFF 0x24`) as percent
- End with `0xFF 0x02` ACK

---

## 🔓 Unlock Memory

- **Message Class**: `0xFF`
- **Message ID**: `0x30`
- **Payload**: `4 bytes` = security code (UInt32)

Device responds with:
- `0xFF 0x02` ACK (success)
- `0xFF 0x03` NACK (failure)

> Unlock must be repeated on every new connection.

---

## 📡 NMEA Output (Firmware 3.3+)

- Uses separate UART-over-BLE service
- Implements **NMEA 0183 v4.11**
- Output rate: up to **25Hz**
- Reduced rate if standalone recording is below 25Hz
- Only **live data** is sent (no history download in NMEA)

### Sent Sentences
- `$GPRMC`
- `$GPGNS`
- `$GPGGA`
- `$GPGSA`

> Each NMEA sentence is sent as **one BLE notification**  
> Clients must support **Packet Length Extension** and a PDU size ≥ 82 bytes

---

## 🧭 Accelerometer and Gyroscope Axes

The axes orientation follows the diagram:

- **X-axis**: forward/backward
- **Y-axis**: left/right
- **Z-axis**: up/down

- Positive **GForce** values follow this orientation.
- **Rotation Rates**:
  - X: Roll
  - Y: Pitch
  - Z: Yaw

---

## 📈 Motion Data Handling Recommendations

- Internal sensors sample at **1kHz**, output is averaged to **25Hz**
- Filtering is already applied to reduce noise
- You can further:
  - Filter data
  - Perform zero-offset calibration
  - Adjust orientation for custom setups

---

## 🔋 Battery & Voltage Level Handling

- **Mini / Mini S**:
  - Measures battery voltage every 10s
  - Adjusts for load/charging
  - Reports **0–100%** battery level
  - Voltage may spike/drop briefly on charging events

- **Micro**:
  - No internal battery
  - Reports **input voltage** (accuracy ±5%)

---

## 🛠️ Advanced Features

Internally, RaceBox acts as a **pass-through** for UBlox GNSS:

- Most GNSS UBX messages can be sent/received
- Device is configured to send `NAV-PVT` @ 25Hz
- You **can** send aiding data (e.g., from AssistNow Online)

> ⚠️ Caveats:
> - Max supported packet size = **256 bytes**
> - Reconfiguring protocol/ports may break device
> - Some changes **persist** (Mini S has battery-backed RAM)

> 🚫 **RaceBox is not responsible** for damage due to misconfiguration

---

## 📜 Document Revision History

| Rev | Date            | Notes                                                                      |
|-----|-----------------|----------------------------------------------------------------------------|
| 1   | 30 Dec 2021     | Initial release                                                            |
| 2   | 10 Jan 2022     | Added sample data message and decoding                                     |
| 3   | 25 Jan 2022     | Fixed checksum pseudocode and byte offset bugs                             |
| 4   | 8 Feb 2022      | Fixed altitude unit from cm → mm, added axis diagram                       |
| 5   | 24 Aug 2022     | Corrected horizontal accuracy units and grammar                            |
| 6   | 27 Mar 2023     | Added RaceBox Mini S documentation                                         |
| 7   | 15 Jun 2023     | Internal revision (not published)                                          |
| 8   | 16 Apr 2024     | Added RaceBox Micro details, clarified shutdown/recording config behavior |

---

## 🔚 End of Document

This concludes the RaceBox BLE Protocol documentation for Revision 8.  
For updates and additional technical resources, visit:  
👉 [https://racebox.pro](https://racebox.pro)

```  

---
