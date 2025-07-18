import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Device as BleDevice } from 'react-native-ble-plx';
import { BLEManager } from '../src/infrastructure/ble/BLEManager';
import { DeviceUseCases } from '../src/application/use-cases/DeviceUseCases';
import type { DeviceData } from '../src/domain/model/DeviceData';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useConnection } from './ConnectionContext';

const bleManager = new BLEManager();
const deviceUseCases = new DeviceUseCases(bleManager);

function renderLiveData(liveData: DeviceData | null) {
  if (!liveData) return <Text>No live data yet.</Text>;

  // Map fields from DeviceData submodels
  return (
    <View style={styles.liveCard}>
      <View style={styles.liveSection}>
        <Text style={styles.liveSectionTitle}>GPS</Text>
        <Text style={styles.liveLabel}>Latitude: <Text style={styles.liveValue}>{liveData.location.latitude}</Text></Text>
        <Text style={styles.liveLabel}>Longitude: <Text style={styles.liveValue}>{liveData.location.longitude}</Text></Text>
        <Text style={styles.liveLabel}>WGS Altitude: <Text style={styles.liveValue}>{liveData.location.wgsAltitude} m</Text></Text>
        <Text style={styles.liveLabel}>MSL Altitude: <Text style={styles.liveValue}>{liveData.location.mslAltitude} m</Text></Text>
        <Text style={styles.liveLabel}>Satellites: <Text style={styles.liveValue}>{liveData.location.numSV}</Text></Text>
      </View>
      <View style={styles.liveSection}>
        <Text style={styles.liveSectionTitle}>Speed & Heading</Text>
        <Text style={styles.liveLabel}>Speed: <Text style={styles.liveValue}>{liveData.location.speed} km/h</Text></Text>
        <Text style={styles.liveLabel}>Heading: <Text style={styles.liveValue}>{liveData.location.heading}°</Text></Text>
      </View>
      <View style={styles.liveSection}>
        <Text style={styles.liveSectionTitle}>G-Force</Text>
        <Text style={styles.liveLabel}>X: <Text style={styles.liveValue}>{liveData.motion.gForceX}</Text></Text>
        <Text style={styles.liveLabel}>Y: <Text style={styles.liveValue}>{liveData.motion.gForceY}</Text></Text>
        <Text style={styles.liveLabel}>Z: <Text style={styles.liveValue}>{liveData.motion.gForceZ}</Text></Text>
      </View>
      <View style={styles.liveSection}>
        <Text style={styles.liveSectionTitle}>Rotation Rate</Text>
        <Text style={styles.liveLabel}>X: <Text style={styles.liveValue}>{liveData.motion.rotationRateX}</Text></Text>
        <Text style={styles.liveLabel}>Y: <Text style={styles.liveValue}>{liveData.motion.rotationRateY}</Text></Text>
        <Text style={styles.liveLabel}>Z: <Text style={styles.liveValue}>{liveData.motion.rotationRateZ}</Text></Text>
      </View>
      <View style={styles.liveSection}>
        <Text style={styles.liveSectionTitle}>Battery/Voltage</Text>
        <Text style={styles.liveLabel}>Value: <Text style={styles.liveValue}>{liveData.sensors.batteryOrVoltage}</Text></Text>
      </View>
    </View>
  );
}

export default function DevicePage() {
  const { deviceId } = useLocalSearchParams();
  // const navigation = useNavigation();
  const [device, setDevice] = useState<BleDevice | null>(null);
  const [info, setInfo] = useState<
    | {
        model?: string;
        serial?: string;
        firmware?: string;
        hardware?: string;
        manufacturer?: string;
      }
    | null>(null);
  const [liveData, setLiveData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<() => void>();
  const { setConnectedDeviceId } = useConnection();

  useEffect(() => {
    async function fetchDevice() {
      setLoading(true);
      try {
        if (!deviceId || typeof deviceId !== 'string') {
          setInfo(null);
          setDevice(null);
          setLoading(false);
          return;
        }
        let found = await bleManager.getDeviceById(deviceId);
        setDevice(found);
        if (found) {
          // Ensure device is connected
          let connected = found;
          if (typeof found.isConnected === 'function') {
            const isConnected = await found.isConnected();
            if (!isConnected) {
              connected = await found.connect();
            }
          }
          // Discover services and characteristics
          if (typeof connected.discoverAllServicesAndCharacteristics === 'function') {
            connected = await connected.discoverAllServicesAndCharacteristics();
          }
          // Read device info (optional, not part of live data)
          // You may want to move this to a use case as well
          // Now subscribe to live data using the use case
          unsubscribeRef.current = await deviceUseCases.subscribeToLiveData(deviceId as string, setLiveData);
        } else {
          setInfo(null);
        }
      } catch (e) {
        Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchDevice();
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [deviceId]);

  const handleDisconnect = async () => {
    if (!device) return;
    try {
      if (unsubscribeRef.current) unsubscribeRef.current();
      await device.cancelConnection();
      setDevice(null);
      setLiveData(null);
      setInfo(null);
      setConnectedDeviceId(null);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Device Page</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#023c69" />
      ) : info ? (
        <View style={styles.infoBox}>
          <Text>Model: {info.model}</Text>
          <Text>Firmware: {info.firmware}</Text>
          <Text>Hardware: {info.hardware}</Text>
          <Text>Serial: {info.serial}</Text>
          <Text>Manufacturer: {info.manufacturer}</Text>
        </View>
      ) : (
        <Text>No info available.</Text>
      )}
      <Button title="Disconnect" onPress={handleDisconnect} color="#c00" disabled={!device} />
      <Text style={styles.subtitle}>Live Data</Text>
      {renderLiveData(liveData)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
  },
  infoBox: {
    marginBottom: 30,
    alignItems: 'flex-start',
  },
  liveCard: {
    backgroundColor: '#f7f7fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  liveSection: {
    marginBottom: 10,
  },
  liveSectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
    color: '#023c69',
  },
  liveLabel: {
    fontSize: 15,
    marginLeft: 8,
    marginBottom: 1,
  },
  liveValue: {
    fontWeight: '600',
    color: '#222',
  },
}); 