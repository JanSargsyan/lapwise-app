import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, ScrollView, StyleSheet, Alert } from 'react-native';
import { useDeviceManager } from '../hooks/useDeviceManager';
import { Device, DeviceData } from '../../domain/entities/Device';

export default function DeviceManager() {
  const [enableRealBLE, setEnableRealBLE] = useState(true);
  const [bleStatus, setBleStatus] = useState<{ available: boolean; error?: string }>({ available: false });
  
  const {
    devices,
    connectedDevices,
    isScanning,
    error,
    deviceData,
    startScan,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
    clearError,
    getDeviceData,
    isConnected,
    setEnableRealBLE: setEnableRealBLERepo,
    checkBLEAvailability,
  } = useDeviceManager(enableRealBLE);

  // Check BLE availability when component mounts or toggle changes
  useEffect(() => {
    const checkBLE = async () => {
      if (checkBLEAvailability) {
        const status = await checkBLEAvailability();
        setBleStatus(status);
      }
    };
    checkBLE();
  }, [enableRealBLE, checkBLEAvailability]);

  // When the toggle changes, update the repository as well
  const handleToggleRealBLE = () => {
    setEnableRealBLE((prev) => {
      const next = !prev;
      if (setEnableRealBLERepo) setEnableRealBLERepo(next);
      return next;
    });
  };

  const handleConnect = async (device: Device) => {
    try {
      await connectToDevice(device.info.id);
    } catch (err: any) {
      Alert.alert('Connection Error', err.message);
    }
  };

  const handleDisconnect = async (device: Device) => {
    try {
      await disconnectFromDevice(device.info.id);
    } catch (err: any) {
      Alert.alert('Disconnection Error', err.message);
    }
  };

  const renderDevice = ({ item: device }: { item: Device }) => {
    const connected = isConnected(device.info.id);
    const data = getDeviceData(device.info.id);
    const isMockDevice = device.info.id.startsWith('mock-');

    return (
      <View style={styles.deviceItem}>
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceName}>{device.info.name}</Text>
          <View style={styles.deviceTypeContainer}>
            <Text style={styles.deviceType}>{device.info.type}</Text>
            {isMockDevice && (
              <Text style={styles.mockBadge}>MOCK</Text>
            )}
          </View>
        </View>
        
        <Text style={styles.deviceId}>ID: {device.info.id}</Text>
        
        {device.info.manufacturer && (
          <Text style={styles.deviceInfo}>Manufacturer: {device.info.manufacturer}</Text>
        )}
        
        {connected && (
          <View style={styles.connectedInfo}>
            <Text style={styles.connectedText}>✓ Connected</Text>
            {data && (
              <View style={styles.dataInfo}>
                {data.location && (
                  <Text style={styles.dataText}>
                    Location: {data.location.latitude.toFixed(6)}, {data.location.longitude.toFixed(6)}
                  </Text>
                )}
                {data.motion && (
                  <Text style={styles.dataText}>
                    G-Force: {data.motion.gForce.toFixed(2)}g
                  </Text>
                )}
                {data.sensors?.batteryLevel && (
                  <Text style={styles.dataText}>
                    Battery: {data.sensors.batteryLevel}%
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
        
        <View style={styles.deviceActions}>
          {connected ? (
            <Button
              title="Disconnect"
              onPress={() => handleDisconnect(device)}
              color="#FF3B30"
            />
          ) : (
            <Button
              title="Connect"
              onPress={() => handleConnect(device)}
              color="#007AFF"
            />
          )}
        </View>
      </View>
    );
  };

  const renderConnectedDevice = ({ item: device }: { item: Device }) => {
    const data = getDeviceData(device.info.id);
    
    return (
      <View style={styles.connectedDeviceItem}>
        <Text style={styles.connectedDeviceName}>{device.info.name}</Text>
        {data && (
          <View style={styles.liveData}>
            {data.location && (
              <Text style={styles.liveDataText}>
                📍 {data.location.latitude.toFixed(6)}, {data.location.longitude.toFixed(6)}
              </Text>
            )}
            {data.motion && (
              <Text style={styles.liveDataText}>
                🚗 {data.motion.gForce.toFixed(2)}g | {data.motion.acceleration.x.toFixed(2)}x, {data.motion.acceleration.y.toFixed(2)}y, {data.motion.acceleration.z.toFixed(2)}z
              </Text>
            )}
            {data.location && (
              <Text style={styles.liveDataText}>
                🛰️ {data.location.speed.toFixed(1)} m/s | {data.location.heading.toFixed(0)}° | {data.location.satellites} satellites
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Device Manager</Text>
        <Text style={styles.subtitle}>Mock & Real BLE Devices</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Clear Error" onPress={clearError} />
        </View>
      )}

      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Button
            title={isScanning ? "Stop Scan" : "Start Scan"}
            onPress={isScanning ? stopScan : startScan}
            color={isScanning ? "#FF3B30" : "#007AFF"}
          />
        </View>
        <View style={styles.controlRow}>
          <Text style={styles.toggleLabel}>Real BLE Devices:</Text>
          <Button
            title={enableRealBLE ? "ON" : "OFF"}
            onPress={handleToggleRealBLE}
            color={enableRealBLE ? "#4CAF50" : "#999"}
          />
        </View>
        {enableRealBLE && (
          <View style={styles.bleStatusContainer}>
            <Text style={styles.bleStatusLabel}>BLE Status:</Text>
            <Text style={[
              styles.bleStatusText,
              { color: bleStatus.available ? '#4CAF50' : '#FF3B30' }
            ]}>
              {bleStatus.available ? 'Available' : 'Unavailable'}
            </Text>
            {bleStatus.error && (
              <Text style={styles.bleStatusError}>{bleStatus.error}</Text>
            )}
            <Button
              title="Check BLE Status"
              onPress={async () => {
                if (checkBLEAvailability) {
                  const status = await checkBLEAvailability();
                  setBleStatus(status);
                }
              }}
              color="#007AFF"
            />
          </View>
        )}
      </View>

      {connectedDevices.length > 0 && (
        <View style={styles.section}>
          {(() => { console.log(connectedDevices); return null; })()}
          <Text style={styles.sectionTitle}>Connected Devices ({connectedDevices.length})</Text>
          <FlatList
            data={connectedDevices}
            renderItem={renderConnectedDevice}
            keyExtractor={(item) => item.info.id}
            scrollEnabled={false}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Devices ({devices.length})</Text>
        <FlatList
          data={devices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.info.id}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  errorContainer: {
    margin: 20,
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    marginBottom: 10,
  },
  controls: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  section: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  deviceItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deviceTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceType: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mockBadge: {
    fontSize: 10,
    color: '#FF6B35',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontWeight: 'bold',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  deviceInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  connectedInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e8f5e8',
    borderRadius: 6,
  },
  connectedText: {
    color: '#2e7d32',
    fontWeight: '600',
    marginBottom: 5,
  },
  dataInfo: {
    marginTop: 5,
  },
  dataText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  deviceActions: {
    marginTop: 10,
  },
  connectedDeviceItem: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 10,
  },
  connectedDeviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  liveData: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 4,
  },
  liveDataText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  bleStatusContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    alignItems: 'center',
  },
  bleStatusLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 5,
  },
  bleStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bleStatusError: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 5,
  },
}); 