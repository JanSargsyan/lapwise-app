import { useState, useEffect, useCallback } from 'react';
import { DataRun, CacheEntry } from '../../infrastructure/caching/ICacheRepository';
import { DataRecordingUseCases } from '../../application/use-cases/DataRecordingUseCases';
import { Container } from '../../infrastructure/di/Container';
import { DeviceData } from '../../domain/entities/Device';

export interface UseDataRecordingReturn {
  // State
  dataRuns: DataRun[];
  activeRuns: DataRun[];
  isRecording: (deviceId: string) => boolean;
  storageSize: number;
  error: string | null;
  
  // Actions
  startRecording: (deviceId: string, deviceName: string, runName?: string) => Promise<DataRun>;
  stopRecording: (deviceId: string) => Promise<DataRun>;
  recordDataPoint: (deviceId: string, data: DeviceData) => Promise<CacheEntry | null>;
  deleteDataRun: (runId: string) => Promise<void>;
  clearAllData: () => Promise<void>;
  clearError: () => void;
  
  // Data access
  getDataRun: (runId: string) => Promise<DataRun | null>;
  getCacheEntries: (runId: string, limit?: number, offset?: number) => Promise<CacheEntry[]>;
  getCacheEntryCount: (runId: string) => Promise<number>;
}

export function useDataRecording(): UseDataRecordingReturn {
  const [dataRuns, setDataRuns] = useState<DataRun[]>([]);
  const [activeRuns, setActiveRuns] = useState<DataRun[]>([]);
  const [storageSize, setStorageSize] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const container = Container.getInstance();
  const dataRecordingUseCases = container.getDataRecordingUseCases();

  const loadDataRuns = useCallback(async () => {
    try {
      const runs = await dataRecordingUseCases.getAllDataRuns();
      setDataRuns(runs);
      
      const active = dataRecordingUseCases.getActiveRuns();
      setActiveRuns(active);
      
      const size = await dataRecordingUseCases.getStorageSize();
      setStorageSize(size);
    } catch (err: any) {
      setError(err.message || 'Failed to load data runs');
    }
  }, [dataRecordingUseCases]);

  useEffect(() => {
    loadDataRuns();
  }, [loadDataRuns]);

  // Poll for active runs updates
  useEffect(() => {
    const pollActiveRuns = async () => {
      try {
        const active = dataRecordingUseCases.getActiveRuns();
        setActiveRuns(active);
      } catch (err) {
        console.error('Error polling active runs:', err);
      }
    };

    const interval = setInterval(pollActiveRuns, 2000); // Poll every 2 seconds instead of 1
    return () => clearInterval(interval);
  }, [dataRecordingUseCases]);

  const startRecording = useCallback(async (deviceId: string, deviceName: string, runName?: string): Promise<DataRun> => {
    try {
      setError(null);
      console.log('🔧 useDataRecording: Starting recording for device:', deviceId, 'Name:', deviceName);
      const run = await dataRecordingUseCases.startRecording(deviceId, deviceName, runName);
      
      // Immediately update the active runs state
      setActiveRuns(prev => {
        const newActiveRuns = [...prev, run];
        console.log('🔧 useDataRecording: Updated active runs:', newActiveRuns.map(r => ({ id: r.id, deviceId: r.deviceId, isActive: r.isActive })));
        return newActiveRuns;
      });
      
      // Refresh the full list
      await loadDataRuns();
      console.log('🔧 useDataRecording: Recording started successfully for device:', deviceId, 'Run ID:', run.id);
      return run;
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      throw err;
    }
  }, [dataRecordingUseCases, loadDataRuns]);

  const stopRecording = useCallback(async (deviceId: string): Promise<DataRun> => {
    try {
      setError(null);
      const run = await dataRecordingUseCases.stopRecording(deviceId);
      
      // Immediately remove from active runs
      setActiveRuns(prev => prev.filter(r => r.deviceId !== deviceId));
      
      // Refresh the full list
      await loadDataRuns();
      return run;
    } catch (err: any) {
      setError(err.message || 'Failed to stop recording');
      throw err;
    }
  }, [dataRecordingUseCases, loadDataRuns]);

  const recordDataPoint = useCallback(async (deviceId: string, data: DeviceData): Promise<CacheEntry | null> => {
    try {
      return await dataRecordingUseCases.recordDataPoint(deviceId, data);
    } catch (err: any) {
      console.warn('Failed to record data point:', err);
      return null;
    }
  }, [dataRecordingUseCases]);

  const deleteDataRun = useCallback(async (runId: string): Promise<void> => {
    try {
      setError(null);
      await dataRecordingUseCases.deleteDataRun(runId);
      await loadDataRuns(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to delete data run');
    }
  }, [dataRecordingUseCases, loadDataRuns]);

  const clearAllData = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await dataRecordingUseCases.clearAllData();
      await loadDataRuns(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to clear all data');
    }
  }, [dataRecordingUseCases, loadDataRuns]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isRecording = useCallback((deviceId: string): boolean => {
    // Check both the state and the use case directly for more reliable results
    const stateCheck = activeRuns.some(run => run.deviceId === deviceId && run.isActive);
    const useCaseCheck = dataRecordingUseCases.isRecording(deviceId);
    console.log('🔧 useDataRecording: isRecording check for device:', deviceId, 'State:', stateCheck, 'UseCase:', useCaseCheck);
    return stateCheck || useCaseCheck;
  }, [activeRuns, dataRecordingUseCases]);

  const getDataRun = useCallback(async (runId: string): Promise<DataRun | null> => {
    return await dataRecordingUseCases.getDataRun(runId);
  }, [dataRecordingUseCases]);

  const getCacheEntries = useCallback(async (runId: string, limit?: number, offset?: number): Promise<CacheEntry[]> => {
    return await dataRecordingUseCases.getCacheEntries(runId, limit, offset);
  }, [dataRecordingUseCases]);

  const getCacheEntryCount = useCallback(async (runId: string): Promise<number> => {
    return await dataRecordingUseCases.getCacheEntryCount(runId);
  }, [dataRecordingUseCases]);

  return {
    dataRuns,
    activeRuns,
    isRecording,
    storageSize,
    error,
    startRecording,
    stopRecording,
    recordDataPoint,
    deleteDataRun,
    clearAllData,
    clearError,
    getDataRun,
    getCacheEntries,
    getCacheEntryCount,
  };
} 