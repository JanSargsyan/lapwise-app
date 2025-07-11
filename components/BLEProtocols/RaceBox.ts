import { BLEProtocol, UBXPacket } from './index';

// Helper to parse a hex string into a Uint8Array
function hexStringToBytes(hex: string): Uint8Array {
  return new Uint8Array(
    hex.split(' ').map((b) => parseInt(b, 16))
  );
}

// General UBX packet parser
function parseUBXPacket(bytes: Uint8Array): UBXPacket | null {
  if (bytes.length < 8) return null;
  if (bytes[0] !== 0xB5 || bytes[1] !== 0x62) return null;
  const cls = bytes[2];
  const id = bytes[3];
  const len = bytes[4] | (bytes[5] << 8);
  if (bytes.length !== 6 + len + 2) return null;
  // Checksum
  let CK_A = 0, CK_B = 0;
  for (let i = 2; i < 6 + len; i++) {
    CK_A = (CK_A + bytes[i]) & 0xFF;
    CK_B = (CK_B + CK_A) & 0xFF;
  }
  const checksumValid = CK_A === bytes[6 + len] && CK_B === bytes[6 + len + 1];
  const payload = bytes.slice(6, 6 + len);
  return { class: cls, id, length: len, payload, checksumValid };
}

// RaceBox Data Message decoder
function decodeRaceBoxDataPacket(pkt: UBXPacket): any {
  if (pkt.class === 0xFF && pkt.id === 0x01 && pkt.length === 80) {
    const dv = new DataView(pkt.payload.buffer, pkt.payload.byteOffset, pkt.payload.byteLength);
    return {
      type: 'RaceBox Data',
      iTOW: dv.getUint32(0, true),
      year: dv.getUint16(4, true),
      month: dv.getUint8(6),
      day: dv.getUint8(7),
      hour: dv.getUint8(8),
      minute: dv.getUint8(9),
      second: dv.getUint8(10),
      validityFlags: dv.getUint8(11),
      timeAccuracy: dv.getUint32(12, true),
      nanoseconds: dv.getInt32(16, true),
      fixStatus: dv.getUint8(20),
      fixStatusFlags: dv.getUint8(21),
      dateTimeFlags: dv.getUint8(22),
      numSVs: dv.getUint8(23),
      longitude: dv.getInt32(24, true),
      latitude: dv.getInt32(28, true),
      wgsAltitude: dv.getInt32(32, true),
      mslAltitude: dv.getInt32(36, true),
      horizAccuracy: dv.getUint32(40, true),
      vertAccuracy: dv.getUint32(44, true),
      speed: dv.getInt32(48, true),
      heading: dv.getInt32(52, true),
      speedAccuracy: dv.getUint32(56, true),
      headingAccuracy: dv.getUint32(60, true),
      pdop: dv.getUint16(64, true),
      latLonFlags: dv.getUint8(66),
      batteryOrVoltage: dv.getUint8(67),
      gForceX: dv.getInt16(68, true),
      gForceY: dv.getInt16(70, true),
      gForceZ: dv.getInt16(72, true),
      rotRateX: dv.getInt16(74, true),
      rotRateY: dv.getInt16(76, true),
      rotRateZ: dv.getInt16(78, true),
    };
  }
  return null;
}

