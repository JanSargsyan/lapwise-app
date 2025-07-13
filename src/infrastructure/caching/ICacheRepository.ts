import { DeviceData } from '../../domain/entities/Device';

export interface CacheEntry {
  id: string;
  deviceId: string;
  timestamp: Date;
  data: DeviceData;
}

export interface DataRun {
  id: string;
  name: string;
  deviceId: string;
  deviceName: string;
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  entryCount: number;
  totalDuration?: number; // in milliseconds
}

export interface ICacheRepository {
  // Data run management
  createDataRun(deviceId: string, deviceName: string, name?: string): Promise<DataRun>;
  updateDataRun(id: string, updates: Partial<DataRun>): Promise<DataRun>;
  getDataRun(id: string): Promise<DataRun | null>;
  getAllDataRuns(): Promise<DataRun[]>;
  deleteDataRun(id: string): Promise<void>;
  
  // Cache entry management
  addCacheEntry(runId: string, deviceId: string, data: DeviceData): Promise<CacheEntry>;
  getCacheEntries(runId: string, limit?: number, offset?: number): Promise<CacheEntry[]>;
  getCacheEntryCount(runId: string): Promise<number>;
  deleteCacheEntries(runId: string): Promise<void>;
  
  // Utility methods
  clearAll(): Promise<void>;
  getStorageSize(): Promise<number>;
} 