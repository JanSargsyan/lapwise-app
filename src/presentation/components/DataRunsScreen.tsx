import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button, Alert, Modal, ScrollView } from 'react-native';
import { useDataRecording } from '../hooks/useDataRecording';
import { DataRun, CacheEntry } from '../../infrastructure/caching/ICacheRepository';

export default function DataRunsScreen() {
  const {
    dataRuns,
    activeRuns,
    storageSize,
    error,
    deleteDataRun,
    clearAllData,
    clearError,
    getDataRun,
    getCacheEntries,
    getCacheEntryCount,
  } = useDataRecording();

  const [selectedRun, setSelectedRun] = useState<DataRun | null>(null);
  const [runDetails, setRunDetails] = useState<{
    run: DataRun;
    entries: CacheEntry[];
    entryCount: number;
  } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const loadRunDetails = async (run: DataRun) => {
    try {
      const [entries, entryCount] = await Promise.all([
        getCacheEntries(run.id, 100), // Get last 100 entries
        getCacheEntryCount(run.id),
      ]);
      
      setRunDetails({
        run,
        entries,
        entryCount,
      });
      setShowDetailsModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load run details');
    }
  };

  const formatDuration = (milliseconds?: number): string => {
    if (!milliseconds) return 'N/A';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString();
  };

  const renderDataRun = ({ item: run }: { item: DataRun }) => {
    const isActive = run.isActive;
    const duration = formatDuration(run.totalDuration);
    const startTime = formatDate(run.startTime);
    const endTime = run.endTime ? formatDate(run.endTime) : 'Active';

    return (
      <View style={[styles.runItem, isActive && styles.activeRunItem]}>
        <View style={styles.runHeader}>
          <Text style={styles.runName}>{run.name}</Text>
          <View style={styles.runBadges}>
            {isActive && <Text style={styles.activeBadge}>ACTIVE</Text>}
            <Text style={styles.entryCountBadge}>{run.entryCount} entries</Text>
          </View>
        </View>
        
        <Text style={styles.runDevice}>Device: {run.deviceName}</Text>
        <Text style={styles.runTime}>Started: {startTime}</Text>
        <Text style={styles.runTime}>Ended: {endTime}</Text>
        <Text style={styles.runDuration}>Duration: {duration}</Text>
        
        <View style={styles.runActions}>
          <Button
            title="View Details"
            onPress={() => loadRunDetails(run)}
            color="#007AFF"
          />
          <Button
            title="Delete"
            onPress={() => {
              Alert.alert(
                'Delete Run',
                `Are you sure you want to delete "${run.name}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => deleteDataRun(run.id) },
                ]
              );
            }}
            color="#FF3B30"
          />
        </View>
      </View>
    );
  };

  const renderCacheEntry = ({ item: entry }: { item: CacheEntry }) => {
    const timestamp = formatDate(entry.timestamp);
    const data = entry.data;
    
    return (
      <View style={styles.entryItem}>
        <Text style={styles.entryTimestamp}>{timestamp}</Text>
        {data.location && (
          <Text style={styles.entryData}>
            📍 {data.location.latitude.toFixed(6)}, {data.location.longitude.toFixed(6)}
          </Text>
        )}
        {data.motion && (
          <Text style={styles.entryData}>
            🚗 {data.motion.gForce.toFixed(2)}g
          </Text>
        )}
        {data.rawData && (
          <Text style={styles.entryData}>
            📊 Raw: {data.rawData.substring(0, 50)}...
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Data Runs</Text>
        <Text style={styles.subtitle}>
          {dataRuns.length} runs • {(storageSize / 1024).toFixed(1)} KB
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Clear Error" onPress={clearError} />
        </View>
      )}

      <FlatList
        data={[
          ...(activeRuns.length > 0 ? [
            { type: 'header', title: `Active Runs (${activeRuns.length})`, data: activeRuns }
          ] : []),
          { type: 'header', title: `All Runs (${dataRuns.length})`, data: dataRuns }
        ] as Array<{ type: 'header'; title: string; data: DataRun[] }>}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{item.title}</Text>
                {item.data.map((run: DataRun) => (
                  <View key={run.id}>
                    {renderDataRun({ item: run })}
                  </View>
                ))}
              </View>
            );
          }
          return null;
        }}
        keyExtractor={(item, index) => `section-${index}`}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
      />

      <Modal
        visible={showDetailsModal}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {runDetails?.run.name}
            </Text>
            <Button
              title="Close"
              onPress={() => setShowDetailsModal(false)}
              color="#007AFF"
            />
          </View>
          
          {runDetails && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.runSummary}>
                <Text style={styles.summaryText}>
                  Device: {runDetails.run.deviceName}
                </Text>
                <Text style={styles.summaryText}>
                  Entries: {runDetails.entryCount}
                </Text>
                <Text style={styles.summaryText}>
                  Duration: {formatDuration(runDetails.run.totalDuration)}
                </Text>
                <Text style={styles.summaryText}>
                  Started: {formatDate(runDetails.run.startTime)}
                </Text>
                {runDetails.run.endTime && (
                  <Text style={styles.summaryText}>
                    Ended: {formatDate(runDetails.run.endTime)}
                  </Text>
                )}
              </View>
              
              <Text style={styles.entriesTitle}>Recent Entries ({runDetails.entries.length})</Text>
              <FlatList
                data={runDetails.entries}
                renderItem={renderCacheEntry}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
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
  runItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeRunItem: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  runName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  runBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  activeBadge: {
    fontSize: 10,
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontWeight: 'bold',
  },
  entryCountBadge: {
    fontSize: 10,
    color: '#007AFF',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  runDevice: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  runTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  runDuration: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  runActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  runSummary: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  entriesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  entryItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  entryTimestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  entryData: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
}); 