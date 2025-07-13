import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, ScrollView, StyleSheet, Alert } from 'react-native';
import { useDeviceManager } from '../hooks/useDeviceManager';
import { useDataRecording } from '../hooks/useDataRecording';
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

  const {
    dataRuns,
    activeRuns,
    isRecording,
    storageSize,
    error: recordingError,
    startRecording,
    stopRecording,
    recordDataPoint,
    deleteDataRun,
    clearAllData,
    clearError: clearRecordingError,
  } = useDataRecording();

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

  const handleStartRecording = async (device: Device) => {
    try {
      const runName = `${device.info.name} - ${new Date().toLocaleString()}`;
      await startRecording(device.info.id, device.info.name, runName);
      Alert.alert('Recording Started', `Started recording data for ${device.info.name}`);
    } catch (err: any) {
      Alert.alert('Recording Error', err.message);
    }
  };

  const handleStopRecording = async (device: Device) => {
    try {
      await stopRecording(device.info.id);
      Alert.alert('Recording Stopped', `Stopped recording data for ${device.info.name}`);
    } catch (err: any) {
      Alert.alert('Recording Error', err.message);
    }
  };

  const renderDevice = ({ item: device }: { item: Device }) => {
    const connected = isConnected(device.info.id);
    const data = getDeviceData(device.info.id);
    const isMockDevice = device.info.id.startsWith('mock-');
    const recording = isRecording(device.info.id);
    
    // Hide other devices when connected to any device
    const hasConnectedDevices = connectedDevices.length > 0;
    const shouldShow = connected || !hasConnectedDevices;
    
    if (!shouldShow) {
      return null;
    }

    return (
      <View style={[styles.deviceItem, recording && styles.recordingDeviceItem]}>
        <View style={styles.deviceHeader}>
          <Text style={styles.deviceName}>{device.info.name}</Text>
          <View style={styles.deviceTypeContainer}>
            <Text style={styles.deviceType}>{device.info.type}</Text>
            {isMockDevice && (
              <Text style={styles.mockBadge}>MOCK</Text>
            )}
            {recording && (
              <Text style={styles.recordingBadge}>🔴 RECORDING</Text>
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
            {recording && (
              <Text style={styles.recordingText}>🔴 Recording data...</Text>
            )}
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
          <View style={styles.actionRow}>
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
          
          {connected && (
            <View style={styles.actionRow}>
              {recording ? (
                <Button
                  title="🔴 Stop Recording"
                  onPress={() => handleStopRecording(device)}
                  color="#FF9500"
                />
              ) : (
                <Button
                  title="▶️ Start Recording"
                  onPress={() => handleStartRecording(device)}
                  color="#4CAF50"
                />
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderConnectedDevice = ({ item: device }: { item: Device }) => {
    const data = getDeviceData(device.info.id);
    const recording = isRecording(device.info.id);
    
    return (
      <View style={[styles.connectedDeviceItem, recording && styles.recordingConnectedDeviceItem]}>
        <View style={styles.connectedDeviceHeader}>
          <Text style={styles.connectedDeviceName}>{device.info.name}</Text>
          {recording && (
            <Text style={styles.recordingIndicator}>🔴 Recording</Text>
          )}
        </View>
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

      {recordingError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Recording Error: {recordingError}</Text>
          <Button title="Clear Error" onPress={clearRecordingError} />
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
        <View style={styles.controlRow}>
          <Text style={styles.storageInfo}>Storage: {(storageSize / 1024).toFixed(1)} KB</Text>
          <Button
            title="Clear All Data"
            onPress={() => {
              Alert.alert(
                'Clear All Data',
                'Are you sure you want to delete all recorded data?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: clearAllData },
                ]
              );
            }}
            color="#FF3B30"
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
        {connectedDevices.length > 0 && (
          <View style={styles.hiddenDevicesMessage}>
            <Text style={styles.hiddenDevicesText}>
              Other devices are hidden while connected to a device. Disconnect to see all devices.
            </Text>
          </View>
        )}
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
  storageInfo: {
    fontSize: 14,
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
  recordingDeviceItem: {
    backgroundColor: '#fde7e7', // Light red background for recording devices
    borderColor: '#ffcdd2',
    borderWidth: 1,
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
  recordingBadge: {
    fontSize: 10,
    color: '#FF9500',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontWeight: 'bold',
  },
  recordingText: {
    color: '#FF9500',
    fontWeight: '600',
    marginTop: 5,
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
  actionRow: {
    marginBottom: 5,
  },
  connectedDeviceItem: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 10,
  },
  recordingConnectedDeviceItem: {
    backgroundColor: '#fde7e7', // Light red background for recording devices
    borderColor: '#ffcdd2',
    borderWidth: 1,
  },
  connectedDeviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  connectedDeviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  recordingIndicator: {
    fontSize: 12,
    color: '#FF9500',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontWeight: 'bold',
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
  hiddenDevicesMessage: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e0f7fa',
    borderRadius: 6,
    alignItems: 'center',
  },
  hiddenDevicesText: {
    fontSize: 12,
    color: '#00796b',
    fontWeight: '500',
  },
}); 