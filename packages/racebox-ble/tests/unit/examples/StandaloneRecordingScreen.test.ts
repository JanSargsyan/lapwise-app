import { Subject } from 'rxjs';
import { RaceBoxClientPort } from '../../../src/ports/primary/RaceBoxClientPort';
import { LiveDataMessage } from '../../../src/domain/entities/LiveDataMessage';
import { RecordingConfiguration } from '../../../src/domain/entities/RecordingConfiguration';
import { RaceBoxError } from '../../../src/domain/types/RaceBoxError';
import { RecordingState } from '../../../src/ports/primary/RaceBoxClientPort';
import { Position } from '../../../src/domain/value-objects/Position';
import { GNSSStatus } from '../../../src/domain/value-objects/GNSSStatus';
import { MotionData } from '../../../src/domain/value-objects/MotionData';
import { DeviceInfo } from '../../../src/ports/primary/RaceBoxClientPort';
import { GNSSConfiguration } from '../../../src/domain/entities/GNSSConfiguration';
import { ConnectionState } from '../../../src/ports/primary/RaceBoxClientPort';
import { RaceBoxConfig } from '../../../src/ports/primary/RaceBoxClientPort';

// Mock UI update functions
const mockUpdateRecordingStatus = jest.fn();
const mockUpdateMemoryDisplay = jest.fn();
const mockUpdateConfigurationDisplay = jest.fn();
const mockShowSuccessMessage = jest.fn();
const mockShowErrorMessage = jest.fn();

// Mock RaceBox client
class MockRaceBoxClient implements RaceBoxClientPort {
  public recordingState$ = new Subject<RecordingState>();
  public recordingConfig$ = new Subject<RecordingConfiguration>();
  public allErrors$ = new Subject<RaceBoxError>();
  public liveData$ = new Subject<LiveDataMessage>();
  public position$ = new Subject<Position>();
  public motion$ = new Subject<MotionData>();
  public deviceState$ = new Subject<ConnectionState>();
  public historyData$ = new Subject<LiveDataMessage>();
  public downloadProgress$ = new Subject<number>();
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

