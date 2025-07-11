import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, FlatList, PermissionsAndroid, Platform, Alert, ScrollView } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { decode as atob } from 'base-64';

const bleManager = new BleManager();

const DEVICE_INFO_SERVICE = '0000180a-0000-1000-8000-00805f9b34fb';
const MODEL_CHAR = '00002a24-0000-1000-8000-00805f9b34fb';
const SERIAL_CHAR = '00002a25-0000-1000-8000-00805f9b34fb';
const FIRMWARE_CHAR = '00002a26-0000-1000-8000-00805f9b34fb';
const HARDWARE_CHAR = '00002a27-0000-1000-8000-00805f9b34fb';
const MANUFACTURER_CHAR = '00002a29-0000-1000-8000-00805f9b34fb';

const UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const UART_RX_CHAR = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const UART_TX_CHAR = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

// Helper to convert base64 to hex string
function base64ToHex(base64: string): string {
  const raw = atob(base64);
  return Array.from(raw)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

// Helper to parse a hex string into a Uint8Array
function hexStringToBytes(hex: string): Uint8Array {
  return new Uint8Array(
    hex.split(' ').map((b) => parseInt(b, 16))
  );
}

// General UBX packet parser and decoder
type UBXPacket = {
  class: number;
  id: number;
  length: number;
  payload: Uint8Array;
  checksumValid: boolean;
  decoded?: any;
};

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

// Decoder dispatch
function decodePacket(pkt: UBXPacket): any {
  // RaceBox Data Message (class 0xFF, id 0x01, 80 bytes)
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
  // Add more decoders here as you get more message specs
  return null;
}

function formatRaceBoxData(decoded: any) {
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

export default function BLEManager() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const devicesMap = useRef<{ [id: string]: Device }>({});
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [uartMessages, setUartMessages] = useState<string[]>([]);
  const txSubscription = useRef<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decodedPacket, setDecodedPacket] = useState<any>(null);
  const [lastPacketType, setLastPacketType] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      bleManager.destroy();
      if (txSubscription.current) {
        txSubscription.current.remove();
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      if (Platform.OS === 'android' && Platform.Version >= 23) {
        let permissions = [];
        if (Platform.Version >= 31) {
          // Android 12+
          permissions = [
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          ];
        } else {
          // Android < 12
          permissions = [
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          ];
        }
        const granted = await PermissionsAndroid.requestMultiple(permissions);
        const allGranted = permissions.every((perm) => granted[perm] === PermissionsAndroid.RESULTS.GRANTED);
        if (!allGranted) {
          setError('Bluetooth and location permissions are required to scan for devices. Please enable them in your device settings if you previously denied them.');
          return false;
        }
      }
      return true;
    } catch (e: any) {
      setError('Error requesting permissions: ' + (e?.message || e?.toString() || 'Unknown error'));
      return false;
    }
  };

  const startScan = async () => {
    setError(null);
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;
    setDevices([]);
    devicesMap.current = {};
    setIsScanning(true);
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        setError('Scan error: ' + error.message);
        setIsScanning(false);
        return;
      }
      if (device && !devicesMap.current[device.id]) {
        devicesMap.current[device.id] = device;
        setDevices((prev) => [...prev, device]);
      }
    });
    setTimeout(() => {
      stopScan();
    }, 10000); // Stop after 10 seconds
  };

  const stopScan = () => {
    bleManager.stopDeviceScan();
    setIsScanning(false);
  };

  const connectToDevice = async (device: Device) => {
    try {
      setConnectedDevice(device);
      setDeviceInfo(null);
      setUartMessages([]);
      setError(null);
      if (txSubscription.current) {
        txSubscription.current.remove();
        txSubscription.current = null;
      }
      const connected = await bleManager.connectToDevice(device.id);
      await connected.discoverAllServicesAndCharacteristics();
      // Read Device Info characteristics
      const [model, serial, firmware, hardware, manufacturer] = await Promise.all([
        connected.readCharacteristicForService(DEVICE_INFO_SERVICE, MODEL_CHAR),
        connected.readCharacteristicForService(DEVICE_INFO_SERVICE, SERIAL_CHAR),
        connected.readCharacteristicForService(DEVICE_INFO_SERVICE, FIRMWARE_CHAR),
        connected.readCharacteristicForService(DEVICE_INFO_SERVICE, HARDWARE_CHAR),
        connected.readCharacteristicForService(DEVICE_INFO_SERVICE, MANUFACTURER_CHAR),
      ]);
      setDeviceInfo({
        model: model?.value ? atob(model.value) : '',
        serial: serial?.value ? atob(serial.value) : '',
        firmware: firmware?.value ? atob(firmware.value) : '',
        hardware: hardware?.value ? atob(hardware.value) : '',
        manufacturer: manufacturer?.value ? atob(manufacturer.value) : '',
      });
      // Subscribe to UART TX notifications
      txSubscription.current = connected.monitorCharacteristicForService(
        UART_SERVICE,
        UART_TX_CHAR,
        (error, characteristic) => {
          if (error) {
            setError('UART notification error: ' + error.message);
            return;
          }
          if (characteristic?.value) {
            const hex = base64ToHex(characteristic.value);
            setUartMessages((prev) => [...prev, hex]);
            // General UBX packet parsing
            const bytes = hexStringToBytes(hex);
            const pkt = parseUBXPacket(bytes);
            if (pkt) {
              setLastPacketType(`Class 0x${pkt.class.toString(16).padStart(2, '0').toUpperCase()} ID 0x${pkt.id.toString(16).padStart(2, '0').toUpperCase()}`);
              if (!pkt.checksumValid) {
                setDecodedPacket({ error: 'Invalid checksum' });
              } else {
                const decoded = decodePacket(pkt);
                if (decoded) {
                  setDecodedPacket(decoded);
                } else {
                  setDecodedPacket({
                    type: 'Unknown',
                    class: pkt.class,
                    id: pkt.id,
                    length: pkt.length,
                    payloadHex: Array.from(pkt.payload).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
                  });
                }
              }
            }
          }
        }
      );
    } catch (e: any) {
      setError('Connection error: ' + (e?.message || e?.toString() || 'Unknown error'));
      setConnectedDevice(null);
      setDeviceInfo(null);
      setUartMessages([]);
    }
  };

  const disconnectFromDevice = async () => {
    try {
      if (txSubscription.current) {
        txSubscription.current.remove();
        txSubscription.current = null;
      }
      if (connectedDevice) {
        await bleManager.cancelDeviceConnection(connectedDevice.id);
      }
    } catch (e: any) {
      setError('Disconnect error: ' + (e?.message || e?.toString() || 'Unknown error'));
    } finally {
      setConnectedDevice(null);
      setDeviceInfo(null);
      setUartMessages([]);
      setDecodedPacket(null);
      setLastPacketType(null);
    }
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {error && (
        <View style={{ backgroundColor: '#ffcccc', padding: 10, borderRadius: 6, marginBottom: 10 }}>
          <Text style={{ color: '#a00', fontWeight: 'bold' }}>{error}</Text>
          <Button title="Dismiss" onPress={() => setError(null)} />
        </View>
      )}
      <Button title={isScanning ? 'Scanning...' : 'Start Scan'} onPress={startScan} disabled={isScanning} />
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 8, borderBottomWidth: 1, borderColor: '#ccc' }}>
            <Text>Name: {item.name || 'N/A'}</Text>
            <Text>ID: {item.id}</Text>
            <Button title="Connect" onPress={() => connectToDevice(item)} disabled={!!connectedDevice && connectedDevice.id === item.id} />
          </View>
        )}
        ListEmptyComponent={<Text style={{ marginTop: 20 }}>No devices found.</Text>}
        scrollEnabled={false}
      />
      {connectedDevice && deviceInfo && (
        <View style={{ marginTop: 24, padding: 12, borderWidth: 1, borderColor: '#007AFF', borderRadius: 8 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Device Info</Text>
          <Text>Model: {deviceInfo.model}</Text>
          <Text>Serial: {deviceInfo.serial}</Text>
          <Text>Firmware: {deviceInfo.firmware}</Text>
          <Text>Hardware: {deviceInfo.hardware}</Text>
          <Text>Manufacturer: {deviceInfo.manufacturer}</Text>
        </View>
      )}
      {connectedDevice && (
        <View style={{ marginTop: 24, padding: 12, borderWidth: 1, borderColor: '#34a853', borderRadius: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold' }}>UART TX Message{showHistory ? 's' : ''}</Text>
            <Button title="Disconnect" color="#a00" onPress={disconnectFromDevice} />
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 8 }}>
            <Button
              title={showHistory ? 'Show Latest' : 'Show History'}
              onPress={() => setShowHistory((prev) => !prev)}
            />
            <View style={{ width: 12 }} />
            <Button
              title="Clear Log"
              onPress={() => setUartMessages([])}
              disabled={uartMessages.length === 0}
            />
          </View>
          {uartMessages.length === 0 ? (
            <Text>No messages received yet.</Text>
          ) : showHistory ? (
            uartMessages.map((msg, idx) => (
              <Text key={idx} style={{ fontFamily: 'monospace' }}>{msg}</Text>
            ))
          ) : (
            <Text style={{ fontFamily: 'monospace' }}>{uartMessages[uartMessages.length - 1]}</Text>
          )}
        </View>
      )}
      {connectedDevice && decodedPacket && (
        <View style={{ marginTop: 16, padding: 12, borderWidth: 1, borderColor: '#007AFF', borderRadius: 8 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Decoded UBX Packet</Text>
          {lastPacketType && <Text style={{ fontWeight: 'bold' }}>{lastPacketType}</Text>}
          {decodedPacket.error ? (
            <Text style={{ color: 'red' }}>{decodedPacket.error}</Text>
          ) : decodedPacket.type === 'RaceBox Data' ? (
            formatRaceBoxData(decodedPacket).map((line, idx) => (
              <Text key={idx} style={{ fontFamily: 'monospace' }}>{line}</Text>
            ))
          ) : (
            Object.entries(decodedPacket).map(([k, v]) => (
              <Text key={k} style={{ fontFamily: 'monospace' }}>{k}: {String(v)}</Text>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
} 