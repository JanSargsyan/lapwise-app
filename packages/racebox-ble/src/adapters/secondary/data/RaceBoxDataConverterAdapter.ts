import { DataConverterPort, RawPosition, RawMotion, RawGNSS, RawSystem, RawRecordingStatus, RawMemoryStatus } from '../../../ports/secondary/DataConverterPort';
import { Position, MotionData, GNSSStatus, SystemStatus, SensorData } from '../../../domain/value-objects';
import { FixStatus } from '../../../domain/types/FixStatus';

export class RaceBoxDataConverterAdapter implements DataConverterPort {
  // Position conversion
  convertRawPosition(raw: RawPosition): Position {
    return {
      latitude: raw.latitude / 10000000, // Convert from ×10⁷ to degrees
      longitude: raw.longitude / 10000000, // Convert from ×10⁷ to degrees
      altitude: raw.altitude / 1000, // Convert from mm to meters
      accuracy: raw.accuracy / 1000, // Convert from mm to meters
      timestamp: new Date()
    };
  }

  convertPositionToRaw(position: Position): RawPosition {
    return {
      latitude: Math.round(position.latitude * 10000000), // Convert to ×10⁷
      longitude: Math.round(position.longitude * 10000000), // Convert to ×10⁷
      altitude: Math.round(position.altitude * 1000), // Convert to mm
      accuracy: Math.round(position.accuracy * 1000) // Convert to mm
    };
  }

  // Motion conversion
  convertRawMotion(raw: RawMotion): MotionData {
    return {
      speed: {
        value: (raw.speed / 1000) * 3.6, // Convert from mm/s to km/h
        accuracy: 0.1
      },
      heading: {
        value: raw.heading / 100000, // Convert from ×10⁵ to degrees
        accuracy: 0.1
      },
      gForce: {
        x: raw.gForceX / 1000, // Convert from milli-g to g
        y: raw.gForceY / 1000,
        z: raw.gForceZ / 1000
      },
      rotationRate: {
        x: raw.rotationRateX / 100, // Convert from centi-degrees/s to degrees/s
        y: raw.rotationRateY / 100,
        z: raw.rotationRateZ / 100
      },
      timestamp: new Date()
    };
  }

  convertMotionToRaw(motion: MotionData): RawMotion {
    return {
      speed: Math.round((motion.speed.value / 3.6) * 1000), // Convert from km/h to mm/s
      heading: Math.round(motion.heading.value * 100000), // Convert to ×10⁵
      gForceX: Math.round(motion.gForce.x * 1000), // Convert to milli-g
      gForceY: Math.round(motion.gForce.y * 1000),
      gForceZ: Math.round(motion.gForce.z * 1000),
      rotationRateX: Math.round(motion.rotationRate.x * 100), // Convert to centi-degrees/s
      rotationRateY: Math.round(motion.rotationRate.y * 100),
      rotationRateZ: Math.round(motion.rotationRate.z * 100)
    };
  }

  // GNSS conversion
  convertRawGNSS(raw: RawGNSS): GNSSStatus {
    return {
      fixStatus: raw.fixStatus as FixStatus,
      numSatellites: raw.numSatellites,
      pdop: raw.pdop / 100, // Convert from ×100 to actual value
      horizontalAccuracy: raw.horizontalAccuracy / 1000, // Convert from mm to meters
      verticalAccuracy: raw.verticalAccuracy / 1000 // Convert from mm to meters
    };
  }

  convertGNSSToRaw(gnss: GNSSStatus): RawGNSS {
    return {
      fixStatus: gnss.fixStatus,
      numSatellites: gnss.numSatellites,
      pdop: Math.round(gnss.pdop * 100), // Convert to ×100
      horizontalAccuracy: Math.round(gnss.horizontalAccuracy * 1000), // Convert to mm
      verticalAccuracy: Math.round(gnss.verticalAccuracy * 1000) // Convert to mm
    };
  }

  // System conversion
  convertRawSystem(raw: RawSystem): SystemStatus {
    return {
      batteryLevel: raw.batteryLevel,
      batteryVoltage: raw.batteryLevel * 0.1, // Approximate voltage calculation
      isCharging: raw.isCharging,
      temperature: raw.temperature ?? undefined
    };
  }

  convertSystemToRaw(system: SystemStatus): RawSystem {
    return {
      batteryLevel: system.batteryLevel,
      isCharging: system.isCharging,
      temperature: system.temperature ?? undefined
    };
  }

  // Sensor conversion
  convertRawSensorData(raw: RawMotion): SensorData {
    return {
      gForce: {
        x: raw.gForceX / 1000, // Convert from milli-g to g
        y: raw.gForceY / 1000,
        z: raw.gForceZ / 1000
      },
      rotationRate: {
        x: raw.rotationRateX / 100, // Convert from centi-degrees/s to degrees/s
        y: raw.rotationRateY / 100,
        z: raw.rotationRateZ / 100
      },
      timestamp: new Date()
    };
  }

