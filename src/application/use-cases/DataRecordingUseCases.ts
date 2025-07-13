import { ICacheRepository, DataRun, CacheEntry } from '../../infrastructure/caching/ICacheRepository';
import { DeviceData } from '../../domain/entities/Device';

export class DataRecordingUseCases {
  private cacheRepository: ICacheRepository;
  private activeRuns: Map<string, DataRun> = new Map();

  constructor(cacheRepository: ICacheRepository) {
    this.cacheRepository = cacheRepository;
  }

  async startRecording(deviceId: string, deviceName: string, runName?: string): Promise<DataRun> {
    // Check if there's already an active run for this device
    const existingRun = this.activeRuns.get(deviceId);
    if (existingRun) {
      throw new Error(`Already recording for device ${deviceName}. Stop the current recording first.`);
    }

    // Also check database for any existing active runs
    const allRuns = await this.cacheRepository.getAllDataRuns();
    const existingDbRun = allRuns.find(run => run.deviceId === deviceId && run.isActive);
    if (existingDbRun) {
      // Clean up the existing run first
      await this.cacheRepository.updateDataRun(existingDbRun.id, {
        endTime: new Date(),
        isActive: false,
      });
    }

    const dataRun = await this.cacheRepository.createDataRun(deviceId, deviceName, runName);
    this.activeRuns.set(deviceId, dataRun);
    
    console.log('🔧 DataRecordingUseCases: Started recording for device:', deviceId, 'Run ID:', dataRun.id);
    return dataRun;
  }

  async stopRecording(deviceId: string): Promise<DataRun> {
    const activeRun = this.activeRuns.get(deviceId);
    if (!activeRun) {
      // Check database for active runs
      const allRuns = await this.cacheRepository.getAllDataRuns();
      const dbActiveRun = allRuns.find(run => run.deviceId === deviceId && run.isActive);
      if (!dbActiveRun) {
        throw new Error(`No active recording found for device ${deviceId}`);
      }
      
      // Update the database run
      const updatedRun = await this.cacheRepository.updateDataRun(dbActiveRun.id, {
        endTime: new Date(),
        isActive: false,
      });
      
      console.log('🔧 DataRecordingUseCases: Stopped recording for device:', deviceId, 'Run ID:', dbActiveRun.id);
      return updatedRun;
    }

    const updatedRun = await this.cacheRepository.updateDataRun(activeRun.id, {
      endTime: new Date(),
      isActive: false,
    });

    this.activeRuns.delete(deviceId);
    
    console.log('🔧 DataRecordingUseCases: Stopped recording for device:', deviceId, 'Run ID:', activeRun.id);
    return updatedRun;
  }

  async recordDataPoint(deviceId: string, data: DeviceData): Promise<CacheEntry | null> {
    const activeRun = this.activeRuns.get(deviceId);
    if (!activeRun) {
      console.log('🔧 DataRecordingUseCases: No active recording for device:', deviceId);
      return null;
    }

    try {
      console.log('🔧 DataRecordingUseCases: Recording data point for device:', deviceId, 'Run:', activeRun.id, 'Data:', data);
      const entry = await this.cacheRepository.addCacheEntry(activeRun.id, deviceId, data);
      console.log('🔧 DataRecordingUseCases: Recorded data point for run:', activeRun.id, 'Device:', deviceId, 'Entry ID:', entry?.id);
      return entry;
    } catch (error) {
      console.error('🔧 DataRecordingUseCases: Error recording data point:', error);
      return null;
    }
  }

  async getActiveRunForDevice(deviceId: string): Promise<DataRun | null> {
    // First check in-memory active runs
    const inMemoryRun = this.activeRuns.get(deviceId);
    if (inMemoryRun) {
      return inMemoryRun;
    }

    // Check database for active runs
    const allRuns = await this.cacheRepository.getAllDataRuns();
    const activeRun = allRuns.find(run => run.deviceId === deviceId && run.isActive);
    
    if (activeRun) {
      this.activeRuns.set(deviceId, activeRun);
    }
    
    return activeRun || null;
  }

  async getAllDataRuns(): Promise<DataRun[]> {
    return await this.cacheRepository.getAllDataRuns();
  }

  async getDataRun(id: string): Promise<DataRun | null> {
    return await this.cacheRepository.getDataRun(id);
  }

  async deleteDataRun(id: string): Promise<void> {
    const run = await this.cacheRepository.getDataRun(id);
    if (run && run.isActive) {
      this.activeRuns.delete(run.deviceId);
    }
    
    await this.cacheRepository.deleteDataRun(id);
    console.log('🔧 DataRecordingUseCases: Deleted data run:', id);
  }

  async getCacheEntries(runId: string, limit?: number, offset?: number): Promise<CacheEntry[]> {
    return await this.cacheRepository.getCacheEntries(runId, limit, offset);
  }

  async getCacheEntryCount(runId: string): Promise<number> {
    return await this.cacheRepository.getCacheEntryCount(runId);
  }

  async clearAllData(): Promise<void> {
    this.activeRuns.clear();
    await this.cacheRepository.clearAll();
    console.log('🔧 DataRecordingUseCases: Cleared all data');
  }

  async getStorageSize(): Promise<number> {
    return await this.cacheRepository.getStorageSize();
  }

  isRecording(deviceId: string): boolean {
    const isRecording = this.activeRuns.has(deviceId);
    console.log('🔧 DataRecordingUseCases.isRecording: Device:', deviceId, 'IsRecording:', isRecording, 'ActiveRuns:', Array.from(this.activeRuns.keys()));
    return isRecording;
  }

  async isRecordingAsync(deviceId: string): Promise<boolean> {
    // Check in-memory first
    if (this.activeRuns.has(deviceId)) {
      return true;
    }
    
    // Check database as fallback
    const allRuns = await this.cacheRepository.getAllDataRuns();
    const activeRun = allRuns.find(run => run.deviceId === deviceId && run.isActive);
    return !!activeRun;
  }

  getActiveRuns(): DataRun[] {
    return Array.from(this.activeRuns.values());
  }
} 