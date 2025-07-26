import React, { useState, useLayoutEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { container } from '@/src/application/di';
import { Subscription } from 'rxjs';
import { Device } from '@/src/domain/model/device/Device';
import { BLEConnectionProps } from '@/src/domain/model/device/ConnectionType';

export default function RaceBoxScreen() {
  const params = useLocalSearchParams();
  // Helper to get param as string
  function getParam(param: unknown, fallback: string) {
    if (Array.isArray(param)) return param[0] || fallback;
    return param || fallback;
  }
  const [deviceName, setDeviceName] = useState(getParam(params.label, getParam(params.name, 'RaceBox Mini')));
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(deviceName);
  const serialNumber = getParam(params.id, 'RBX123456');
  const model = getParam(params.type, 'Mini S');
  const manufacturer = getParam(params.manufacturer, '');
  const device: Device = JSON.parse(getParam(params.device, '{}'));
  const address: string = (device.connectionProps as BLEConnectionProps)?.address ?? '';
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const battery = '85%';
  const gps = 'Good';
  console.log('device', device);
  const navigation = useNavigation();
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      let subscription: Subscription | undefined;
      if (address) {
        subscription = container.ble.isBLEDeviceConnectedUseCase.execute(address).subscribe(setConnected);
      }
      return () => {
        if (subscription) subscription.unsubscribe();
      };
    }, [address])
  );

  const handleConnectToggle = async () => {
    setConnecting(true);
    try {
      if (connected) {
        const success = await container.ble.disconnectFromDeviceUseCase.execute(address);
        setConnected(!success); // confirm it works
      } else {
        const success = await container.ble.connectToBLEDeviceUseCase.execute(address);
        setConnected(success);
      }
    } catch {
      Alert.alert('Error', connected ? 'Failed to disconnect.' : 'Failed to connect.');
    } finally {
      setConnecting(false);
    }
  };

  const handleEditName = useCallback(() => {
    setEditName(deviceName);
    setEditModalVisible(true);
  }, [deviceName]);

  const handleSaveEditName = () => {
    setDeviceName(editName);
    setEditModalVisible(false);
    Alert.alert('Name updated', `Device name changed to: ${editName}`);
  };

  const handleDelete = async () => {
    try {
      const removed = await container.ble.disconnectAndRemoveBleDeviceUseCase.execute(device);
      if (removed) {
        Alert.alert('Device deleted', 'The device has been removed from your cache.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Not found', 'Device was not found in your cache.');
      }
    } catch {
      Alert.alert('Error', 'Failed to delete device.');
    }
  };

  const handleRecordingToggle = async () => {
    if (!connected) {
      Alert.alert('Not Connected', 'Please connect to the device first.');
      return;
    }

    setRecordingLoading(true);
    try {
      if (recording) {
        const result = await container.racebox.stopRecordingUseCase.execute(address);
        if (result) {
          setRecording(false);
          Alert.alert('Success', 'Recording stopped!');
        } else {
          Alert.alert('Error', 'Failed to stop recording.');
        }
      } else {
        const result = await container.racebox.startRecordingUseCase.execute(address);
        if (result) {
          setRecording(true);
          Alert.alert('Success', 'Recording started!');
        } else {
          Alert.alert('Error', 'Failed to start recording.');
        }
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${recording ? 'stop' : 'start'} recording: ${error}`);
    } finally {
      setRecordingLoading(false);
    }
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
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 48 }]}>
        {/* Device Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Name: <Text style={styles.infoValue}>{device.label}</Text></Text>
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
          <TouchableOpacity
            style={[styles.actionButton, styles.fullWidthButton, connected ? styles.disconnect : styles.connect]}
            onPress={handleConnectToggle}
            disabled={connecting}
          >
            <Ionicons name={connected ? 'close-circle-outline' : 'link-outline'} size={20} color="#fff" />
            <Text style={styles.actionButtonText}>{connecting ? (connected ? 'Disconnecting...' : 'Connecting...') : (connected ? 'Disconnect' : 'Connect')}</Text>
          </TouchableOpacity>
        </View>

        {/* Standalone Recording Section - vertical buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Standalone Recording</Text>
          <View style={styles.verticalButtonStack}>
            <TouchableOpacity style={[styles.actionButton, styles.primary]} onPress={handleRecordingToggle} disabled={recordingLoading}>
              <Ionicons name={recording ? 'stop-circle-outline' : 'play-circle-outline'} size={20} color="#fff" />
              <Text style={styles.actionButtonText}>
                {recordingLoading 
                  ? (recording ? 'Stopping...' : 'Starting...') 
                  : (recording ? 'Stop Recording' : 'Start Recording')
                }
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push({
              pathname: '/devices/racebox/RaceBoxStandaloneRecordingConfigScreen',
              params: { device: JSON.stringify(device) }
            })}>
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

        {/* Delete button at the bottom */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Device</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>Edit Device Name</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter device name"
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEditName}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  bottomButtonContainer: {
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 32, // Add extra bottom padding
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 340,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#2196f3',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#bbb',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalLabel: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#222',
  },
}); 