  convertSensorDataToRaw(sensor: SensorData): RawMotion {
    return {
      speed: 0, // Not applicable for sensor data
      heading: 0, // Not applicable for sensor data
      gForceX: Math.round(sensor.gForce.x * 1000), // Convert to milli-g
      gForceY: Math.round(sensor.gForce.y * 1000),
      gForceZ: Math.round(sensor.gForce.z * 1000),
      rotationRateX: Math.round(sensor.rotationRate.x * 100), // Convert to centi-degrees/s
      rotationRateY: Math.round(sensor.rotationRate.y * 100),
      rotationRateZ: Math.round(sensor.rotationRate.z * 100)
    };
  }

  // Status conversion
  convertRawRecordingStatus(raw: RawRecordingStatus): any {
    return {
      isRecording: raw.isRecording,
      isPaused: raw.isPaused,
      startTime: new Date(raw.startTime * 1000), // Convert from seconds to Date
      duration: raw.duration, // Already in seconds
      dataPoints: raw.dataPoints,
      memoryLevel: raw.memoryLevel // Already in percentage
    };
  }

  convertRawMemoryStatus(raw: RawMemoryStatus): any {
    return {
      totalCapacity: raw.totalCapacity, // Already in bytes
      usedCapacity: raw.usedCapacity, // Already in bytes
      freeCapacity: raw.freeCapacity, // Already in bytes
      memoryLevel: raw.memoryLevel // Already in percentage
    };
  }

  // Utility methods
  validateRawData(raw: any): boolean {
    // Validate position data
    if (raw.latitude !== undefined) {
      if (raw.latitude < -900000000 || raw.latitude > 900000000) {
        return false; // Invalid latitude range
      }
    }

    if (raw.longitude !== undefined) {
      if (raw.longitude < -1800000000 || raw.longitude > 1800000000) {
        return false; // Invalid longitude range
      }
    }

    // Validate motion data
    if (raw.speed !== undefined) {
      if (raw.speed < 0 || raw.speed > 1000000) {
        return false; // Invalid speed range (0-1000 m/s)
      }
    }

    if (raw.heading !== undefined) {
      if (raw.heading < 0 || raw.heading > 36000000) {
        return false; // Invalid heading range (0-360 degrees)
      }
    }

    // Validate GNSS data
    if (raw.fixStatus !== undefined) {
      if (raw.fixStatus < 0 || raw.fixStatus > 3) {
        return false; // Invalid fix status
      }
    }

    if (raw.numSatellites !== undefined) {
      if (raw.numSatellites < 0 || raw.numSatellites > 50) {
        return false; // Invalid satellite count
      }
    }

    // Validate system data
    if (raw.batteryLevel !== undefined) {
      if (raw.batteryLevel < 0 || raw.batteryLevel > 100) {
        return false; // Invalid battery level
      }
    }

    return true;
  }

  sanitizeRawData(raw: any): any {
    const sanitized = { ...raw };

    // Sanitize position data
    if (sanitized.latitude !== undefined) {
      sanitized.latitude = Math.max(-900000000, Math.min(900000000, sanitized.latitude));
    }

    if (sanitized.longitude !== undefined) {
      sanitized.longitude = Math.max(-1800000000, Math.min(1800000000, sanitized.longitude));
    }

    // Sanitize motion data
    if (sanitized.speed !== undefined) {
      sanitized.speed = Math.max(0, Math.min(1000000, sanitized.speed));
    }

    if (sanitized.heading !== undefined) {
      sanitized.heading = Math.max(0, Math.min(36000000, sanitized.heading));
    }

    // Sanitize GNSS data
    if (sanitized.fixStatus !== undefined) {
      sanitized.fixStatus = Math.max(0, Math.min(3, sanitized.fixStatus));
    }

    if (sanitized.numSatellites !== undefined) {
      sanitized.numSatellites = Math.max(0, Math.min(50, sanitized.numSatellites));
    }

    // Sanitize system data
    if (sanitized.batteryLevel !== undefined) {
      sanitized.batteryLevel = Math.max(0, Math.min(100, sanitized.batteryLevel));
    }

    return sanitized;
  }

  // Helper method to convert from Uint8Array to raw data
  convertPacketToRawData(packet: Uint8Array): any {
    const dataView = new DataView(packet.buffer, packet.byteOffset, packet.byteLength);
    let offset = 0;

    // Parse based on packet type (this would be determined by message ID)
    // For now, assume it's a live data packet
    const rawData: any = {};

    // Position data (16 bytes)
    rawData.latitude = dataView.getInt32(offset, true);
    offset += 4;
    rawData.longitude = dataView.getInt32(offset, true);
    offset += 4;
    rawData.altitude = dataView.getInt32(offset, true);
    offset += 4;
    rawData.accuracy = dataView.getUint32(offset, true);
    offset += 4;

    // Motion data
    rawData.speed = dataView.getUint32(offset, true);
    offset += 4;
    rawData.heading = dataView.getUint32(offset, true);
    offset += 4;

    // GNSS status
    rawData.fixStatus = dataView.getUint8(offset);
    offset += 1;
    rawData.numSatellites = dataView.getUint8(offset);
    offset += 1;
    rawData.pdop = dataView.getUint16(offset, true);
    offset += 2;

    // System status
    rawData.batteryLevel = dataView.getUint8(offset);
    offset += 1;
    rawData.isCharging = (dataView.getUint8(offset) & 0x01) !== 0;
    offset += 1;

    return rawData;
  }
} 