import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Device as BleDevice } from 'react-native-ble-plx';
import { BLEManager } from '../src/infrastructure/ble/BLEManager';
import { RaceBoxApi } from 'racebox-api';
import { useLocalSearchParams, useNavigation } from 'expo-router';

const bleManager = new BLEManager();

function renderLiveData(liveData: any) {
  if (!liveData) return <Text>No live data yet.</Text>;

  // Example grouping: GPS, Speed, Battery, Acceleration, etc.
  const gps = liveData.gps || {};
  const speed = liveData.speed;
  const battery = liveData.battery;
  const acceleration = liveData.acceleration || {};
  const gForce = liveData.gForce;
  const satellites = liveData.satellites;
  const heading = liveData.heading;
  const altitude = liveData.altitude;
  const timestamp = liveData.timestamp;

  return (
    <View style={styles.liveCard}>
      {timestamp && (
        <Text style={styles.liveSectionTitle}>Timestamp: <Text style={styles.liveValue}>{new Date(timestamp).toLocaleString()}</Text></Text>
      )}
      {(gps.latitude || gps.longitude || altitude) && (
        <View style={styles.liveSection}>
          <Text style={styles.liveSectionTitle}>GPS</Text>
          {gps.latitude !== undefined && <Text style={styles.liveLabel}>Latitude: <Text style={styles.liveValue}>{gps.latitude}</Text></Text>}
          {gps.longitude !== undefined && <Text style={styles.liveLabel}>Longitude: <Text style={styles.liveValue}>{gps.longitude}</Text></Text>}
          {altitude !== undefined && <Text style={styles.liveLabel}>Altitude: <Text style={styles.liveValue}>{altitude} m</Text></Text>}
          {satellites !== undefined && <Text style={styles.liveLabel}>Satellites: <Text style={styles.liveValue}>{satellites}</Text></Text>}
        </View>
      )}
      {speed !== undefined && (
        <View style={styles.liveSection}>
          <Text style={styles.liveSectionTitle}>Speed</Text>
          <Text style={styles.liveLabel}>Speed: <Text style={styles.liveValue}>{speed} km/h</Text></Text>
        </View>
      )}
      {heading !== undefined && (
        <View style={styles.liveSection}>
          <Text style={styles.liveSectionTitle}>Heading</Text>
          <Text style={styles.liveLabel}>Heading: <Text style={styles.liveValue}>{heading}°</Text></Text>
        </View>
      )}
      {(acceleration.x !== undefined || acceleration.y !== undefined || acceleration.z !== undefined) && (
        <View style={styles.liveSection}>
          <Text style={styles.liveSectionTitle}>Acceleration</Text>
          {acceleration.x !== undefined && <Text style={styles.liveLabel}>X: <Text style={styles.liveValue}>{acceleration.x} m/s²</Text></Text>}
          {acceleration.y !== undefined && <Text style={styles.liveLabel}>Y: <Text style={styles.liveValue}>{acceleration.y} m/s²</Text></Text>}
          {acceleration.z !== undefined && <Text style={styles.liveLabel}>Z: <Text style={styles.liveValue}>{acceleration.z} m/s²</Text></Text>}
        </View>
      )}
      {gForce !== undefined && (
        <View style={styles.liveSection}>
          <Text style={styles.liveSectionTitle}>G-Force</Text>
          <Text style={styles.liveLabel}>G: <Text style={styles.liveValue}>{gForce} g</Text></Text>
        </View>
      )}
      {battery !== undefined && (
        <View style={styles.liveSection}>
          <Text style={styles.liveSectionTitle}>Battery</Text>
          <Text style={styles.liveLabel}>Battery: <Text style={styles.liveValue}>{battery} %</Text></Text>
        </View>
      )}
      {/* Fallback: show any other fields not covered above */}
      <View style={styles.liveSection}>
        {Object.entries(liveData).map(([key, value]) => {
          if ([
            'gps', 'speed', 'battery', 'acceleration', 'gForce', 'satellites', 'heading', 'altitude', 'timestamp'
          ].includes(key)) return null;
          return (
            <Text style={styles.liveLabel} key={key}>{key}: <Text style={styles.liveValue}>{JSON.stringify(value)}</Text></Text>
          );
        })}
      </View>
    </View>
  );
}

export default function DevicePage() {
  const { deviceId } = useLocalSearchParams();
  const navigation = useNavigation();
  const [device, setDevice] = useState<BleDevice | null>(null);
  const [info, setInfo] = useState<any>(null);
  const [liveData, setLiveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<() => void>();

  useEffect(() => {
    let api: RaceBoxApi | null = null;
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
          } else if (found.isConnected === false) {
            connected = await found.connect();
          }
          // Discover services and characteristics
          if (typeof connected.discoverAllServicesAndCharacteristics === 'function') {
            connected = await connected.discoverAllServicesAndCharacteristics();
          }
          // Now use RaceBoxApi
          api = new RaceBoxApi(connected);
          const data = await api.readDeviceInfo();
          setInfo(data);
          // Subscribe to live data
          unsubscribeRef.current = api.subscribeLiveData((live: any) => {
            setLiveData(live);
          });
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
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [deviceId]);

  const handleDisconnect = async () => {
    if (!device) return;
    try {
      if (unsubscribeRef.current) unsubscribeRef.current();
      await device.cancelConnection();
      // @ts-ignore
      navigation.goBack();
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
          <Text>ID: {info.id}</Text>
          <Text>Name: {info.name}</Text>
          <Text>Firmware: {info.firmwareVersion}</Text>
          <Text>Hardware: {info.hardwareVersion}</Text>
          <Text>Serial: {info.serialNumber}</Text>
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