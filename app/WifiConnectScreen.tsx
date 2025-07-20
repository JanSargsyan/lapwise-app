import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function WifiConnectScreen() {
  const colorScheme = useColorScheme();
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}> 
      <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].tint }]}>Connect to WiFi Device</Text>
      <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>Enter your WiFi credentials</Text>
      <View style={styles.form}>
        <Text style={styles.label}>WiFi Name</Text>
        <TextInput
          style={[styles.input, { color: Colors[colorScheme ?? 'light'].text, borderColor: Colors[colorScheme ?? 'light'].tint }]}
          placeholder="WiFi Name"
          placeholderTextColor="#aaa"
          value={wifiName}
          onChangeText={setWifiName}
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, { color: Colors[colorScheme ?? 'light'].text, borderColor: Colors[colorScheme ?? 'light'].tint }]}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={wifiPassword}
          onChangeText={setWifiPassword}
          secureTextEntry
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
          <Text style={styles.buttonText}>Connect</Text>
        </TouchableOpacity>
      </View>
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
  form: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#f7f7fa',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#2196f3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
    letterSpacing: 0.1,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
}); 