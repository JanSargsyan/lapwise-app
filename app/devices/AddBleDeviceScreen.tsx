import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { container } from '@/src/application/di';
import type { ScannedBleDevice } from '@/src/domain/repository/BLERespository';
import { fromString } from '@/src/domain/model/device/Device';
import { DeviceCatalog } from '@/src/domain/model/device/DeviceCatalog';
import { BLEConnectionProps } from '@/src/domain/model/device/ConnectionType';

export default function AddBleDeviceScreen() {
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams<{ device: string }>();
  const deviceType = fromString(params.device);
  const [scannedDevices, setScannedDevices] = useState<ScannedBleDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Params:', params);
    console.log('Effect:', deviceType);
    if (!deviceType) return;
    setLoading(true);
    const subscription = container.scanForBLEDevicesUseCase.execute(deviceType).subscribe({
      next: (devices) => {
        setScannedDevices(devices);
        setLoading(false);
      },
      error: () => setLoading(false),
    });
    return () => subscription.unsubscribe();
  }, [params.device]);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}> 
      <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].tint }]}>Find Your Device</Text>
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
}); 