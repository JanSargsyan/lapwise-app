import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Button, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { BLEManager } from '../../src/infrastructure/ble/BLEManager';
import { DeviceUseCases } from '../../src/application/use-cases/DeviceUseCases';
import { useRouter } from 'expo-router';
import { useConnection } from '../ConnectionContext';

const bleManager = new BLEManager();
const deviceUseCases = new DeviceUseCases(bleManager);

export default function HomeScreen() {
  const [selectedDevice, setSelectedDevice] = useState('RaceBox');
  const [loading, setLoading] = useState(false);
  const { connectedDeviceId, setConnectedDeviceId } = useConnection();
  const router = useRouter();

  useEffect(() => {
    if (connectedDeviceId) {
      router.replace({ pathname: '/DevicePage', params: { deviceId: connectedDeviceId } });
    }
  }, [connectedDeviceId]);

  const handleConnect = async () => {
    if (selectedDevice === 'RaceBox') {
      setLoading(true);
      try {
        const device = await deviceUseCases.connectToClosestRaceBox();
        setLoading(false);
        if (device) {
          setConnectedDeviceId(device.id);
        } else {
          Alert.alert('Not found', 'No RaceBox device found nearby.');
        }
      } catch (e) {
        setLoading(false);
        Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error');
      }
    }
  };

  if (connectedDeviceId) {
    return <ActivityIndicator size="large" color="#023c69" style={{ flex: 1 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to LapWise!</Text>
      <Text style={styles.label}>Select Device:</Text>
      <Picker
        selectedValue={selectedDevice}
        onValueChange={(itemValue) => setSelectedDevice(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="RaceBox" value="RaceBox" />
        <Picker.Item label="Mock Device" value="Mock" />
      </Picker>
      <Button title="Connect" onPress={handleConnect} disabled={loading} />
      {loading && <ActivityIndicator size="small" color="#023c69" style={{ marginTop: 16 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  picker: {
    width: 200,
    marginBottom: 20,
  },
});
