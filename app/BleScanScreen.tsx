import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function BleScanScreen() {
  const colorScheme = useColorScheme();
  const { advertisedName } = useLocalSearchParams<{ advertisedName: string }>();

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}> 
      <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].tint }]}>Find Your Device</Text>
      <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>Scanning for BLE devices...</Text>
      <View style={styles.infoBox}>
        <Text style={[styles.infoLabel, { color: Colors[colorScheme ?? 'light'].tint }]}>Looking for:</Text>
        <Text style={[styles.infoValue, { color: Colors[colorScheme ?? 'light'].text }]}>{advertisedName}</Text>
      </View>
      {/* Add BLE scan animation or progress indicator here in the future */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  infoBox: {
    backgroundColor: '#e3f0fa',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 12,
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
  },
  infoValue: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
}); 