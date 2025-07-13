export interface DeviceInfo {
  id: string;
  name: string;
  type: DeviceType;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  hardwareVersion?: string;
}

export enum DeviceType {
  RACEBOX = 'racebox',
  RACELOGIC = 'racelogic',
  CUSTOM = 'custom',
}

export interface DeviceStatus {
  isConnected: boolean;
  isScanning: boolean;
  lastSeen?: Date;
  signalStrength?: number;
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface DeviceData {
  location?: LocationData;
  motion?: MotionData;
  sensors?: SensorData;
  status?: DeviceStatus;
  rawData?: string;
  timestamp: Date;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  satellites: number;
  fixType: 'none' | '2d' | '3d';
}

export interface MotionData {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  rotationRate: {
    x: number;
    y: number;
    z: number;
  };
  gForce: number;
}

export interface SensorData {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  [key: string]: number | undefined;
}

export class Device {
  constructor(
    public readonly info: DeviceInfo,
    public status: DeviceStatus = {
      isConnected: false,
      isScanning: false,
    }
  ) {}

  updateStatus(status: Partial<DeviceStatus>): void {
    this.status = { ...this.status, ...status };
  }

  updateLastSeen(): void {
    this.status.lastSeen = new Date();
  }
} 