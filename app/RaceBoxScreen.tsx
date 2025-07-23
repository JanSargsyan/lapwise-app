import React, { useState, useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useLocalSearchParams } from 'expo-router';
import { container } from '@/src/application/di';

export default function RaceBoxScreen() {
  const params = useLocalSearchParams();
  // Helper to get param as string
  function getParam(param: unknown, fallback: string) {
    if (Array.isArray(param)) return param[0] || fallback;
    return param || fallback;
  }
  const [deviceName, setDeviceName] = useState(getParam(params.label, getParam(params.name, 'RaceBox Mini')));
  const serialNumber = getParam(params.id, 'RBX123456');
  const model = getParam(params.type, 'Mini S');
  const manufacturer = getParam(params.manufacturer, '');
  const [connected, setConnected] = useState(false);
  const recording = false;
  const battery = '85%';
  const gps = 'Good';

  const navigation = useNavigation();

  useEffect(() => {
    let isActive = true;
    if (serialNumber) {
      container.ble.isBLEDeviceConnectedUseCase.execute(serialNumber).then(isConn => {
        if (isActive) setConnected(isConn);
      });
    }
    return () => { isActive = false; };
  }, [serialNumber]);

  const handleEditName = () => {
    Alert.prompt('Edit Device Name', 'Enter new device name:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', onPress: (text) => text && setDeviceName(text) },
    ], 'plain-text', deviceName);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleEditName} style={{ padding: 8 }}>
          <Ionicons name="create-outline" size={24} color="#2196f3" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleEditName]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Device Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Name: <Text style={styles.infoValue}>{deviceName}</Text></Text>
          <Text style={styles.infoLabel}>S/N: <Text style={styles.infoValue}>{serialNumber}</Text></Text>
          <Text style={styles.infoLabel}>Model: <Text style={styles.infoValue}>{model}</Text></Text>
          {manufacturer ? <Text style={styles.infoLabel}>Manufacturer: <Text style={styles.infoValue}>{manufacturer}</Text></Text> : null}
        </View>

        {/* Status */}
        <View style={styles.statusBox}>
          <Text style={styles.statusLabel}>Status: <Text style={[styles.statusValue, { color: connected ? 'green' : 'red' }]}>{connected ? 'Connected' : 'Disconnected'}</Text></Text>
          <Text style={styles.statusLabel}>Recording: <Text style={styles.statusValue}>{recording ? 'Recording' : 'Not Recording'}</Text></Text>
          <Text style={styles.statusLabel}>Battery: <Text style={styles.statusValue}>{battery}</Text></Text>
          <Text style={styles.statusLabel}>GPS: <Text style={styles.statusValue}>{gps}</Text></Text>
        </View>

        {/* Connect/Disconnect button only, full width */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.actionButton, styles.fullWidthButton, connected ? styles.disconnect : styles.connect]}>
            <Ionicons name={connected ? 'close-circle-outline' : 'link-outline'} size={20} color="#fff" />
            <Text style={styles.actionButtonText}>{connected ? 'Disconnect' : 'Connect'}</Text>
          </TouchableOpacity>
        </View>

        {/* Standalone Recording Section - vertical buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Standalone Recording</Text>
          <View style={styles.verticalButtonStack}>
            <TouchableOpacity style={[styles.actionButton, styles.primary]}>
              <Ionicons name={recording ? 'stop-circle-outline' : 'play-circle-outline'} size={20} color="#fff" />
              <Text style={styles.actionButtonText}>{recording ? 'Stop Recording' : 'Start Recording'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="settings-outline" size={20} color="#2196f3" />
              <Text style={[styles.actionButtonText, { color: '#2196f3' }]}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="download-outline" size={20} color="#2196f3" />
              <Text style={[styles.actionButtonText, { color: '#2196f3' }]}>Download Recorded Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.danger]}>
              <Ionicons name="trash-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Erase All Memory</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f7f7fa',
    flexGrow: 1,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 18,
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
    color: '#555',
  },
  infoValue: {
    fontWeight: '700',
    color: '#222',
  },
  statusBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.1,
    color: '#555',
  },
  statusValue: {
    fontWeight: '700',
    color: '#222',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  fullWidthButton: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 0,
  },
  verticalButtonStack: {
    flexDirection: 'column',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2196f3',
    marginRight: 8,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  connect: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  disconnect: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  primary: {
    backgroundColor: '#2196f3',
    borderColor: '#2196f3',
  },
  danger: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#2196f3',
  },
}); 