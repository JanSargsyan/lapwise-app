import type { RecordingConfigPayload } from './types';
import type { RaceBoxLiveData } from './types';
import type { RecordingStatusPayload } from './types';
import type { StateChangePayload } from './types';
import type { GnssConfigPayload } from './types';

/**
 * Encode a UBX packet (RaceBox protocol)
 * @param messageClass UBX message class
 * @param messageId UBX message id
 * @param payload Payload as Uint8Array
 * @returns Full UBX packet as Uint8Array
 */
export function encodePacket(
  messageClass: number,
  messageId: number,
  payload: Uint8Array
): Uint8Array {
  const header = [0xb5, 0x62];
  const length = payload.length;
  const lengthBytes = [length & 0xff, (length >> 8) & 0xff];
  const packet = [
    ...header,
    messageClass,
    messageId,
    ...lengthBytes,
    ...payload,
  ];
  // Calculate checksum over class, id, length, payload
  let ckA = 0,
    ckB = 0;
  for (let i = 2; i < packet.length; i++) {
    ckA = (ckA + packet[i]!) & 0xff;
    ckB = (ckB + ckA) & 0xff;
  }
  return new Uint8Array([...packet, ckA, ckB]);
}

/**
 * Decode a UBX packet (RaceBox protocol)
 * @param data Full packet as Uint8Array
 * @returns { messageClass, messageId, payload } or null if invalid
 */
export function decodePacket(
  data: Uint8Array
): { messageClass: number; messageId: number; payload: Uint8Array } | null {
  if (data.length < 8) return null;
  if (data[0] === undefined || data[1] === undefined) return null;
  if (data[0] !== 0xb5 || data[1] !== 0x62) return null;
  const messageClass = data[2];
  const messageId = data[3];
  if (messageClass === undefined || messageId === undefined) return null;
  const lengthLow = data[4];
  const lengthHigh = data[5];
  if (lengthLow === undefined || lengthHigh === undefined) return null;
  const length = lengthLow | (lengthHigh << 8);
  if (data.length < 6 + length + 2) return null;
  const payload = data.slice(6, 6 + length);
  const ckA = data[6 + length];
  const ckB = data[7 + length];
  if (ckA === undefined || ckB === undefined) return null;
  // Verify checksum
  let calcA = 0,
    calcB = 0;
  for (let i = 2; i < 6 + length; i++) {
    const val = data[i];
    if (val === undefined) return null;
    calcA = (calcA + val) & 0xff;
    calcB = (calcB + calcA) & 0xff;
  }
  if (ckA !== calcA || ckB !== calcB) return null;
  return { messageClass, messageId, payload };
}

export const RACEBOX_UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
export const RACEBOX_UART_RX_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
export const RACEBOX_UART_TX_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';
export const RACEBOX_NMEA_TX_UUID = '00001103-0000-1000-8000-00805f9b34fb';

/**
 * Decode RaceBoxLiveData from a live/history data packet (0xFF 0x01, 0xFF 0x21)
 * @param data Uint8Array (should be 80 bytes)
 * @returns RaceBoxLiveData or null
 */
