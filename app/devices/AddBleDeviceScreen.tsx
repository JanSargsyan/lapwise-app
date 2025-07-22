import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Platform, PermissionsAndroid, Alert, Linking, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { container } from '@/src/application/di';
import type { ScannedBleDevice } from '@/src/domain/repository/BLERespository';
import { fromString } from '@/src/domain/model/device/DeviceType';
import { DeviceCatalog } from '@/src/domain/model/device/DeviceCatalog';
import { BLEConnectionProps } from '@/src/domain/model/device/ConnectionType';

export default function AddBleDeviceScreen() {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams<{ device: string }>();
  const deviceType = fromString(params.device);
  const [scannedDevices, setScannedDevices] = useState<ScannedBleDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionsGranted, setPermissionsGranted] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    async function checkPermissions() {
      if (Platform.OS === 'android') {
        try {
          // Android 12+ (API 31): need BLUETOOTH_SCAN, BLUETOOTH_CONNECT, and location
          // Below 12: only location
          const permissions = [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
          if (Platform.Version >= 31) {
            permissions.push(
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
            );
          }

          for (const permission of permissions) {
            const alreadyGranted = await PermissionsAndroid.check(permission);
            if (!alreadyGranted) {
              const result = await PermissionsAndroid.request(permission);
              if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
                setPermissionsGranted(false);
                Alert.alert(
                  'Permission Required',
                  'Some permissions are permanently denied. Please enable them in app settings.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() },
                  ]
                );
                return;
              }
              if (result !== PermissionsAndroid.RESULTS.GRANTED) {
                setPermissionsGranted(false);
                Alert.alert(
                  'Permissions Required',
                  'Bluetooth and Location permissions are required to scan for BLE devices.'
                );
                return;
              }
            }
          }
          setPermissionsGranted(true);
        } catch {
          setPermissionsGranted(false);
          Alert.alert('Permission Error', 'Failed to check permissions.');
        }
      } else {
        setPermissionsGranted(true);
      }
    }
    checkPermissions();
  }, []);

  useEffect(() => {
    if (!permissionsGranted) return;
    console.log('Params:', params);
    console.log('Effect:', deviceType);
    if (!deviceType) return;
    setLoading(true);
    const subscription = container.ble.scanForBLEDevicesUseCase.execute(deviceType).subscribe({
      next: (devices) => {
        console.log('Devices:', devices);
        setScannedDevices(devices);
        setLoading(false);
      },
      error: () => setLoading(false),
    });
    return () => subscription.unsubscribe();
  }, [params.device, permissionsGranted]);

  const handleConnect = async (address: string) => {
    if (!deviceType) return;
    console.log('Attempting to connect to device:', address);
    setConnectingId(address);
    try {
      const success = await container.ble.connectToBLEDeviceUseCase.execute(address, deviceType);
      if (success) {
        console.log('Successfully connected to device:', address);
        Alert.alert('Success', 'Connected to device!');
      } else {
        console.log('Failed to connect to device:', address);
        Alert.alert('Connection Failed', 'Could not connect to the device.');
      }
    } catch (e) {
      console.log('Error connecting to device:', address, e);
      Alert.alert('Connection Error', 'An error occurred while connecting.');
    } finally {
      setConnectingId(null);
      console.log('Connection attempt finished for device:', address);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}> 
      <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].tint }]}>Find Your Device</Text>
      {!permissionsGranted && (
        <Text style={{ color: 'red', marginBottom: 16 }}>Bluetooth and Location permissions are required to scan for BLE devices.</Text>
      )}
      {deviceType && (
        <>
          <Text style={[styles.deviceLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Device: {DeviceCatalog[deviceType].label}</Text>
          <View style={styles.infoBox}>
            <Text style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].tint }]}>Looking for:</Text>
            <Text style={[styles.infoValue, { color: Colors[colorScheme ?? 'light'].text }]}>{(DeviceCatalog[deviceType].connectionProps as BLEConnectionProps )?.advertisedNamePrefix}</Text>
          </View>
        </>
      )}
      <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>Scanning for BLE devices...</Text>
      {loading && <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} style={{ marginTop: 24 }} />}
      <FlatList
        data={scannedDevices}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.deviceRow}>
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.deviceRssi}>RSSI: {item.rssi}</Text>
            <TouchableOpacity
              style={[styles.connectButton, connectingId === item.address && styles.connectButtonDisabled]}
              onPress={() => handleConnect(item.address)}
              disabled={!!connectingId}
            >
              {connectingId === item.address ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.connectButtonText}>Connect</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.deviceList}
        ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No devices found yet.</Text> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  deviceLabel: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 32,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  infoBox: {
    backgroundColor: '#e3f0fa',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  deviceList: {
    width: '100%',
    marginTop: 24,
    paddingHorizontal: 0,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    width: '100%',
  },
  deviceName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#222',
  },
  deviceRssi: {
    fontSize: 15,
    color: '#888',
    fontWeight: '400',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
    fontSize: 16,
  },
  connectButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  connectButtonDisabled: {
    backgroundColor: '#90caf9',
  },
  connectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 