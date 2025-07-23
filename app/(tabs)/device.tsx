import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { container } from '@/src/application/di';

const PHONE_DEVICE = {
  id: 'phone',
  name: 'Phone',
  type: 'Mobile',
  icon: <Ionicons name="phone-portrait" size={28} color="#2196f3" />,
  description: 'This device',
  permanent: true,
};

export default function DeviceScreen() {
  const colorScheme = useColorScheme();
  const navigation = useNavigation();
  const router = useRouter();
  const [cachedDevices, setCachedDevices] = useState<any[]>([]);

  useEffect(() => {
    container.cache.getCachedDevicesUseCase.execute().then(devices => {
      setCachedDevices(devices);
    });
  }, []);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Devices',
      headerRight: () => (
        <MaterialIcons
          name="add-circle-outline"
          size={28}
          color={Colors[colorScheme ?? 'light'].tint}
          style={{ marginRight: 12 }}
          onPress={() => router.push('/devices/AddDeviceScreen')}
        />
      ),
    });
  }, [navigation, colorScheme]);

  const renderDevice = ({ item }: { item: any }) => (
    <View style={[styles.deviceCard, { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].tint }]}> 
      <View style={styles.deviceIcon}>{item.icon}</View>
      <View style={styles.deviceInfo}>
        <Text style={[styles.deviceName, { color: Colors[colorScheme ?? 'light'].text }]}>{item.name}</Text>
        <Text style={[styles.deviceType, { color: Colors[colorScheme ?? 'light'].tint }]}>{item.type}</Text>
        <Text style={[styles.deviceDescription, { color: Colors[colorScheme ?? 'light'].text, opacity: 0.7 }]}>{item.description}</Text>
      </View>
      {item.permanent && (
        <View style={styles.permanentBadge}>
          <Text style={styles.permanentBadgeText}>Permanent</Text>
        </View>
      )}
    </View>
  );

  // Map cached devices to display format
  const mappedCachedDevices = cachedDevices.map(device => ({
    id: device.id,
    name: device.label || device.name || device.id,
    type: device.connectionType || 'Unknown',
    icon: <Ionicons name="hardware-chip-outline" size={28} color="#2196f3" />,
    description: device.manufacturer || '',
    permanent: false,
  }));

  const allDevices = [PHONE_DEVICE, ...mappedCachedDevices];

  return (
    <View style={[styles.safeArea, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}> 
      <FlatList
        data={allDevices}
        keyExtractor={item => item.id}
        renderItem={renderDevice}
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
  deviceIcon: {
    marginRight: 16,
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
  deviceDescription: {
    fontSize: 13,
    marginBottom: 2,
  },
  permanentBadge: {
    backgroundColor: '#2196f3',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  permanentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
}); 