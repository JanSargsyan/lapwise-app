import { Position, MotionData, GNSSStatus, SystemStatus, SensorData } from '../value-objects';

export interface LiveDataMessage {
  timestamp: Date;
  position: Position;
  motion: MotionData;
  gnssStatus: GNSSStatus;
  systemStatus: SystemStatus;
  sensorData: SensorData;
}

export class LiveDataMessageEntity {
  constructor(
    public readonly timestamp: Date,
    public readonly position: Position,
    public readonly motion: MotionData,
    public readonly gnssStatus: GNSSStatus,
    public readonly systemStatus: SystemStatus,
    public readonly sensorData: SensorData
  ) {}

  public toInterface(): LiveDataMessage {
    return {
      timestamp: this.timestamp,
      position: this.position,
      motion: this.motion,
      gnssStatus: this.gnssStatus,
      systemStatus: this.systemStatus,
      sensorData: this.sensorData
    };
  }

  public static fromRawData(rawData: Uint8Array): LiveDataMessageEntity {
    // Simplified parsing - in a real implementation, this would parse the raw bytes
    const dataView = new DataView(rawData.buffer, rawData.byteOffset, rawData.byteLength);
    let offset = 0;

    // Parse position data (16 bytes)
    const latitude = dataView.getInt32(offset, true) / 10000000;
    offset += 4;
    const longitude = dataView.getInt32(offset, true) / 10000000;
    offset += 4;
    const altitude = dataView.getInt32(offset, true) / 1000;
    offset += 4;
    const accuracy = dataView.getUint32(offset, true) / 1000;
    offset += 4;

    // Parse motion data
    const speed = dataView.getUint32(offset, true);
    offset += 4;
    const heading = dataView.getUint32(offset, true);
    offset += 4;

    // Parse GNSS status
    const fixStatus = dataView.getUint8(offset);
    offset += 1;
    const numSatellites = dataView.getUint8(offset);
    offset += 1;
    const pdop = dataView.getUint16(offset, true) / 100;
    offset += 2;

    // Parse system status
    const batteryLevel = dataView.getUint8(offset);
    offset += 1;
    const isCharging = (dataView.getUint8(offset) & 0x01) !== 0;
    offset += 1;

    // Create LiveDataMessage
    const liveDataMessage: LiveDataMessage = {
      timestamp: new Date(),
      position: {
        latitude,
        longitude,
        altitude,
        accuracy,
        timestamp: new Date()
      },
      motion: {
        speed: { value: (speed / 1000) * 3.6, accuracy: 0.1 },
        heading: { value: heading / 100000, accuracy: 0.1 },
        gForce: { x: 0, y: 0, z: 0 },
        rotationRate: { x: 0, y: 0, z: 0 },
        timestamp: new Date()
      },
      gnssStatus: {
        fixStatus,
        numSatellites,
        pdop,
        horizontalAccuracy: accuracy,
        verticalAccuracy: accuracy
      },
      systemStatus: {
        batteryLevel,
        batteryVoltage: batteryLevel * 0.1,
        isCharging,
        temperature: undefined
      },
      sensorData: {
        gForce: { x: 0, y: 0, z: 0 },
        rotationRate: { x: 0, y: 0, z: 0 },
        timestamp: new Date()
      }
    };

    return new LiveDataMessageEntity(
      liveDataMessage.timestamp,
      liveDataMessage.position,
      liveDataMessage.motion,
      liveDataMessage.gnssStatus,
      liveDataMessage.systemStatus,
      liveDataMessage.sensorData
    );
  }

  public equals(other: LiveDataMessageEntity): boolean {
    return (
      this.timestamp.getTime() === other.timestamp.getTime() &&
      this.position.latitude === other.position.latitude &&
      this.position.longitude === other.position.longitude &&
      this.position.altitude === other.position.altitude &&
      this.position.accuracy === other.position.accuracy &&
      this.motion.speed.value === other.motion.speed.value &&
      this.motion.heading.value === other.motion.heading.value &&
      this.gnssStatus.fixStatus === other.gnssStatus.fixStatus &&
      this.gnssStatus.numSatellites === other.gnssStatus.numSatellites &&
      this.gnssStatus.pdop === other.gnssStatus.pdop &&
      this.systemStatus.batteryLevel === other.systemStatus.batteryLevel &&
      this.systemStatus.isCharging === other.systemStatus.isCharging
    );
  }

  public toString(): string {
    return `LiveDataMessage(${this.timestamp.toISOString()}, ${this.position.latitude.toFixed(6)}, ${this.position.longitude.toFixed(6)}, ${this.motion.speed.value.toFixed(1)} km/h)`;
  }

  public hasValidPosition(): boolean {
    return this.position.accuracy <= 10; // Less than 10 meters accuracy
  }

  public getDataQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 0;

    // Position quality
    if (this.position.accuracy <= 2) score += 3;
    else if (this.position.accuracy <= 5) score += 2;
    else if (this.position.accuracy <= 10) score += 1;

    // GNSS quality
    if (this.gnssStatus.fixStatus === 3) score += 3;
    else if (this.gnssStatus.fixStatus === 2) score += 2;
    else if (this.gnssStatus.fixStatus === 0) score += 1;

    // Satellite count
    if (this.gnssStatus.numSatellites >= 10) score += 2;
    else if (this.gnssStatus.numSatellites >= 6) score += 1;

    // PDOP quality
    if (this.gnssStatus.pdop <= 1.5) score += 2;
    else if (this.gnssStatus.pdop <= 3.0) score += 1;

    if (score >= 8) return 'excellent';
    if (score >= 6) return 'good';
    if (score >= 4) return 'fair';
    return 'poor';
  }
} 