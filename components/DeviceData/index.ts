// Core domain types
export enum DeviceType {
  RACEBOX = 'racebox',
  CUSTOM = 'custom',
}

export enum FixStatus {
  NO_FIX = 0,
  FIX_2D = 2,
  FIX_3D = 3,
}

export enum DataQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  UNKNOWN = 'unknown',
}

// Generic device data interface
export interface DeviceData {
  // Metadata
  deviceType: DeviceType;
  timestamp: Date;
  dataQuality: DataQuality;
  
  // Location data
  location?: {
    latitude: number; // degrees
    longitude: number; // degrees
    altitude: number; // meters (WGS84)
    altitudeMsl?: number; // meters (Mean Sea Level)
    horizontalAccuracy: number; // meters
    verticalAccuracy: number; // meters
    fixStatus: FixStatus;
    satellites: number;
    pdop?: number; // Position Dilution of Precision
  };
  
  // Motion data
  motion?: {
    speed: number; // m/s
    heading: number; // degrees (0-360)
    speedAccuracy?: number; // m/s
    headingAccuracy?: number; // degrees
  };
  
  // Sensor data
  sensors?: {
    accelerometer?: {
      x: number; // g
      y: number; // g
      z: number; // g
    };
    gyroscope?: {
      x: number; // deg/s
      y: number; // deg/s
      z: number; // deg/s
    };
  };
  
  // Device status
  status?: {
    batteryLevel?: number; // percentage (0-100)
    isCharging?: boolean;
    voltage?: number; // volts
    temperature?: number; // celsius
  };
  
  // Raw data (for debugging/advanced use)
  raw?: {
    protocol: string;
    originalData: any;
    hexString?: string;
  };
}

// Factory function to create DeviceData from protocol data
export function createDeviceData(
  deviceType: DeviceType,
  protocolData: any,
  hexString?: string
): DeviceData {
  const baseData: DeviceData = {
    deviceType,
    timestamp: new Date(),
    dataQuality: DataQuality.UNKNOWN,
    raw: {
      protocol: deviceType,
      originalData: protocolData,
      hexString,
    },
  };

  // Convert protocol-specific data to domain model
  switch (deviceType) {
    case DeviceType.RACEBOX:
      return convertRaceBoxData(protocolData, baseData);
    default:
      return baseData;
  }
}

// Protocol-specific converters
function convertRaceBoxData(protocolData: any, baseData: DeviceData): DeviceData {
  const data = { ...baseData };
  
  // Location data
  if (protocolData.longitude !== undefined && protocolData.latitude !== undefined) {
    data.location = {
      latitude: protocolData.latitude / 1e7,
      longitude: protocolData.longitude / 1e7,
      altitude: protocolData.wgsAltitude / 1000,
      altitudeMsl: protocolData.mslAltitude / 1000,
      horizontalAccuracy: protocolData.horizAccuracy / 1000,
      verticalAccuracy: protocolData.vertAccuracy / 1000,
      fixStatus: protocolData.fixStatus as FixStatus,
      satellites: protocolData.numSVs,
      pdop: protocolData.pdop / 100,
    };
  }
  
  // Motion data
  if (protocolData.speed !== undefined) {
    data.motion = {
      speed: protocolData.speed / 1000, // mm/s to m/s
      heading: protocolData.heading / 1e5, // 1e-5 deg to deg
      speedAccuracy: protocolData.speedAccuracy / 1000,
      headingAccuracy: protocolData.headingAccuracy / 1e5,
    };
  }
  
  // Sensor data
  if (protocolData.gForceX !== undefined) {
    data.sensors = {
      accelerometer: {
        x: protocolData.gForceX / 1000, // milli-g to g
        y: protocolData.gForceY / 1000,
        z: protocolData.gForceZ / 1000,
      },
      gyroscope: {
        x: protocolData.rotRateX / 100, // centi-deg/s to deg/s
        y: protocolData.rotRateY / 100,
        z: protocolData.rotRateZ / 100,
      },
    };
  }
  
  // Status data
  if (protocolData.batteryOrVoltage !== undefined) {
    const batteryValue = protocolData.batteryOrVoltage;
    data.status = {
      batteryLevel: batteryValue <= 0x7F ? batteryValue : (batteryValue & 0x7F),
      isCharging: batteryValue > 0x7F,
      voltage: batteryValue > 0x7F ? undefined : batteryValue / 10,
    };
  }
  
  // Data quality assessment
  data.dataQuality = assessDataQuality(data);
  
  return data;
}

// Assess data quality based on available information
function assessDataQuality(data: DeviceData): DataQuality {
  if (!data.location) return DataQuality.UNKNOWN;
  
  const { location, motion } = data;
  
  // Check fix status
  if (location.fixStatus !== FixStatus.FIX_3D) {
    return DataQuality.POOR;
  }
  
  // Check accuracy
  if (location.horizontalAccuracy > 10) return DataQuality.POOR;
  if (location.horizontalAccuracy > 5) return DataQuality.FAIR;
  if (location.horizontalAccuracy > 2) return DataQuality.GOOD;
  if (location.horizontalAccuracy <= 2) return DataQuality.EXCELLENT;
  
  return DataQuality.GOOD;
}

// Utility functions
export function getLocationString(data: DeviceData): string {
  if (!data.location) return 'No location data';
  
  const { latitude, longitude, altitude, fixStatus } = data.location;
  const fixStatusText = {
    [FixStatus.NO_FIX]: 'No Fix',
    [FixStatus.FIX_2D]: '2D Fix',
    [FixStatus.FIX_3D]: '3D Fix',
  }[fixStatus];
  
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${altitude.toFixed(1)}m) - ${fixStatusText}`;
}

export function getSpeedString(data: DeviceData): string {
  if (!data.motion) return 'No speed data';
  
  const { speed, heading } = data.motion;
  const speedKmh = speed * 3.6;
  
  return `${speed.toFixed(1)} m/s (${speedKmh.toFixed(1)} km/h) at ${heading.toFixed(1)}°`;
}

export function getSensorString(data: DeviceData): string {
  if (!data.sensors) return 'No sensor data';
  
  const { accelerometer, gyroscope } = data.sensors;
  let result = '';
  
  if (accelerometer) {
    result += `Accel: ${accelerometer.x.toFixed(2)}g, ${accelerometer.y.toFixed(2)}g, ${accelerometer.z.toFixed(2)}g`;
  }
  
  if (gyroscope) {
    if (result) result += ' | ';
    result += `Gyro: ${gyroscope.x.toFixed(2)}°/s, ${gyroscope.y.toFixed(2)}°/s, ${gyroscope.z.toFixed(2)}°/s`;
  }
  
  return result;
} 