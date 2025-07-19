import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SessionsScreen() {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
        Sessions
      </Text>
      <Text style={[styles.subtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
        View your recorded sessions and data runs
      </Text>
      
      <ScrollView style={styles.content}>
        <View style={[styles.sessionCard, { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].text }]}>
          <Text style={[styles.sessionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            No sessions recorded yet
          </Text>
          <Text style={[styles.sessionSubtitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Connect to a device and start recording to see your sessions here
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
  sessionCard: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sessionSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
}); 