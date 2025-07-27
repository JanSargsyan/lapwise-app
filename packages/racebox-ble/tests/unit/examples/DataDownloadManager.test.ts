import { Subject } from 'rxjs';
import { RaceBoxClientPort } from '../../../src/ports/primary/RaceBoxClientPort';
import { LiveDataMessage } from '../../../src/domain/entities/LiveDataMessage';
import { HistoryDataMessage } from '../../../src/domain/entities/HistoryDataMessage';
import { RaceBoxError } from '../../../src/domain/types/RaceBoxError';
import { Position } from '../../../src/domain/value-objects/Position';
import { GNSSStatus } from '../../../src/domain/value-objects/GNSSStatus';
import { MotionData } from '../../../src/domain/value-objects/MotionData';
import { DeviceInfo } from '../../../src/ports/primary/RaceBoxClientPort';
import { GNSSConfiguration } from '../../../src/domain/entities/GNSSConfiguration';
import { RecordingConfiguration } from '../../../src/domain/entities/RecordingConfiguration';
import { ConnectionState } from '../../../src/ports/primary/RaceBoxClientPort';

// Mock UI update functions
const mockUpdateProgressBar = jest.fn();
const mockProcessHistoricalData = jest.fn();
const mockSaveToFile = jest.fn();
const mockShowSuccessMessage = jest.fn();
const mockShowErrorMessage = jest.fn();

// Mock RaceBox client
class MockRaceBoxClient implements RaceBoxClientPort {
  public downloadProgress$ = new Subject<number>();
  public historyData$ = new Subject<HistoryDataMessage>();
  public liveData$ = new Subject<LiveDataMessage>();
  public position$ = new Subject<Position>();
  public motion$ = new Subject<MotionData>();
  public deviceState$ = new Subject<ConnectionState>();
  public recordingState$ = new Subject<any>();
  public recordingConfig$ = new Subject<RecordingConfiguration>();
  public allErrors$ = new Subject<RaceBoxError>();
  public gnssState$ = new Subject<GNSSStatus>();
  public connectionErrors$ = new Subject<RaceBoxError>();
  public protocolErrors$ = new Subject<RaceBoxError>();
  public deviceErrors$ = new Subject<RaceBoxError>();
  public deviceConfig$ = new Subject<DeviceInfo>();
  public gnssConfig$ = new Subject<GNSSConfiguration>();

  async startRecording(): Promise<void> {
    // Mock implementation
  }

  async configureRecording(_config: RecordingConfiguration): Promise<void> {
    // Mock implementation
  }

  async stopRecording(): Promise<void> {
    // Mock implementation
  }

  async pauseRecording(): Promise<void> {
    // Mock implementation
  }

  async downloadHistory(): Promise<HistoryDataMessage[]> {
    // Mock implementation
    return [];
  }

  async eraseMemory(): Promise<void> {
    // Mock implementation
  }

  async unlockMemory(_securityCode: number): Promise<void> {
    // Mock implementation
  }

  async getConnectionState(): Promise<ConnectionState> {
    // Mock implementation
    return { isConnected: true };
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    // Mock implementation
    return {
      id: 'test-device',
      name: 'Test Device',
      model: 'RaceBox Mini',
      serialNumber: '12345',
      firmwareVersion: '2.0',
      hardwareRevision: '1.0',
      manufacturer: 'RaceBox'
    };
  }

  async getRecordingStatus(): Promise<any> {
    // Mock implementation
    return {};
  }

  async getGNSSStatus(): Promise<GNSSStatus> {
    // Mock implementation
    return {
      fixStatus: 0,
      numSatellites: 0,
      pdop: 0,
      horizontalAccuracy: 0,
      verticalAccuracy: 0
    };
  }

  async getMemoryStatus(): Promise<any> {
    // Mock implementation
    return {};
  }

  async configureGNSS(_config: GNSSConfiguration): Promise<void> {
    // Mock implementation
  }

