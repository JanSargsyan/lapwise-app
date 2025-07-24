# RaceBox API

API and types for RaceBox device integration via Bluetooth Low Energy (BLE).

## Installation

```sh
npm install racebox-api
```

> **Note:** This package is designed for React Native and requires [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx) for BLE communication.

---

## Usage

### 1. Import and Connect

```typescript
import { RaceBoxApi } from 'racebox-api';
import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();
// ... scan and connect to your RaceBox device ...
const device = /* a connected Device instance */;

const api = new RaceBoxApi(device);
```

### 2. Read and Set Recording Configuration

```typescript
import { types } from 'racebox-api';

// Read current config
const config = await api.readRecordingConfig();

// Update config (example: enable recording)
if (config) {
  config.enable = true;
  await api.setRecordingConfig(config);
}
```

### 3. Start/Stop Recording

```typescript
await api.startRecording();
await api.stopRecording();
```

### 4. Subscribe to Live Data

```typescript
const unsubscribe = api.subscribeLiveData((liveData) => {
  console.log('Live data:', liveData);
});
// ... later
unsubscribe();
```

### 5. Read Device Info

```typescript
const info = await api.readDeviceInfo();
console.log('Device info:', info);
```

### 6. Use Utilities

```typescript
import { utils } from 'racebox-api';

const base64 = utils.toBase64(new Uint8Array([1, 2, 3]));
const bytes = utils.fromBase64(base64);
```

---

## API Overview

### Main Class

- `RaceBoxApi` — Main API for interacting with a RaceBox BLE device.

### Namespaces

- `types` — All TypeScript types and enums used by the API.
- `utils` — Utility functions for base64 encoding/decoding.

---

## Exported Types

All types are available under the `types` namespace:

- `types.DataRate` (enum)
- `types.RecordingFlags`
- `types.RecordingConfigPayload`
- `types.AckNackPayload`
- `types.UnlockMemoryPayload`
- `types.DataDownloadReplyPayload`
- `types.RecordingStatusPayload`
- `types.RaceBoxLiveData`
- `types.StateChangePayload`
- `types.EraseProgressPayload`
- `types.GnssConfigPayload`

Example:
```typescript
import { types } from 'racebox-api';

const config: types.RecordingConfigPayload = { ... };
```

---

## Exported Utilities

All utilities are available under the `utils` namespace:

- `utils.toBase64(uint8: Uint8Array): string`
- `utils.fromBase64(str: string): Uint8Array`

---

## Build

To compile the TypeScript source:

```sh
npm run build
```

---

## License

MIT

---

If you need more advanced protocol helpers (e.g., encoding/decoding packets), see the source in `src/protocol/messages.ts`.
