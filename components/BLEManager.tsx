import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, FlatList, PermissionsAndroid, Platform, Alert } from 'react-native';
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
            const msg = atob(characteristic.value);
            setUartMessages((prev) => [...prev, msg]);
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
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
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
    </View>
  );
} 