  async downloadHistory(): Promise<any[]> {
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

  async getRecordingStatus(): Promise<RecordingState> {
    // Mock implementation
    return { isRecording: false, isPaused: false };
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

  getConfig(): RaceBoxConfig {
    return {
      connectionTimeout: 5000,
      commandTimeout: 3000,
      retryAttempts: 3,
      autoReconnect: true,
      dataBufferSize: 1024
    };
  }

  updateConfig(_config: Partial<RaceBoxConfig>): void {
    // Mock implementation
  }
}

describe('Standalone Recording Screen Example', () => {
  let racebox: MockRaceBoxClient;

  beforeEach(() => {
    racebox = new MockRaceBoxClient();
    jest.clearAllMocks();
  });

  describe('Recording State Subscription', () => {
    it('should update recording status and memory display when recording state changes', () => {
      // Subscribe to recording state changes
      racebox.recordingState$.subscribe(state => {
        mockUpdateRecordingStatus(state);
        mockUpdateMemoryDisplay(state.memoryLevel);
      });

      // Simulate recording state change
      const mockRecordingStatus: RecordingState = {
        isRecording: true,
        isPaused: false,
        duration: 120,
        dataPoints: 3000,
        memoryLevel: 75,
        startTime: new Date()
      };

      racebox.recordingState$.next(mockRecordingStatus);

      expect(mockUpdateRecordingStatus).toHaveBeenCalledWith(mockRecordingStatus);
      expect(mockUpdateMemoryDisplay).toHaveBeenCalledWith(75);
    });

    it('should handle paused recording state', () => {
      racebox.recordingState$.subscribe(state => {
        mockUpdateRecordingStatus(state);
        mockUpdateMemoryDisplay(state.memoryLevel);
      });

      const pausedStatus: RecordingState = {
        isRecording: false,
        isPaused: true,
        duration: 60,
        dataPoints: 1500,
        memoryLevel: 50,
        startTime: new Date()
      };

      racebox.recordingState$.next(pausedStatus);

      expect(mockUpdateRecordingStatus).toHaveBeenCalledWith(pausedStatus);
      expect(mockUpdateMemoryDisplay).toHaveBeenCalledWith(50);
    });
  });

  describe('Configuration Subscription', () => {
    it('should update configuration display when recording config changes', () => {
      // Subscribe to configuration changes
      racebox.recordingConfig$.subscribe(config => {
        mockUpdateConfigurationDisplay(config);
      });

      const mockConfig: RecordingConfiguration = {
        enabled: true,
        dataRate: 0, // 25Hz
        filters: {
          minSpeed: 0,
          maxSpeed: 300,
          minAccuracy: 5,
          enableAccelerometer: true,
          enableGyroscope: true,
          enableMagnetometer: false
        },
        thresholds: {
          speedThreshold: 5,
          accelerationThreshold: 0.1,
          rotationThreshold: 1.0
        },
        timeouts: {
          startDelay: 0,
          stopDelay: 0,
          autoStop: 300
        }
      };

      racebox.recordingConfig$.next(mockConfig);

      expect(mockUpdateConfigurationDisplay).toHaveBeenCalledWith(mockConfig);
    });
  });

  describe('Error Subscription', () => {
    it('should show error messages when errors occur', () => {
      // Subscribe to errors
      racebox.allErrors$.subscribe(error => {
        mockShowErrorMessage(error);
      });

      const mockError: RaceBoxError = {
        type: 'device',
        message: 'Device connection lost',
        code: 'CONNECTION_LOST',
        timestamp: new Date(),
        recoverable: true,
        details: { deviceId: 'test-device' }
      };

      racebox.allErrors$.next(mockError);

      expect(mockShowErrorMessage).toHaveBeenCalledWith(mockError);
    });

    it('should handle different error types', () => {
      racebox.allErrors$.subscribe(error => {
        mockShowErrorMessage(error);
      });

      const protocolError: RaceBoxError = {
        type: 'protocol',
        message: 'Invalid packet format',
        code: 'INVALID_PACKET',
        timestamp: new Date(),
        recoverable: false
      };

      racebox.allErrors$.next(protocolError);

      expect(mockShowErrorMessage).toHaveBeenCalledWith(protocolError);
    });
  });

  describe('Start Recording Function', () => {
    it('should show success message when recording starts successfully', async () => {
      // Mock successful start recording
      jest.spyOn(racebox, 'startRecording').mockResolvedValue();

      async function startRecording() {
        try {
          await racebox.startRecording();
          mockShowSuccessMessage('Recording started');
        } catch (error) {
          mockShowErrorMessage('Failed to start recording');
        }
      }

      await startRecording();

      expect(racebox.startRecording).toHaveBeenCalled();
      expect(mockShowSuccessMessage).toHaveBeenCalledWith('Recording started');
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });

    it('should show error message when recording start fails', async () => {
      // Mock failed start recording
      jest.spyOn(racebox, 'startRecording').mockRejectedValue(new Error('Connection failed'));

      async function startRecording() {
        try {
          await racebox.startRecording();
          mockShowSuccessMessage('Recording started');
        } catch (error) {
          mockShowErrorMessage('Failed to start recording');
        }
      }

      await startRecording();

      expect(racebox.startRecording).toHaveBeenCalled();
      expect(mockShowErrorMessage).toHaveBeenCalledWith('Failed to start recording');
      expect(mockShowSuccessMessage).not.toHaveBeenCalled();
    });
  });

  describe('Update Configuration Function', () => {
    it('should show success message when configuration updates successfully', async () => {
      // Mock successful configuration update
      jest.spyOn(racebox, 'configureRecording').mockResolvedValue();

      async function updateConfiguration(newConfig: RecordingConfiguration) {
        try {
          await racebox.configureRecording(newConfig);
          mockShowSuccessMessage('Configuration updated');
        } catch (error) {
          mockShowErrorMessage('Failed to update configuration');
        }
      }

      const newConfig: RecordingConfiguration = {
        enabled: true,
        dataRate: 1, // 10Hz
        filters: {
          minSpeed: 0,
          maxSpeed: 300,
          minAccuracy: 5,
          enableAccelerometer: true,
          enableGyroscope: false,
          enableMagnetometer: false
        },
        thresholds: {
          speedThreshold: 3,
          accelerationThreshold: 0.2,
          rotationThreshold: 2.0
        },
        timeouts: {
          startDelay: 0,
          stopDelay: 0,
          autoStop: 600
        }
      };

      await updateConfiguration(newConfig);

      expect(racebox.configureRecording).toHaveBeenCalledWith(newConfig);
      expect(mockShowSuccessMessage).toHaveBeenCalledWith('Configuration updated');
      expect(mockShowErrorMessage).not.toHaveBeenCalled();
    });

    it('should show error message when configuration update fails', async () => {
      // Mock failed configuration update
      jest.spyOn(racebox, 'configureRecording').mockRejectedValue(new Error('Invalid configuration'));

      async function updateConfiguration(newConfig: RecordingConfiguration) {
        try {
          await racebox.configureRecording(newConfig);
          mockShowSuccessMessage('Configuration updated');
        } catch (error) {
          mockShowErrorMessage('Failed to update configuration');
        }
      }

      const newConfig: RecordingConfiguration = {
        enabled: false,
        dataRate: 2, // 5Hz
        filters: {
          minSpeed: 0,
          maxSpeed: 300,
          minAccuracy: 5,
          enableAccelerometer: false,
          enableGyroscope: true,
          enableMagnetometer: false
        },
        thresholds: {
          speedThreshold: 10,
          accelerationThreshold: 0.5,
          rotationThreshold: 5.0
        },
        timeouts: {
          startDelay: 0,
          stopDelay: 0,
          autoStop: 180
        }
      };

      await updateConfiguration(newConfig);

      expect(racebox.configureRecording).toHaveBeenCalledWith(newConfig);
      expect(mockShowErrorMessage).toHaveBeenCalledWith('Failed to update configuration');
      expect(mockShowSuccessMessage).not.toHaveBeenCalled();
    });
  });

  describe('Complete Integration Test', () => {
    it('should handle complete recording workflow', async () => {
      // Set up all subscriptions
      racebox.recordingState$.subscribe(state => {
        mockUpdateRecordingStatus(state);
        mockUpdateMemoryDisplay(state.memoryLevel);
      });

      racebox.recordingConfig$.subscribe(config => {
        mockUpdateConfigurationDisplay(config);
      });

      racebox.allErrors$.subscribe(error => {
        mockShowErrorMessage(error);
      });

      // Mock successful operations
      jest.spyOn(racebox, 'startRecording').mockResolvedValue();
      jest.spyOn(racebox, 'configureRecording').mockResolvedValue();

      // Simulate configuration update
      const config: RecordingConfiguration = {
        enabled: true,
        dataRate: 0, // 25Hz
        filters: {
          minSpeed: 0,
          maxSpeed: 300,
          minAccuracy: 5,
          enableAccelerometer: true,
          enableGyroscope: true,
          enableMagnetometer: false
        },
        thresholds: {
          speedThreshold: 5,
          accelerationThreshold: 0.1,
          rotationThreshold: 1.0
        },
        timeouts: {
          startDelay: 0,
          stopDelay: 0,
          autoStop: 300
        }
      };

      await racebox.configureRecording(config);
      // Note: configureRecording doesn't automatically trigger recordingConfig$ stream
      // The configuration display would be updated when the device responds with the new config

      // Simulate recording state change
      const recordingStatus: RecordingState = {
        isRecording: true,
        isPaused: false,
        duration: 0,
        dataPoints: 0,
        memoryLevel: 25,
        startTime: new Date()
      };

      racebox.recordingState$.next(recordingStatus);
      expect(mockUpdateRecordingStatus).toHaveBeenCalledWith(recordingStatus);
      expect(mockUpdateMemoryDisplay).toHaveBeenCalledWith(25);

      // Simulate error
      const error: RaceBoxError = {
        type: 'connection',
        message: 'BLE connection lost',
        code: 'BLE_DISCONNECTED',
        timestamp: new Date(),
        recoverable: true
      };

      racebox.allErrors$.next(error);
      expect(mockShowErrorMessage).toHaveBeenCalledWith(error);
    });
  });
}); 