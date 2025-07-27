import { Subject, combineLatest } from 'rxjs';
import { RaceBoxClientPort } from '../../../src/ports/primary/RaceBoxClientPort';
import { LiveDataMessage } from '../../../src/domain/entities/LiveDataMessage';
import { Position } from '../../../src/domain/value-objects/Position';
import { MotionData } from '../../../src/domain/value-objects/MotionData';
import { GNSSStatus } from '../../../src/domain/value-objects/GNSSStatus';
import { ConnectionState } from '../../../src/ports/primary/RaceBoxClientPort';
import { DeviceInfo } from '../../../src/ports/primary/RaceBoxClientPort';
import { GNSSConfiguration } from '../../../src/domain/entities/GNSSConfiguration';
import { RecordingConfiguration } from '../../../src/domain/entities/RecordingConfiguration';
import { RaceBoxError } from '../../../src/domain/types/RaceBoxError';

// Mock UI update functions
const mockUpdateDashboard = jest.fn();
const mockUpdateGNSSStatus = jest.fn();

// Mock RaceBox client
class MockRaceBoxClient implements RaceBoxClientPort {
  public position$ = new Subject<Position>();
  public motion$ = new Subject<MotionData>();
  public deviceState$ = new Subject<ConnectionState>();
  public gnssState$ = new Subject<GNSSStatus>();
  public liveData$ = new Subject<LiveDataMessage>();
  public recordingState$ = new Subject<any>();
  public recordingConfig$ = new Subject<RecordingConfiguration>();
  public allErrors$ = new Subject<RaceBoxError>();
  public historyData$ = new Subject<LiveDataMessage>();
  public downloadProgress$ = new Subject<number>();
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

describe('Real-time Data Dashboard Example', () => {
  let racebox: MockRaceBoxClient;

  beforeEach(() => {
    racebox = new MockRaceBoxClient();
    jest.clearAllMocks();
  });

  describe('Combined Streams Dashboard', () => {
    it('should update dashboard when position, motion, and device state change', () => {
      // Combine multiple streams for dashboard
      combineLatest([
        racebox.position$,
        racebox.motion$,
        racebox.deviceState$
      ]).subscribe(([position, motion, deviceState]) => {
        mockUpdateDashboard({
          position,
          motion,
          deviceState
        });
      });

      // Simulate position data
      const mockPosition: Position = {
        latitude: 42.6719,
        longitude: 23.2887,
        altitude: 625.76,
        accuracy: 2.3,
        timestamp: new Date()
      };

      // Simulate motion data
      const mockMotion: MotionData = {
        speed: {
          value: 0.126,
          accuracy: 0.05
        },
        heading: {
          value: 45.5,
          accuracy: 2.1
        },
        gForce: {
          x: 0.1,
          y: 0.05,
          z: 1.02
        },
        rotationRate: {
          x: 0.5,
          y: 1.2,
          z: -0.3
        },
        timestamp: new Date()
      };

      // Simulate device state
      const mockDeviceState: ConnectionState = {
        isConnected: true,
        deviceId: 'test-device',
        signalStrength: -45,
        lastSeen: new Date()
      };

      // Emit all three streams
      racebox.position$.next(mockPosition);
      racebox.motion$.next(mockMotion);
      racebox.deviceState$.next(mockDeviceState);

      expect(mockUpdateDashboard).toHaveBeenCalledWith({
        position: mockPosition,
        motion: mockMotion,
        deviceState: mockDeviceState
      });
    });

    it('should handle partial updates when only some streams emit', () => {
      let dashboardCalls: any[] = [];
      
      combineLatest([
        racebox.position$,
        racebox.motion$,
        racebox.deviceState$
      ]).subscribe(([position, motion, deviceState]) => {
        const dashboardData = {
          position,
          motion,
          deviceState
        };
        dashboardCalls.push(dashboardData);
        mockUpdateDashboard(dashboardData);
      });

      // Only emit position initially
      const mockPosition: Position = {
        latitude: 42.6719,
        longitude: 23.2887,
        altitude: 625.76,
        accuracy: 2.3,
        timestamp: new Date()
      };

      racebox.position$.next(mockPosition);

      // Should not call updateDashboard yet since not all streams have emitted
      expect(mockUpdateDashboard).not.toHaveBeenCalled();

      // Now emit motion data
      const mockMotion: MotionData = {
        speed: { value: 0.126, accuracy: 0.05 },
        heading: { value: 45.5, accuracy: 2.1 },
        gForce: { x: 0.1, y: 0.05, z: 1.02 },
        rotationRate: { x: 0.5, y: 1.2, z: -0.3 },
        timestamp: new Date()
      };

      racebox.motion$.next(mockMotion);

      // Still shouldn't call since deviceState hasn't emitted
      expect(mockUpdateDashboard).not.toHaveBeenCalled();

      // Finally emit device state
      const mockDeviceState: ConnectionState = {
        isConnected: true,
        deviceId: 'test-device',
        signalStrength: -45,
        lastSeen: new Date()
      };

      racebox.deviceState$.next(mockDeviceState);

      // Now should call updateDashboard with all data
      expect(mockUpdateDashboard).toHaveBeenCalledWith({
        position: mockPosition,
        motion: mockMotion,
        deviceState: mockDeviceState
      });
    });

    it('should handle multiple sequential updates', () => {
      const dashboardCalls: any[] = [];
      
      combineLatest([
        racebox.position$,
        racebox.motion$,
        racebox.deviceState$
      ]).subscribe(([position, motion, deviceState]) => {
        const dashboardData = {
          position,
          motion,
          deviceState
        };
        dashboardCalls.push(dashboardData);
        mockUpdateDashboard(dashboardData);
      });

      // Initial state
      const initialPosition: Position = {
        latitude: 42.6719,
        longitude: 23.2887,
        altitude: 625.76,
        accuracy: 2.3,
        timestamp: new Date()
      };

      const initialMotion: MotionData = {
        speed: { value: 0.126, accuracy: 0.05 },
        heading: { value: 45.5, accuracy: 2.1 },
        gForce: { x: 0.1, y: 0.05, z: 1.02 },
        rotationRate: { x: 0.5, y: 1.2, z: -0.3 },
        timestamp: new Date()
      };

      const initialDeviceState: ConnectionState = {
        isConnected: true,
        deviceId: 'test-device',
        signalStrength: -45,
        lastSeen: new Date()
      };

      racebox.position$.next(initialPosition);
      racebox.motion$.next(initialMotion);
      racebox.deviceState$.next(initialDeviceState);

      expect(mockUpdateDashboard).toHaveBeenCalledTimes(1);

      // Update position only
      const updatedPosition: Position = {
        latitude: 42.6720,
        longitude: 23.2888,
        altitude: 626.0,
        accuracy: 2.1,
        timestamp: new Date()
      };

      racebox.position$.next(updatedPosition);

      expect(mockUpdateDashboard).toHaveBeenCalledTimes(2);
      expect(mockUpdateDashboard).toHaveBeenLastCalledWith({
        position: updatedPosition,
        motion: initialMotion,
        deviceState: initialDeviceState
      });
    });
  });

  describe('GNSS Status Monitoring', () => {
    it('should update GNSS status when GNSS state changes', () => {
      // Monitor GNSS status separately
      racebox.gnssState$.subscribe(gnssState => {
        mockUpdateGNSSStatus(gnssState);
      });

      const mockGNSSStatus: GNSSStatus = {
        fixStatus: 3, // 3D fix
        numSatellites: 11,
        pdop: 1.2,
        horizontalAccuracy: 2.3,
        verticalAccuracy: 3.1
      };

      racebox.gnssState$.next(mockGNSSStatus);

      expect(mockUpdateGNSSStatus).toHaveBeenCalledWith(mockGNSSStatus);
    });

    it('should handle different GNSS fix states', () => {
      racebox.gnssState$.subscribe(gnssState => {
        mockUpdateGNSSStatus(gnssState);
      });

      // Test no fix
      const noFixStatus: GNSSStatus = {
        fixStatus: 0, // No fix
        numSatellites: 3,
        pdop: 5.0,
        horizontalAccuracy: 50.0,
        verticalAccuracy: 100.0
      };

      racebox.gnssState$.next(noFixStatus);
      expect(mockUpdateGNSSStatus).toHaveBeenCalledWith(noFixStatus);

      // Test 2D fix
      const twoDFixStatus: GNSSStatus = {
        fixStatus: 2, // 2D fix
        numSatellites: 6,
        pdop: 2.5,
        horizontalAccuracy: 5.0,
        verticalAccuracy: 15.0
      };

      racebox.gnssState$.next(twoDFixStatus);
      expect(mockUpdateGNSSStatus).toHaveBeenCalledWith(twoDFixStatus);

      // Test 3D fix
      const threeDFixStatus: GNSSStatus = {
        fixStatus: 3, // 3D fix
        numSatellites: 12,
        pdop: 1.1,
        horizontalAccuracy: 1.5,
        verticalAccuracy: 2.8
      };

      racebox.gnssState$.next(threeDFixStatus);
      expect(mockUpdateGNSSStatus).toHaveBeenCalledWith(threeDFixStatus);
    });

    it('should handle GNSS status with poor satellite count', () => {
      racebox.gnssState$.subscribe(gnssState => {
        mockUpdateGNSSStatus(gnssState);
      });

      const poorGNSSStatus: GNSSStatus = {
        fixStatus: 0, // No fix due to poor satellite count
        numSatellites: 2,
        pdop: 10.0,
        horizontalAccuracy: 100.0,
        verticalAccuracy: 200.0
      };

      racebox.gnssState$.next(poorGNSSStatus);
      expect(mockUpdateGNSSStatus).toHaveBeenCalledWith(poorGNSSStatus);
    });
  });

  describe('Dashboard Integration', () => {
    it('should handle complete dashboard workflow with all streams', () => {
      // Set up dashboard subscription
      combineLatest([
        racebox.position$,
        racebox.motion$,
        racebox.deviceState$
      ]).subscribe(([position, motion, deviceState]) => {
        mockUpdateDashboard({
          position,
          motion,
          deviceState
        });
      });

      // Set up GNSS monitoring
      racebox.gnssState$.subscribe(gnssState => {
        mockUpdateGNSSStatus(gnssState);
      });

      // Simulate real-time data updates
      const position1: Position = {
        latitude: 42.6719,
        longitude: 23.2887,
        altitude: 625.76,
        accuracy: 2.3,
        timestamp: new Date()
      };

      const motion1: MotionData = {
        speed: { value: 0.126, accuracy: 0.05 },
        heading: { value: 45.5, accuracy: 2.1 },
        gForce: { x: 0.1, y: 0.05, z: 1.02 },
        rotationRate: { x: 0.5, y: 1.2, z: -0.3 },
        timestamp: new Date()
      };

      const deviceState1: ConnectionState = {
        isConnected: true,
        deviceId: 'test-device',
        signalStrength: -45,
        lastSeen: new Date()
      };

      const gnssStatus1: GNSSStatus = {
        fixStatus: 3,
        numSatellites: 11,
        pdop: 1.2,
        horizontalAccuracy: 2.3,
        verticalAccuracy: 3.1
      };

      // Emit all streams
      racebox.position$.next(position1);
      racebox.motion$.next(motion1);
      racebox.deviceState$.next(deviceState1);
      racebox.gnssState$.next(gnssStatus1);

      expect(mockUpdateDashboard).toHaveBeenCalledWith({
        position: position1,
        motion: motion1,
        deviceState: deviceState1
      });

      expect(mockUpdateGNSSStatus).toHaveBeenCalledWith(gnssStatus1);

      // Simulate movement and status changes
      const position2: Position = {
        latitude: 42.6720,
        longitude: 23.2888,
        altitude: 626.0,
        accuracy: 2.1,
        timestamp: new Date()
      };

      const motion2: MotionData = {
        speed: { value: 15.5, accuracy: 0.1 },
        heading: { value: 90.0, accuracy: 1.5 },
        gForce: { x: 0.2, y: 0.1, z: 1.05 },
        rotationRate: { x: 1.0, y: 0.8, z: 0.2 },
        timestamp: new Date()
      };

      const deviceState2: ConnectionState = {
        isConnected: true,
        deviceId: 'test-device',
        signalStrength: -44,
        lastSeen: new Date()
      };

      const gnssStatus2: GNSSStatus = {
        fixStatus: 3,
        numSatellites: 13,
        pdop: 1.0,
        horizontalAccuracy: 1.8,
        verticalAccuracy: 2.5
      };

      // Update all streams
      racebox.position$.next(position2);
      racebox.motion$.next(motion2);
      racebox.deviceState$.next(deviceState2);
      racebox.gnssState$.next(gnssStatus2);

      // Each stream update triggers combineLatest, so we get multiple calls
      expect(mockUpdateDashboard).toHaveBeenCalledTimes(4); // 1 initial + 3 updates
      expect(mockUpdateDashboard).toHaveBeenLastCalledWith({
        position: position2,
        motion: motion2,
        deviceState: deviceState2
      });

      expect(mockUpdateGNSSStatus).toHaveBeenCalledTimes(2);
      expect(mockUpdateGNSSStatus).toHaveBeenLastCalledWith(gnssStatus2);
    });

    it('should handle connection loss scenario', () => {
      combineLatest([
        racebox.position$,
        racebox.motion$,
        racebox.deviceState$
      ]).subscribe(([position, motion, deviceState]) => {
        mockUpdateDashboard({
          position,
          motion,
          deviceState
        });
      });

      // Initial connected state - need to emit all streams first
      const initialPosition: Position = {
        latitude: 42.6719,
        longitude: 23.2887,
        altitude: 625.76,
        accuracy: 2.3,
        timestamp: new Date()
      };

      const initialMotion: MotionData = {
        speed: { value: 0.126, accuracy: 0.05 },
        heading: { value: 45.5, accuracy: 2.1 },
        gForce: { x: 0.1, y: 0.05, z: 1.02 },
        rotationRate: { x: 0.5, y: 1.2, z: -0.3 },
        timestamp: new Date()
      };

      const connectedDeviceState: ConnectionState = {
        isConnected: true,
        deviceId: 'test-device',
        signalStrength: -45,
        lastSeen: new Date()
      };

      // Emit all streams to initialize combineLatest
      racebox.position$.next(initialPosition);
      racebox.motion$.next(initialMotion);
      racebox.deviceState$.next(connectedDeviceState);

      // Now simulate connection loss
      const disconnectedDeviceState: ConnectionState = {
        isConnected: false,
        deviceId: 'test-device',
        signalStrength: undefined,
        lastSeen: new Date()
      };

      racebox.deviceState$.next(disconnectedDeviceState);

      expect(mockUpdateDashboard).toHaveBeenCalledWith({
        position: initialPosition,
        motion: initialMotion,
        deviceState: disconnectedDeviceState
      });
    });
  });
}); 