export function decodeLiveData(data: Uint8Array): RaceBoxLiveData | null {
  if (data.length !== 80) return null;
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  // Check all single-byte fields for undefined
  for (const idx of [6, 7, 8, 9, 10, 11, 20, 21, 22, 23, 66, 67]) {
    if (data[idx] === undefined) return null;
  }
  // Check all int16 fields for undefined
  for (const idx of [68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79]) {
    if (data[idx] === undefined) return null;
  }
  return {
    iTOW: dv.getUint32(0, true),
    year: dv.getUint16(4, true),
    month: data[6]!,
    day: data[7]!,
    hour: data[8]!,
    minute: data[9]!,
    second: data[10]!,
    validityFlags: data[11]!,
    timeAccuracy: dv.getUint32(12, true),
    nanoseconds: dv.getInt32(16, true),
    fixStatus: data[20]!,
    fixStatusFlags: data[21]!,
    dateTimeFlags: data[22]!,
    numSV: data[23]!,
    longitude: dv.getInt32(24, true),
    latitude: dv.getInt32(28, true),
    wgsAltitude: dv.getInt32(32, true),
    mslAltitude: dv.getInt32(36, true),
    horizontalAccuracy: dv.getUint32(40, true),
    verticalAccuracy: dv.getUint32(44, true),
    speed: dv.getInt32(48, true),
    heading: dv.getInt32(52, true),
    speedAccuracy: dv.getUint32(56, true),
    headingAccuracy: dv.getUint32(60, true),
    pdop: dv.getUint16(64, true),
    latLonFlags: data[66]!,
    batteryOrVoltage: data[67]!,
    gForceX: dv.getInt16(68, true),
    gForceY: dv.getInt16(70, true),
    gForceZ: dv.getInt16(72, true),
    rotationRateX: dv.getInt16(74, true),
    rotationRateY: dv.getInt16(76, true),
    rotationRateZ: dv.getInt16(78, true),
  };
}
export function decodeRecordingConfig(
  data: Uint8Array
): RecordingConfigPayload | null {
  if (data.length < 12) return null;
  if (
    data[0] === undefined ||
    data[1] === undefined ||
    data[2] === undefined ||
    data[3] === undefined ||
    data[4] === undefined ||
    data[5] === undefined ||
    data[6] === undefined ||
    data[7] === undefined ||
    data[8] === undefined ||
    data[9] === undefined ||
    data[10] === undefined ||
    data[11] === undefined
  )
    return null;
  const flags = data[2];
  if (flags === undefined) return null;
  return {
    enable: !!data[0],
    dataRate: data[1],
    flags: {
      waitForGnssFix: !!(flags & (1 << 0)),
      enableStationaryFilter: !!(flags & (1 << 1)),
      enableNoFixFilter: !!(flags & (1 << 2)),
      enableAutoShutdown: !!(flags & (1 << 3)),
      waitForDataBeforeShutdown: !!(flags & (1 << 4)),
    },
    stationarySpeedThreshold: data[4] | (data[5] << 8),
    stationaryDetectionInterval: data[6] | (data[7] << 8),
    noFixDetectionInterval: data[8] | (data[9] << 8),
    autoShutdownInterval: data[10] | (data[11] << 8),
  };
}

export function encodeRecordingConfig(
  payload: RecordingConfigPayload
): Uint8Array {
  // 12 bytes: [enable, dataRate, flags, reserved, stationarySpeedThreshold(2), stationaryDetectionInterval(2), noFixDetectionInterval(2), autoShutdownInterval(2)]
  const flags =
    (payload.flags.waitForGnssFix ? 1 << 0 : 0) |
    (payload.flags.enableStationaryFilter ? 1 << 1 : 0) |
    (payload.flags.enableNoFixFilter ? 1 << 2 : 0) |
    (payload.flags.enableAutoShutdown ? 1 << 3 : 0) |
    (payload.flags.waitForDataBeforeShutdown ? 1 << 4 : 0);
  const arr = new Uint8Array(12);
  arr[0] = payload.enable ? 1 : 0;
  arr[1] = payload.dataRate;
  arr[2] = flags;
  arr[3] = 0; // reserved
  arr[4] = payload.stationarySpeedThreshold & 0xff;
  arr[5] = (payload.stationarySpeedThreshold >> 8) & 0xff;
  arr[6] = payload.stationaryDetectionInterval & 0xff;
  arr[7] = (payload.stationaryDetectionInterval >> 8) & 0xff;
  arr[8] = payload.noFixDetectionInterval & 0xff;
  arr[9] = (payload.noFixDetectionInterval >> 8) & 0xff;
  arr[10] = payload.autoShutdownInterval & 0xff;
  arr[11] = (payload.autoShutdownInterval >> 8) & 0xff;
  return arr;
}

/**
 * Decode ACK/NACK payload (2 bytes)
 * @param data Uint8Array (should be 2 bytes)
 * @returns AckNackPayload or null
 */
export function decodeAckNack(
  data: Uint8Array
): { messageClass: number; messageId: number } | null {
  if (data.length !== 2) return null;
  if (data[0] === undefined || data[1] === undefined) return null;
  return {
    messageClass: data[0],
    messageId: data[1],
  };
}
/**
 * Decode DataDownloadReplyPayload from device reply (4 bytes)
 * @param data Uint8Array (should be 4 bytes)
 * @returns DataDownloadReplyPayload or null
 */
