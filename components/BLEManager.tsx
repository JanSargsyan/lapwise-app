import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, FlatList, PermissionsAndroid, Platform, Alert, ScrollView } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx';
import { decode as atob } from 'base-64';
import { getProtocol, getAllProtocols, BLEProtocol } from './BLEProtocols';
import { createDeviceData, DeviceType, DeviceData } from './DeviceData';

const bleManager = new BleManager();

// Helper to convert base64 to hex string
function base64ToHex(base64: string): string {
  const raw = atob(base64);
  return Array.from(raw)
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
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
  const [selectedProtocol, setSelectedProtocol] = useState<string>('racebox');
  const [deviceData, setDeviceData] = useState<DeviceData | null>(null);

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
      const protocol = getProtocol(selectedProtocol);
      if (!protocol) {
        setError('Selected protocol not found');
        return;
      }

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

      // Read Device Info characteristics if available
      if (protocol.deviceInfoServiceUUID && protocol.deviceInfoCharacteristics) {
        const deviceInfoData: any = {};
        for (const [key, uuid] of Object.entries(protocol.deviceInfoCharacteristics)) {
          try {
            const characteristic = await connected.readCharacteristicForService(
              protocol.deviceInfoServiceUUID,
              uuid
            );
            if (characteristic?.value) {
              deviceInfoData[key] = atob(characteristic.value);
            }
          } catch (e) {
            // Ignore errors for optional characteristics
          }
        }
        setDeviceInfo(deviceInfoData);
      }

      // Subscribe to TX notifications
      txSubscription.current = connected.monitorCharacteristicForService(
        protocol.serviceUUID,
        protocol.txCharacteristicUUID,
        (error, characteristic) => {
          if (error) {
            setError('UART notification error: ' + error.message);
            return;
          }
          if (characteristic?.value) {
            const hex = base64ToHex(characteristic.value);
            setUartMessages((prev) => [...prev, hex]);
            
            // Decode packet using protocol
            const bytes = new Uint8Array(
              hex.split(' ').map((b) => parseInt(b, 16))
            );
            const decoded = protocol.decodePacket(bytes);
            if (decoded) {
              setDecodedPacket(decoded);
              // Create domain model from protocol data
              const domainData = createDeviceData(
                selectedProtocol as DeviceType,
                decoded,
                hex
              );
              setDeviceData(domainData);
              if (decoded.type) {
                setLastPacketType(`${protocol.name} - ${decoded.type}`);
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
      setDeviceData(null);
    }
  };

  const protocols = getAllProtocols();

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      {error && (
        <View style={{ backgroundColor: '#ffcccc', padding: 10, borderRadius: 6, marginBottom: 10 }}>
          <Text style={{ color: '#a00', fontWeight: 'bold' }}>{error}</Text>
          <Button title="Dismiss" onPress={() => setError(null)} />
        </View>
      )}
      
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Protocol:</Text>
        <FlatList
          horizontal
          data={protocols}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Button
              title={item}
              onPress={() => setSelectedProtocol(item)}
              color={selectedProtocol === item ? '#007AFF' : '#999'}
            />
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

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
          {Object.entries(deviceInfo).map(([k, v]) => (
            <Text key={k}>{k}: {String(v)}</Text>
          ))}
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
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Decoded Packet</Text>
          {lastPacketType && <Text style={{ fontWeight: 'bold' }}>{lastPacketType}</Text>}
          {decodedPacket.error ? (
            <Text style={{ color: 'red' }}>{decodedPacket.error}</Text>
          ) : (
            (() => {
              const protocol = getProtocol(selectedProtocol);
              if (protocol?.formatDecodedData) {
                return protocol.formatDecodedData(decodedPacket).map((line, idx) => (
                  <Text key={idx} style={{ fontFamily: 'monospace' }}>{line}</Text>
                ));
              } else {
                return Object.entries(decodedPacket).map(([k, v]) => (
                  <Text key={k} style={{ fontFamily: 'monospace' }}>{k}: {String(v)}</Text>
                ));
              }
            })()
          )}
        </View>
      )}
      {connectedDevice && deviceData && (
        <View style={{ marginTop: 16, padding: 12, borderWidth: 1, borderColor: '#34a853', borderRadius: 8 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Device Data (Domain Model)</Text>
          <Text style={{ fontWeight: 'bold', color: '#007AFF' }}>Quality: {deviceData.dataQuality}</Text>
          <Text style={{ fontFamily: 'monospace' }}>Location: {deviceData.location ? `${deviceData.location.latitude.toFixed(6)}, ${deviceData.location.longitude.toFixed(6)}` : 'No location'}</Text>
          <Text style={{ fontFamily: 'monospace' }}>Altitude: {deviceData.location?.altitude.toFixed(1)}m</Text>
          <Text style={{ fontFamily: 'monospace' }}>Speed: {deviceData.motion?.speed.toFixed(1)} m/s</Text>
          <Text style={{ fontFamily: 'monospace' }}>Heading: {deviceData.motion?.heading.toFixed(1)}°</Text>
          <Text style={{ fontFamily: 'monospace' }}>Satellites: {deviceData.location?.satellites}</Text>
          {deviceData.status?.batteryLevel && (
            <Text style={{ fontFamily: 'monospace' }}>Battery: {deviceData.status.batteryLevel}% {deviceData.status.isCharging ? '(charging)' : ''}</Text>
          )}
          {deviceData.sensors?.accelerometer && (
            <Text style={{ fontFamily: 'monospace' }}>G-Force: {deviceData.sensors.accelerometer.x.toFixed(2)}g, {deviceData.sensors.accelerometer.y.toFixed(2)}g, {deviceData.sensors.accelerometer.z.toFixed(2)}g</Text>
          )}
        </View>
      )}
    </ScrollView>
  );
} 