  isConnected(): boolean {
    return true;
  }

  getConfig(): any {
    return {};
  }

  updateConfig(_config: any): void {
    // Mock implementation
  }
}

describe('Data Download Manager Example', () => {
  let racebox: MockRaceBoxClient;

  beforeEach(() => {
    racebox = new MockRaceBoxClient();
    jest.clearAllMocks();
  });

  describe('Download Progress Monitoring', () => {
    it('should update progress bar when download progress changes', () => {
      // Monitor download progress
      racebox.downloadProgress$.subscribe(progress => {
        mockUpdateProgressBar(progress);
      });

      // Simulate progress updates
      racebox.downloadProgress$.next(0);
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(0);

      racebox.downloadProgress$.next(25);
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(25);

      racebox.downloadProgress$.next(50);
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(50);

      racebox.downloadProgress$.next(75);
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(75);

      racebox.downloadProgress$.next(100);
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(100);

      expect(mockUpdateProgressBar).toHaveBeenCalledTimes(5);
    });

    it('should handle progress updates in sequence', () => {
      const progressCalls: number[] = [];
      
      racebox.downloadProgress$.subscribe(progress => {
        progressCalls.push(progress);
        mockUpdateProgressBar(progress);
      });

      // Simulate realistic download progress
      const progressSequence = [0, 10, 25, 40, 60, 80, 90, 95, 100];
      
      progressSequence.forEach(progress => {
        racebox.downloadProgress$.next(progress);
      });

      expect(progressCalls).toEqual(progressSequence);
      expect(mockUpdateProgressBar).toHaveBeenCalledTimes(progressSequence.length);
    });

    it('should handle progress with decimal values', () => {
      racebox.downloadProgress$.subscribe(progress => {
        mockUpdateProgressBar(progress);
      });

      // Simulate progress with decimal values
      racebox.downloadProgress$.next(33.33);
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(33.33);

      racebox.downloadProgress$.next(66.67);
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(66.67);
    });
  });

  describe('Historical Data Processing', () => {
    it('should process historical data when received', () => {
      // Handle downloaded data
      racebox.historyData$.subscribe(data => {
        mockProcessHistoricalData(data);
      });

      const mockHistoryData: HistoryDataMessage = {
        timestamp: new Date(),
        position: {
          latitude: 42.6719,
          longitude: 23.2887,
          altitude: 625.76,
          accuracy: 2.3,
          timestamp: new Date()
        },
        motion: {
          speed: { value: 15.5, accuracy: 0.1 },
          heading: { value: 90.0, accuracy: 1.5 },
          gForce: { x: 0.2, y: 0.1, z: 1.05 },
          rotationRate: { x: 1.0, y: 0.8, z: 0.2 },
          timestamp: new Date()
        },
        gnssStatus: {
          fixStatus: 3,
          numSatellites: 12,
          pdop: 1.1,
          horizontalAccuracy: 1.8,
          verticalAccuracy: 2.5
        },
        systemStatus: {
          batteryLevel: 85,
          batteryVoltage: 8.5,
          isCharging: false,
          temperature: 25
        },
        sensorData: {
          gForce: { x: 0.2, y: 0.1, z: 1.05 },
          rotationRate: { x: 1.0, y: 0.8, z: 0.2 },
          timestamp: new Date()
        },
        sessionId: 'session-123',
        recordingIndex: 1,
        sessionStartTime: new Date('2024-01-01T10:00:00Z'),
        sessionEndTime: new Date('2024-01-01T11:00:00Z'),
        totalDataPoints: 3600,
        dataQuality: 'excellent'
      };

      racebox.historyData$.next(mockHistoryData);

      expect(mockProcessHistoricalData).toHaveBeenCalledWith(mockHistoryData);
    });

    it('should handle multiple historical data messages', () => {
      const processedData: HistoryDataMessage[] = [];
      
      racebox.historyData$.subscribe(data => {
        processedData.push(data);
        mockProcessHistoricalData(data);
      });

      const historyData1: HistoryDataMessage = {
        timestamp: new Date('2024-01-01T10:00:00Z'),
        position: {
          latitude: 42.6719,
          longitude: 23.2887,
          altitude: 625.76,
          accuracy: 2.3,
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        motion: {
          speed: { value: 0, accuracy: 0.05 },
          heading: { value: 0, accuracy: 5.0 },
          gForce: { x: 0, y: 0, z: 1.0 },
          rotationRate: { x: 0, y: 0, z: 0 },
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        gnssStatus: {
          fixStatus: 3,
          numSatellites: 12,
          pdop: 1.1,
          horizontalAccuracy: 1.8,
          verticalAccuracy: 2.5
        },
        systemStatus: {
          batteryLevel: 85,
          batteryVoltage: 8.5,
          isCharging: false,
          temperature: 25
        },
        sensorData: {
          gForce: { x: 0, y: 0, z: 1.0 },
          rotationRate: { x: 0, y: 0, z: 0 },
          timestamp: new Date('2024-01-01T10:00:00Z')
        },
        sessionId: 'session-123',
        recordingIndex: 1,
        sessionStartTime: new Date('2024-01-01T10:00:00Z'),
        sessionEndTime: new Date('2024-01-01T11:00:00Z'),
        totalDataPoints: 3600,
        dataQuality: 'excellent'
      };

      const historyData2: HistoryDataMessage = {
        timestamp: new Date('2024-01-01T10:01:00Z'),
        position: {
          latitude: 42.6720,
          longitude: 23.2888,
          altitude: 626.0,
          accuracy: 2.1,
          timestamp: new Date('2024-01-01T10:01:00Z')
        },
        motion: {
          speed: { value: 15.5, accuracy: 0.1 },
          heading: { value: 90.0, accuracy: 1.5 },
          gForce: { x: 0.2, y: 0.1, z: 1.05 },
          rotationRate: { x: 1.0, y: 0.8, z: 0.2 },
          timestamp: new Date('2024-01-01T10:01:00Z')
        },
        gnssStatus: {
          fixStatus: 3,
          numSatellites: 13,
          pdop: 1.0,
          horizontalAccuracy: 1.5,
          verticalAccuracy: 2.2
        },
        systemStatus: {
          batteryLevel: 84,
          batteryVoltage: 8.4,
          isCharging: false,
          temperature: 26
        },
        sensorData: {
          gForce: { x: 0.2, y: 0.1, z: 1.05 },
          rotationRate: { x: 1.0, y: 0.8, z: 0.2 },
          timestamp: new Date('2024-01-01T10:01:00Z')
        },
        sessionId: 'session-123',
        recordingIndex: 2,
        sessionStartTime: new Date('2024-01-01T10:00:00Z'),
        sessionEndTime: new Date('2024-01-01T11:00:00Z'),
        totalDataPoints: 3600,
        dataQuality: 'excellent'
      };

      racebox.historyData$.next(historyData1);
      racebox.historyData$.next(historyData2);

      expect(processedData).toHaveLength(2);
      expect(processedData[0]).toEqual(historyData1);
      expect(processedData[1]).toEqual(historyData2);
      expect(mockProcessHistoricalData).toHaveBeenCalledTimes(2);
    });

    it('should handle historical data with different quality levels', () => {
      racebox.historyData$.subscribe(data => {
        mockProcessHistoricalData(data);
      });

      const excellentQualityData: HistoryDataMessage = {
        timestamp: new Date(),
        position: { latitude: 42.6719, longitude: 23.2887, altitude: 625.76, accuracy: 2.3, timestamp: new Date() },
        motion: { speed: { value: 15.5, accuracy: 0.1 }, heading: { value: 90.0, accuracy: 1.5 }, gForce: { x: 0.2, y: 0.1, z: 1.05 }, rotationRate: { x: 1.0, y: 0.8, z: 0.2 }, timestamp: new Date() },
        gnssStatus: { fixStatus: 3, numSatellites: 12, pdop: 1.1, horizontalAccuracy: 1.8, verticalAccuracy: 2.5 },
        systemStatus: { batteryLevel: 85, batteryVoltage: 8.5, isCharging: false, temperature: 25 },
        sensorData: { gForce: { x: 0.2, y: 0.1, z: 1.05 }, rotationRate: { x: 1.0, y: 0.8, z: 0.2 }, timestamp: new Date() },
        sessionId: 'session-123',
        recordingIndex: 1,
        sessionStartTime: new Date('2024-01-01T10:00:00Z'),
        sessionEndTime: new Date('2024-01-01T11:00:00Z'),
        totalDataPoints: 3600,
        dataQuality: 'excellent'
      };

      const poorQualityData: HistoryDataMessage = {
        timestamp: new Date(),
        position: { latitude: 42.6719, longitude: 23.2887, altitude: 625.76, accuracy: 10.0, timestamp: new Date() },
        motion: { speed: { value: 15.5, accuracy: 2.0 }, heading: { value: 90.0, accuracy: 10.0 }, gForce: { x: 0.2, y: 0.1, z: 1.05 }, rotationRate: { x: 1.0, y: 0.8, z: 0.2 }, timestamp: new Date() },
        gnssStatus: { fixStatus: 2, numSatellites: 5, pdop: 5.0, horizontalAccuracy: 15.0, verticalAccuracy: 25.0 },
        systemStatus: { batteryLevel: 85, batteryVoltage: 8.5, isCharging: false, temperature: 25 },
        sensorData: { gForce: { x: 0.2, y: 0.1, z: 1.05 }, rotationRate: { x: 1.0, y: 0.8, z: 0.2 }, timestamp: new Date() },
        sessionId: 'session-124',
        recordingIndex: 1,
        sessionStartTime: new Date('2024-01-01T12:00:00Z'),
        sessionEndTime: new Date('2024-01-01T13:00:00Z'),
        totalDataPoints: 1800,
        dataQuality: 'poor'
      };

      racebox.historyData$.next(excellentQualityData);
      racebox.historyData$.next(poorQualityData);

      expect(mockProcessHistoricalData).toHaveBeenCalledWith(excellentQualityData);
      expect(mockProcessHistoricalData).toHaveBeenCalledWith(poorQualityData);
    });
  });

  describe('Download Management Function', () => {
    it('should show success message when download completes successfully', async () => {
      // Mock successful download
      const mockHistoryData: HistoryDataMessage[] = [
        {
          timestamp: new Date(),
          position: { latitude: 42.6719, longitude: 23.2887, altitude: 625.76, accuracy: 2.3, timestamp: new Date() },
          motion: { speed: { value: 15.5, accuracy: 0.1 }, heading: { value: 90.0, accuracy: 1.5 }, gForce: { x: 0.2, y: 0.1, z: 1.05 }, rotationRate: { x: 1.0, y: 0.8, z: 0.2 }, timestamp: new Date() },
          gnssStatus: { fixStatus: 3, numSatellites: 12, pdop: 1.1, horizontalAccuracy: 1.8, verticalAccuracy: 2.5 },
          systemStatus: { batteryLevel: 85, batteryVoltage: 8.5, isCharging: false, temperature: 25 },
          sensorData: { gForce: { x: 0.2, y: 0.1, z: 1.05 }, rotationRate: { x: 1.0, y: 0.8, z: 0.2 }, timestamp: new Date() },
          sessionId: 'session-123',
          recordingIndex: 1,
          sessionStartTime: new Date('2024-01-01T10:00:00Z'),
          sessionEndTime: new Date('2024-01-01T11:00:00Z'),
          totalDataPoints: 3600,
          dataQuality: 'excellent'
        }
      ];

      jest.spyOn(racebox, 'downloadHistory').mockResolvedValue(mockHistoryData);

      async function downloadAllData() {
        try {
          const data = await racebox.downloadHistory();
          mockSaveToFile(data);
          mockShowSuccessMessage('Download completed');
        } catch (error) {
          mockShowErrorMessage('Download failed');
        }
      }

      await downloadAllData();

      expect(racebox.downloadHistory).toHaveBeenCalled();
      expect(mockSaveToFile).toHaveBeenCalledWith(mockHistoryData);
      expect(mockShowSuccessMessage).toHaveBeenCalledWith('Download completed');
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });

    it('should show error message when download fails', async () => {
      // Mock failed download
      jest.spyOn(racebox, 'downloadHistory').mockRejectedValue(new Error('Connection timeout'));

      async function downloadAllData() {
        try {
          const data = await racebox.downloadHistory();
          mockSaveToFile(data);
          mockShowSuccessMessage('Download completed');
        } catch (error) {
          mockShowErrorMessage('Download failed');
        }
      }

      await downloadAllData();

      expect(racebox.downloadHistory).toHaveBeenCalled();
      expect(mockShowErrorMessage).toHaveBeenCalledWith('Download failed');
      expect(mockSaveToFile).not.toHaveBeenCalled();
      expect(mockShowSuccessMessage).not.toHaveBeenCalled();
    });

    it('should handle empty download results', async () => {
      // Mock empty download
      jest.spyOn(racebox, 'downloadHistory').mockResolvedValue([]);

      async function downloadAllData() {
        try {
          const data = await racebox.downloadHistory();
          mockSaveToFile(data);
          mockShowSuccessMessage('Download completed');
        } catch (error) {
          mockShowErrorMessage('Download failed');
        }
      }

      await downloadAllData();

      expect(racebox.downloadHistory).toHaveBeenCalled();
      expect(mockSaveToFile).toHaveBeenCalledWith([]);
      expect(mockShowSuccessMessage).toHaveBeenCalledWith('Download completed');
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });
  });

  describe('Complete Download Workflow', () => {
    it('should handle complete download workflow with progress and data processing', async () => {
      // Set up all subscriptions
      racebox.downloadProgress$.subscribe(progress => {
        mockUpdateProgressBar(progress);
      });

      racebox.historyData$.subscribe(data => {
        mockProcessHistoricalData(data);
      });

      // Mock successful download
      const mockHistoryData: HistoryDataMessage[] = [
        {
          timestamp: new Date('2024-01-01T10:00:00Z'),
          position: { latitude: 42.6719, longitude: 23.2887, altitude: 625.76, accuracy: 2.3, timestamp: new Date('2024-01-01T10:00:00Z') },
          motion: { speed: { value: 0, accuracy: 0.05 }, heading: { value: 0, accuracy: 5.0 }, gForce: { x: 0, y: 0, z: 1.0 }, rotationRate: { x: 0, y: 0, z: 0 }, timestamp: new Date('2024-01-01T10:00:00Z') },
          gnssStatus: { fixStatus: 3, numSatellites: 12, pdop: 1.1, horizontalAccuracy: 1.8, verticalAccuracy: 2.5 },
          systemStatus: { batteryLevel: 85, batteryVoltage: 8.5, isCharging: false, temperature: 25 },
          sensorData: { gForce: { x: 0, y: 0, z: 1.0 }, rotationRate: { x: 0, y: 0, z: 0 }, timestamp: new Date('2024-01-01T10:00:00Z') },
          sessionId: 'session-123',
          recordingIndex: 1,
          sessionStartTime: new Date('2024-01-01T10:00:00Z'),
          sessionEndTime: new Date('2024-01-01T11:00:00Z'),
          totalDataPoints: 3600,
          dataQuality: 'excellent'
        },
        {
          timestamp: new Date('2024-01-01T10:01:00Z'),
          position: { latitude: 42.6720, longitude: 23.2888, altitude: 626.0, accuracy: 2.1, timestamp: new Date('2024-01-01T10:01:00Z') },
          motion: { speed: { value: 15.5, accuracy: 0.1 }, heading: { value: 90.0, accuracy: 1.5 }, gForce: { x: 0.2, y: 0.1, z: 1.05 }, rotationRate: { x: 1.0, y: 0.8, z: 0.2 }, timestamp: new Date('2024-01-01T10:01:00Z') },
          gnssStatus: { fixStatus: 3, numSatellites: 13, pdop: 1.0, horizontalAccuracy: 1.5, verticalAccuracy: 2.2 },
          systemStatus: { batteryLevel: 84, batteryVoltage: 8.4, isCharging: false, temperature: 26 },
          sensorData: { gForce: { x: 0.2, y: 0.1, z: 1.05 }, rotationRate: { x: 1.0, y: 0.8, z: 0.2 }, timestamp: new Date('2024-01-01T10:01:00Z') },
          sessionId: 'session-123',
          recordingIndex: 2,
          sessionStartTime: new Date('2024-01-01T10:00:00Z'),
          sessionEndTime: new Date('2024-01-01T11:00:00Z'),
          totalDataPoints: 3600,
          dataQuality: 'excellent'
        }
      ];

      jest.spyOn(racebox, 'downloadHistory').mockResolvedValue(mockHistoryData);

      // Simulate progress updates
      racebox.downloadProgress$.next(0);
      racebox.downloadProgress$.next(25);
      racebox.downloadProgress$.next(50);
      racebox.downloadProgress$.next(75);
      racebox.downloadProgress$.next(100);

      // Simulate data processing
      mockHistoryData.forEach(data => {
        racebox.historyData$.next(data);
      });

      // Execute download
      async function downloadAllData() {
        try {
          const data = await racebox.downloadHistory();
          mockSaveToFile(data);
          mockShowSuccessMessage('Download completed');
        } catch (error) {
          mockShowErrorMessage('Download failed');
        }
      }

      await downloadAllData();

      // Verify progress updates
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(0);
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(25);
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(50);
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(75);
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(100);

      // Verify data processing
      expect(mockProcessHistoricalData).toHaveBeenCalledWith(mockHistoryData[0]);
      expect(mockProcessHistoricalData).toHaveBeenCalledWith(mockHistoryData[1]);

      // Verify download completion
      expect(racebox.downloadHistory).toHaveBeenCalled();
      expect(mockSaveToFile).toHaveBeenCalledWith(mockHistoryData);
      expect(mockShowSuccessMessage).toHaveBeenCalledWith('Download completed');
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });

    it('should handle download cancellation scenario', async () => {
      // Set up subscriptions
      racebox.downloadProgress$.subscribe(progress => {
        mockUpdateProgressBar(progress);
      });

      racebox.historyData$.subscribe(data => {
        mockProcessHistoricalData(data);
      });

      // Mock download that gets cancelled
      jest.spyOn(racebox, 'downloadHistory').mockRejectedValue(new Error('Download cancelled'));

      // Simulate partial progress
      racebox.downloadProgress$.next(0);
      racebox.downloadProgress$.next(25);
      racebox.downloadProgress$.next(50);

      async function downloadAllData() {
        try {
          const data = await racebox.downloadHistory();
          mockSaveToFile(data);
          mockShowSuccessMessage('Download completed');
        } catch (error) {
          mockShowErrorMessage('Download failed');
        }
      }

      await downloadAllData();

      // Verify partial progress was tracked
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(0);
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(25);
      expect(mockUpdateProgressBar).toHaveBeenCalledWith(50);

      // Verify download failure handling
      expect(racebox.downloadHistory).toHaveBeenCalled();
      expect(mockShowErrorMessage).toHaveBeenCalledWith('Download failed');
      expect(mockSaveToFile).not.toHaveBeenCalled();
      expect(mockShowSuccessMessage).not.toHaveBeenCalled();
    });
  });
}); 