function formatRaceBoxData(decoded: any): string[] {
  const pad = (n: number, l = 2) => n.toString().padStart(l, '0');
  const dateStr = `${decoded.year}-${pad(decoded.month)}-${pad(decoded.day)} ${pad(decoded.hour)}:${pad(decoded.minute)}:${pad(decoded.second)}`;
  const lon = decoded.longitude / 1e7;
  const lat = decoded.latitude / 1e7;
  const wgsAlt = decoded.wgsAltitude / 1000;
  const mslAlt = decoded.mslAltitude / 1000;
  const speedMs = decoded.speed / 1000;
  const speedKmh = speedMs * 3.6;
  const heading = decoded.heading / 1e5;
  const gX = decoded.gForceX / 1000;
  const gY = decoded.gForceY / 1000;
  const gZ = decoded.gForceZ / 1000;
  const rX = decoded.rotRateX / 100;
  const rY = decoded.rotRateY / 100;
  const rZ = decoded.rotRateZ / 100;
  const pdop = decoded.pdop / 100;
  
  // Fix Status
  const fixStatusMap = { 0: 'No fix', 2: '2D fix', 3: '3D fix' };
  const fixStatus = fixStatusMap[Number(decoded.fixStatus) as keyof typeof fixStatusMap] || `Unknown (${decoded.fixStatus})`;
  
  // Validity Flags
  const validityFlags = [
    decoded.validityFlags & 0x01 ? 'valid date' : '',
    decoded.validityFlags & 0x02 ? 'valid time' : '',
    decoded.validityFlags & 0x04 ? 'fully resolved' : '',
    decoded.validityFlags & 0x08 ? 'valid mag dec' : '',
  ].filter(Boolean).join(', ') || 'none';
  
  // Fix Status Flags
  const fixStatusFlags = [
    decoded.fixStatusFlags & 0x01 ? 'valid fix' : '',
    decoded.fixStatusFlags & 0x02 ? 'diff corr' : '',
    decoded.fixStatusFlags & 0x1C ? `power state: ${(decoded.fixStatusFlags & 0x1C) >> 2}` : '',
    decoded.fixStatusFlags & 0x20 ? 'valid heading' : '',
    decoded.fixStatusFlags & 0xC0 ? `carrier phase: ${(decoded.fixStatusFlags & 0xC0) >> 6}` : '',
  ].filter(Boolean).join(', ') || 'none';
  
  // Date/Time Flags
  const dateTimeFlags = [
    decoded.dateTimeFlags & 0x20 ? 'confirmation of date/time validity' : '',
    decoded.dateTimeFlags & 0x40 ? 'confirmed UTC date' : '',
    decoded.dateTimeFlags & 0x80 ? 'confirmed UTC time' : '',
  ].filter(Boolean).join(', ') || 'none';
  
  // Lat/Lon Flags
  const latLonFlags = [
    decoded.latLonFlags & 0x01 ? 'invalid lat/lon/alt' : '',
    decoded.latLonFlags & 0x1E ? `diff corr age: ${(decoded.latLonFlags & 0x1E) >> 1}` : '',
  ].filter(Boolean).join(', ') || 'none';
  
  // Battery/Voltage
  let batteryOrVoltage = '';
  if (decoded.batteryOrVoltage > 0 && decoded.batteryOrVoltage <= 0x7F) {
    batteryOrVoltage = `Battery: ${decoded.batteryOrVoltage & 0x7F}%`;
  } else if (decoded.batteryOrVoltage > 0x7F) {
    batteryOrVoltage = `Battery: ${decoded.batteryOrVoltage & 0x7F}% (charging)`;
  } else {
    batteryOrVoltage = `Voltage: ${(decoded.batteryOrVoltage / 10).toFixed(1)}V`;
  }
  
  return [
    `Time: ${dateStr}`,
    `Satellites: ${decoded.numSVs}`,
    `Longitude: ${lon.toFixed(7)}°`,
    `Latitude: ${lat.toFixed(7)}°`,
    `WGS Altitude: ${wgsAlt.toFixed(2)} m (Ellipsoid)`,
    `MSL Altitude: ${mslAlt.toFixed(2)} m (Mean Sea Level)`,
    `Horizontal Accuracy: ${(decoded.horizAccuracy / 1000).toFixed(2)} m`,
    `Vertical Accuracy: ${(decoded.vertAccuracy / 1000).toFixed(2)} m`,
    `Speed: ${speedMs.toFixed(2)} m/s (${speedKmh.toFixed(2)} km/h)`,
    `Heading: ${heading.toFixed(2)}°`,
    `Speed Accuracy: ${(decoded.speedAccuracy / 1000).toFixed(2)} m/s`,
    `Heading Accuracy: ${(decoded.headingAccuracy / 1e5).toFixed(2)}°`,
    `PDOP: ${pdop.toFixed(2)}`,
    `G-Force X/Y/Z: ${gX.toFixed(2)}g / ${gY.toFixed(2)}g / ${gZ.toFixed(2)}g`,
    `Rot Rate X/Y/Z: ${rX.toFixed(2)}°/s / ${rY.toFixed(2)}°/s / ${rZ.toFixed(2)}°/s`,
    batteryOrVoltage,
    `Fix Status: ${fixStatus}`,
    `Validity Flags: ${validityFlags}`,
    `Fix Status Flags: ${fixStatusFlags}`,
    `Date/Time Flags: ${dateTimeFlags}`,
    `Lat/Lon Flags: ${latLonFlags}`,
    `Time Accuracy: ${decoded.timeAccuracy} ns`,
    `Nanoseconds: ${decoded.nanoseconds}`,
  ];
}

// Main decoder function
function decodePacket(bytes: Uint8Array): any {
  const pkt = parseUBXPacket(bytes);
  if (!pkt) return null;
  
  if (!pkt.checksumValid) {
    return { error: 'Invalid checksum' };
  }
  
  const decoded = decodeRaceBoxDataPacket(pkt);
  if (decoded) return decoded;
  
  return {
    type: 'Unknown',
    class: pkt.class,
    id: pkt.id,
    length: pkt.length,
    payloadHex: Array.from(pkt.payload).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
  };
}

export const RaceBoxProtocol: BLEProtocol = {
  name: 'RaceBox',
  serviceUUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  txCharacteristicUUID: '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
  rxCharacteristicUUID: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  deviceInfoServiceUUID: '0000180a-0000-1000-8000-00805f9b34fb',
  deviceInfoCharacteristics: {
    model: '00002a24-0000-1000-8000-00805f9b34fb',
    serial: '00002a25-0000-1000-8000-00805f9b34fb',
    firmware: '00002a26-0000-1000-8000-00805f9b34fb',
    hardware: '00002a27-0000-1000-8000-00805f9b34fb',
    manufacturer: '00002a29-0000-1000-8000-00805f9b34fb',
  },
  decodePacket,
  formatDecodedData: formatRaceBoxData,
}; 