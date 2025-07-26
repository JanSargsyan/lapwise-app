import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Switch, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { DataRate } from '@/src/domain/model/racebox/DataRate';
import { RecordingFlags } from '@/src/domain/model/racebox/RecordingFlags';
import { RecordingConfig } from '@/src/domain/model/racebox/RecordingConfig';
import { Device } from '@/src/domain/model/device/Device';
import { BLEConnectionProps } from '@/src/domain/model/device/ConnectionType';
import { container } from '@/src/application/di';

const DATA_RATE_LABELS = {
  [DataRate.Hz25]: '25 Hz',
  [DataRate.Hz20]: '20 Hz',
  [DataRate.Hz10]: '10 Hz',
  [DataRate.Hz5]: '5 Hz',
  [DataRate.Hz1]: '1 Hz',
};

export default function RaceBoxStandaloneRecordingConfigScreen() {
  const params = useLocalSearchParams();
  const device: Device = useMemo(
    () => JSON.parse(params.device as string || '{}'),
    [params.device]
  );
  
  const [config, setConfig] = useState<RecordingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const address = (device.connectionProps as BLEConnectionProps)?.address || '';
      const loaded = await container.racebox.readRecordingConfigUseCase.execute(address);
      setConfig(loaded);
      setLoading(false);
    })();
  }, [device]);

  const update = (patch: Partial<RecordingConfig>) => {
    setConfig(prev => prev ? { ...prev, ...patch } : prev);
  };

  const updateFlags = (patch: Partial<RecordingFlags>) => {
    setConfig(prev => prev ? { ...prev, flags: { ...prev.flags, ...patch } } : prev);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    const address = (device.connectionProps as BLEConnectionProps)?.address || '';
    const result = await container.racebox.setRecordingConfigUseCase.execute(address, config);
    setSaving(false);
    if (result) {
      Alert.alert('Success', 'Recording config saved!');
    } else {
      Alert.alert('Error', 'Failed to save config.');
    }
  };

  if (loading || !config) return <Text style={{margin: 24}}>Loading...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Standalone Recording Config</Text>
      <Text style={styles.subtitle}>{device.label || 'RaceBox Device'}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Data Rate</Text>
        <View style={styles.pickerRow}>
          {Object.values(DataRate).filter(v => typeof v === 'number').map((rate) => (
            <Button
              key={rate as number}
              title={DATA_RATE_LABELS[rate as DataRate]}
              onPress={() => update({ dataRate: rate as DataRate })}
              color={config.dataRate === rate ? '#2196f3' : undefined}
            />
          ))}
        </View>
      </View>
      <Text style={styles.section}>Flags</Text>
      {Object.entries(config.flags).map(([key, value]) => (
        <View style={styles.row} key={key}>
          <Text style={styles.label}>{key}</Text>
          <Switch value={value} onValueChange={v => updateFlags({ [key]: v })} />
        </View>
      ))}
      <Text style={styles.section}>Thresholds & Intervals</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Stationary Speed Threshold</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(config.stationarySpeedThreshold)}
          onChangeText={v => update({ stationarySpeedThreshold: Number(v) })}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Stationary Detection Interval</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(config.stationaryDetectionInterval)}
          onChangeText={v => update({ stationaryDetectionInterval: Number(v) })}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>No Fix Detection Interval</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(config.noFixDetectionInterval)}
          onChangeText={v => update({ noFixDetectionInterval: Number(v) })}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Auto Shutdown Interval</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(config.autoShutdownInterval)}
          onChangeText={v => update({ autoShutdownInterval: Number(v) })}
        />
      </View>
      <Button title={saving ? 'Saving...' : 'Save Config'} onPress={handleSave} disabled={saving} />
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f7f7fa',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2196f3',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 18,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 8,
    color: '#555',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#2196f3',
    borderRadius: 8,
    padding: 8,
    minWidth: 60,
    textAlign: 'right',
    backgroundColor: '#fff',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    flex: 2,
    justifyContent: 'flex-end',
  },
}); 