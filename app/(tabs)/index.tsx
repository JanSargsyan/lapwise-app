import React, { useState } from 'react';
import { StyleSheet, View, Text, Button, ActivityIndicator, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { BLEManager } from '../../src/infrastructure/ble/BLEManager';
import { DeviceUseCases } from '../../src/application/use-cases/DeviceUseCases';

const bleManager = new BLEManager();
const deviceUseCases = new DeviceUseCases(bleManager);

export default function HomeScreen() {
  const [selectedDevice, setSelectedDevice] = useState('RaceBox');
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    if (selectedDevice === 'RaceBox') {
      setLoading(true);
      try {
        const device = await deviceUseCases.connectToClosestRaceBox();
        setLoading(false);
        if (device) {
          Alert.alert('Connected', `Connected to ${device.name}`);
        } else {
          Alert.alert('Not found', 'No RaceBox device found nearby.');
        }
      } catch (e) {
        setLoading(false);
        Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error');
      }
    } else {
      Alert.alert('Mock Device', 'Mock device connection not implemented yet.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to LapWise!</Text>
      <Text style={styles.subtitle}>Select a device to connect:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedDevice}
          onValueChange={setSelectedDevice}
          style={styles.picker}
        >
          <Picker.Item label="RaceBox" value="RaceBox" />
          <Picker.Item label="Mock Device" value="Mock Device" />
        </Picker>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#023c69" />
      ) : (
        <Button title="Connect" onPress={handleConnect} />
      )}
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  pickerContainer: {
    width: '100%',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
  },
});
