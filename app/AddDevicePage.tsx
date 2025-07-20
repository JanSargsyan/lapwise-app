import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { DeviceCatalog } from '@/src/domain/model/device/DeviceCatalog';
import { useNavigation } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const devices = Object.values(DeviceCatalog).filter(device => device.id !== 'phone');
const manufacturers = Array.from(new Set(devices.map(d => d.manufacturer).filter(Boolean)));

export default function AddDevicePage() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: selectedManufacturer ? selectedManufacturer : 'Add Device',
      headerLeft: selectedManufacturer
        ? () => (
            <TouchableOpacity style={styles.backButton} onPress={() => setSelectedManufacturer(null)}>
              <Text style={[styles.backButtonText, { color: Colors[colorScheme ?? 'light'].tint }]}>Back</Text>
            </TouchableOpacity>
          )
        : undefined,
    });
  }, [navigation, selectedManufacturer, colorScheme]);

  // Step 1: Select manufacturer
  if (!selectedManufacturer) {
    return (
      <View style={[styles.safeArea, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}> 
        <Text style={[styles.stepTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Select Manufacturer</Text>
        <FlatList
          data={manufacturers}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.manufacturerCard, { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={() => setSelectedManufacturer(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.manufacturerName, { color: Colors[colorScheme ?? 'light'].text }]}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.deviceList}
        />
      </View>
    );
  }

  // Step 2: Select device from manufacturer
  const filteredDevices = devices.filter(d => d.manufacturer === selectedManufacturer);
  return (
    <View style={[styles.safeArea, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}> 
      <Text style={[styles.stepTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Select Device</Text>
      <FlatList
        data={filteredDevices}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.deviceCard, { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => { /* Add device logic will go here */ }}
            activeOpacity={0.7}
          >
            <View style={styles.deviceInfo}>
              <Text style={[styles.deviceName, { color: Colors[colorScheme ?? 'light'].text }]}>{item.label}</Text>
              <Text style={[styles.deviceType, { color: Colors[colorScheme ?? 'light'].tint }]}>{item.connectionType}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.deviceList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  deviceList: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  manufacturerCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  manufacturerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  deviceType: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 