export function decodeDataDownloadReply(
  data: Uint8Array
): { expectedMaxHistoryMessages: number } | null {
  if (data.length !== 4) return null;
  if (
    data[0] === undefined ||
    data[1] === undefined ||
    data[2] === undefined ||
    data[3] === undefined
  )
    return null;
  const value = data[0] | (data[1] << 8) | (data[2] << 16) | (data[3] << 24);
  return { expectedMaxHistoryMessages: value };
}
/**
 * Decode RecordingStatusPayload from device reply (12 bytes)
 * @param data Uint8Array (should be 12 bytes)
 * @returns RecordingStatusPayload or null
 */
export function decodeRecordingStatus(
  data: Uint8Array
): RecordingStatusPayload | null {
  if (data.length !== 12) return null;
  if (
    data[0] === undefined ||
    data[1] === undefined ||
    data[2] === undefined ||
    data[3] === undefined ||
    data[4] === undefined ||
    data[5] === undefined ||
    data[6] === undefined ||
    data[7] === undefined ||
    data[8] === undefined ||
    data[9] === undefined ||
    data[10] === undefined ||
    data[11] === undefined
  )
    return null;
  return {
    recordingState: data[0],
    memoryLevel: data[1],
    securityFlags: data[2],
    storedMessages:
      data[4] | (data[5] << 8) | (data[6] << 16) | (data[7] << 24),
    totalCapacity:
      data[8] | (data[9] << 8) | (data[10] << 16) | (data[11] << 24),
  };
}
/**
 * Decode EraseProgressPayload from device notification (1 byte)
 * @param data Uint8Array (should be 1 byte)
 * @returns EraseProgressPayload or null
 */
export function decodeEraseProgress(
  data: Uint8Array
): { percent: number } | null {
  if (data.length !== 1) return null;
  if (data[0] === undefined) return null;
  return { percent: data[0] };
}
/**
 * Decode StateChangePayload from device notification (12 bytes)
 * @param data Uint8Array (should be 12 bytes)
 * @returns StateChangePayload or null
 */
export function decodeStateChange(data: Uint8Array): StateChangePayload | null {
  if (data.length !== 12) return null;
  if (
    data[0] === undefined ||
    data[2] === undefined ||
    data[3] === undefined ||
    data[4] === undefined ||
    data[5] === undefined ||
    data[6] === undefined ||
    data[7] === undefined ||
    data[8] === undefined ||
    data[9] === undefined ||
    data[10] === undefined ||
    data[11] === undefined
  )
    return null;
  const flags = data[3];
  return {
    state: data[0],
    dataRate: data[2],
    flags: {
      waitForGnssFix: !!(flags & (1 << 0)),
      enableStationaryFilter: !!(flags & (1 << 1)),
      enableNoFixFilter: !!(flags & (1 << 2)),
      enableAutoShutdown: !!(flags & (1 << 3)),
      waitForDataBeforeShutdown: !!(flags & (1 << 4)),
    },
    stationarySpeedThreshold: data[4] | (data[5] << 8),
    stationaryDetectionInterval: data[6] | (data[7] << 8),
    noFixDetectionInterval: data[8] | (data[9] << 8),
    autoShutdownInterval: data[10] | (data[11] << 8),
  };
}
/**
 * Encode UnlockMemoryPayload to Uint8Array (4 bytes, little-endian)
 * @param payload { securityCode: number }
 * @returns Uint8Array (4 bytes)
 */
export function encodeUnlockMemory(payload: {
  securityCode: number;
}): Uint8Array {
  const arr = new Uint8Array(4);
  arr[0] = payload.securityCode & 0xff;
  arr[1] = (payload.securityCode >> 8) & 0xff;
  arr[2] = (payload.securityCode >> 16) & 0xff;
  arr[3] = (payload.securityCode >> 24) & 0xff;
  return arr;
}

/**
 * Decode GNSS config payload (3 bytes)
 * @param data Uint8Array (should be 3 bytes)
 * @returns GnssConfigPayload or null
 */
export function decodeGnssConfig(data: Uint8Array): GnssConfigPayload | null {
  if (data.length !== 3) return null;
  if (data[0] === undefined || data[1] === undefined || data[2] === undefined)
    return null;
  return {
    platformModel: data[0],
    enable3DSpeed: !!data[1],
    minHorizontalAccuracy: data[2],
  };
}

export {};
