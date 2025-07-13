import AsyncStorage from '@react-native-async-storage/async-storage';
import { ICacheRepository, CacheEntry, DataRun } from './ICacheRepository';
import { DeviceData } from '../../domain/entities/Device';

export class AsyncStorageCacheRepository implements ICacheRepository {
  private readonly RUNS_KEY = 'data_runs';
  private readonly ENTRIES_PREFIX = 'cache_entries_';

  async createDataRun(deviceId: string, deviceName: string, name?: string): Promise<DataRun> {
    const runs = await this.getAllDataRuns();
    const newRun: DataRun = {
      id: this.generateId(),
      name: name || `Run ${new Date().toLocaleString()}`,
      deviceId,
      deviceName,
      startTime: new Date(),
      isActive: true,
      entryCount: 0,
    };
    
    runs.push(newRun);
    await AsyncStorage.setItem(this.RUNS_KEY, JSON.stringify(runs));
    
    console.log('🔧 CacheRepository: Created data run:', newRun.id);
    return newRun;
  }

  async updateDataRun(id: string, updates: Partial<DataRun>): Promise<DataRun> {
    const runs = await this.getAllDataRuns();
    const runIndex = runs.findIndex(run => run.id === id);
    
    if (runIndex === -1) {
      throw new Error(`Data run with id ${id} not found`);
    }
    
    const updatedRun = { ...runs[runIndex], ...updates };
    
    // Calculate total duration if run is ending
    if (updates.endTime && !runs[runIndex].endTime) {
      updatedRun.totalDuration = updatedRun.endTime!.getTime() - runs[runIndex].startTime.getTime();
    }
    
    runs[runIndex] = updatedRun;
    await AsyncStorage.setItem(this.RUNS_KEY, JSON.stringify(runs));
    
    console.log('🔧 CacheRepository: Updated data run:', id);
    return updatedRun;
  }

  async getDataRun(id: string): Promise<DataRun | null> {
    const runs = await this.getAllDataRuns();
    return runs.find(run => run.id === id) || null;
  }

  async getAllDataRuns(): Promise<DataRun[]> {
    try {
      const data = await AsyncStorage.getItem(this.RUNS_KEY);
      if (!data) return [];
      
      const runs = JSON.parse(data);
      // Convert string dates back to Date objects
      return runs.map((run: any) => ({
        ...run,
        startTime: new Date(run.startTime),
        endTime: run.endTime ? new Date(run.endTime) : undefined,
      }));
    } catch (error) {
      console.warn('🔧 CacheRepository: Error loading data runs:', error);
      return [];
    }
  }

  async deleteDataRun(id: string): Promise<void> {
    const runs = await this.getAllDataRuns();
    const filteredRuns = runs.filter(run => run.id !== id);
    await AsyncStorage.setItem(this.RUNS_KEY, JSON.stringify(filteredRuns));
    
    // Also delete all cache entries for this run
    await this.deleteCacheEntries(id);
    
    console.log('🔧 CacheRepository: Deleted data run:', id);
  }

  async addCacheEntry(runId: string, deviceId: string, data: DeviceData): Promise<CacheEntry> {
    console.log('🔧 CacheRepository: Adding cache entry for run:', runId, 'Device:', deviceId, 'Data:', data);
    
    const entry: CacheEntry = {
      id: this.generateId(),
      deviceId,
      timestamp: new Date(),
      data,
    };
    
    const entries = await this.getCacheEntries(runId);
    entries.push(entry);
    
    // Store entries (limit to last 1000 entries to prevent memory issues)
    const limitedEntries = entries.slice(-1000);
    await AsyncStorage.setItem(
      `${this.ENTRIES_PREFIX}${runId}`,
      JSON.stringify(limitedEntries)
    );
    
    // Update run entry count
    const run = await this.getDataRun(runId);
    if (run) {
      await this.updateDataRun(runId, { entryCount: limitedEntries.length });
    }
    
    console.log('🔧 CacheRepository: Added cache entry for run:', runId, 'Entry ID:', entry.id, 'Total entries:', limitedEntries.length);
    return entry;
  }

  async getCacheEntries(runId: string, limit?: number, offset?: number): Promise<CacheEntry[]> {
    try {
      const data = await AsyncStorage.getItem(`${this.ENTRIES_PREFIX}${runId}`);
      if (!data) return [];
      
      const entries = JSON.parse(data);
      // Convert string dates back to Date objects
      const parsedEntries = entries.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
        data: {
          ...entry.data,
          timestamp: new Date(entry.data.timestamp),
        },
      }));
      
      if (offset !== undefined && limit !== undefined) {
        return parsedEntries.slice(offset, offset + limit);
      } else if (limit !== undefined) {
        return parsedEntries.slice(-limit);
      }
      
      return parsedEntries;
    } catch (error) {
      console.warn('🔧 CacheRepository: Error loading cache entries:', error);
      return [];
    }
  }

  async getCacheEntryCount(runId: string): Promise<number> {
    const entries = await this.getCacheEntries(runId);
    return entries.length;
  }

  async deleteCacheEntries(runId: string): Promise<void> {
    await AsyncStorage.removeItem(`${this.ENTRIES_PREFIX}${runId}`);
    console.log('🔧 CacheRepository: Deleted cache entries for run:', runId);
  }

  async clearAll(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key: string) => 
      key === this.RUNS_KEY || key.startsWith(this.ENTRIES_PREFIX)
    );
    await AsyncStorage.multiRemove(cacheKeys);
    console.log('🔧 CacheRepository: Cleared all cache data');
  }

  async getStorageSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key: string) => 
        key === this.RUNS_KEY || key.startsWith(this.ENTRIES_PREFIX)
      );
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += new Blob([data]).size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.warn('🔧 CacheRepository: Error calculating storage size:', error);
      return 0;
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
} 