import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { DeviceCatalog } from '@/src/domain/model/device/DeviceCatalog';
import { useNavigation, useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const devices = Object.values(DeviceCatalog).filter(device => device.id !== 'phone');
const manufacturers = Array.from(new Set(devices.map(d => d.manufacturer).filter(Boolean)));

export default function AddDevicePage() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const router = useRouter();
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Add Device',
      headerLeft: undefined, // Remove back button
    });
  }, [navigation]);

  // Step tab bar
  const StepTabs = () => (
    <View style={styles.stepTabsWrapper}>
      <View style={styles.stepTabsContainer}>
        <TouchableOpacity
          style={[styles.stepTab, step === 1 && styles.stepTabActive]}
          onPress={() => setStep(1)}
          activeOpacity={step === 1 ? 1 : 0.7}
        >
          <Text style={[styles.stepTabText, step === 1 && styles.stepTabTextActive]}>1. Manufacturer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.stepTab,
            step === 2 && styles.stepTabActive,
            !selectedManufacturer && styles.stepTabDisabled,
          ]}
          onPress={() => {
            if (selectedManufacturer) setStep(2);
          }}
          activeOpacity={selectedManufacturer ? 0.7 : 1}
          disabled={!selectedManufacturer}
        >
          <Text style={[styles.stepTabText, step === 2 && styles.stepTabTextActive, !selectedManufacturer && styles.stepTabTextDisabled]}>2. Device</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabDivider} />
    </View>
  );

  // Step 1: Select manufacturer
  if (step === 1) {
    return (
      <View style={[styles.safeArea, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}> 
        <StepTabs />
        <FlatList
          data={manufacturers}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.manufacturerRow,
                selectedManufacturer === item && styles.manufacturerRowSelected,
              ]}
              onPress={() => {
                setSelectedManufacturer(item);
                setStep(2);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.manufacturerName,
                  selectedManufacturer === item && styles.manufacturerNameSelected,
                ]}
              >
                {item}
              </Text>
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
      <StepTabs />
      <FlatList
        data={filteredDevices}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.deviceRow, index === filteredDevices.length - 1 && styles.deviceRowLast]}
            onPress={() => {
              if (item.connectionType === 'BLE') {
                router.push({ pathname: '/devices/AddBleDeviceScreen', params: { device: JSON.stringify(item) } });
              }
              if (item.connectionType === 'WiFi') {
                router.push({ pathname: '/devices/AddWifiDeviceScreen', params: { device: JSON.stringify(item) } });
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.deviceName}>{item.label}</Text>
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
  stepTabsWrapper: {
    backgroundColor: '#f7f7fa',
    paddingTop: 8,
    paddingBottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  stepTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 0,
    marginTop: 0,
    gap: 8,
  },
  stepTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    minWidth: 120,
    shadowColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  stepTabActive: {
    borderBottomColor: '#2196f3',
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
  },
  stepTabDisabled: {
    backgroundColor: 'transparent',
  },
  stepTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.2,
  },
  stepTabTextActive: {
    color: '#2196f3',
  },
  stepTabTextDisabled: {
    color: '#bbb',
  },
  tabDivider: {
    height: 1.5,
    backgroundColor: '#e0e0e0',
    marginTop: 0,
    marginBottom: 0,
    marginHorizontal: 12,
    borderRadius: 1,
  },
  deviceList: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  manufacturerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'transparent',
  },
  manufacturerRowSelected: {
    backgroundColor: '#e3f0fa',
  },
  manufacturerName: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  manufacturerNameSelected: {
    color: '#2196f3',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: 'transparent',
  },
  deviceRowLast: {
    borderBottomWidth: 0,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.2,
    color: '#222',
  },
}); 