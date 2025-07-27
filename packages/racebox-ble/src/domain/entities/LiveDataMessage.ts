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

  public static fromInterface(liveDataMessage: LiveDataMessage): LiveDataMessageEntity {
    return new LiveDataMessageEntity(
      liveDataMessage.timestamp,
      liveDataMessage.position,
      liveDataMessage.motion,
      liveDataMessage.gnssStatus,
      liveDataMessage.systemStatus,
      liveDataMessage.sensorData
    );
  }

  public static fromRawData(rawData: Uint8Array): LiveDataMessageEntity {
    // Parse raw data according to RaceBox protocol
    // This is a simplified implementation - actual parsing would be more complex
    
    const dataView = new DataView(rawData.buffer, rawData.byteOffset, rawData.byteLength);
    let offset = 0;

    // Parse position data (assuming 16 bytes)
    const latitude = dataView.getInt32(offset, true) / 10000000;
    offset += 4;
    const longitude = dataView.getInt32(offset, true) / 10000000;
    offset += 4;
    const altitude = dataView.getInt32(offset, true) / 1000;
    offset += 4;
    const accuracy = dataView.getUint32(offset, true) / 1000;
    offset += 4;

    // Parse motion data (simplified)
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

    // Create value objects
    const position = {
      latitude,
      longitude,
      altitude,
      accuracy,
      timestamp: new Date()
    };

    const motion = {
      speed: { value: (speed / 1000) * 3.6, accuracy: 0.1 },
      heading: { value: heading / 100000, accuracy: 0.1 },
      gForce: { x: 0, y: 0, z: 0 },
      rotationRate: { x: 0, y: 0, z: 0 },
      timestamp: new Date()
    };

    const gnssStatus = {
      fixStatus,
      numSatellites,
      pdop,
      horizontalAccuracy: accuracy,
      verticalAccuracy: accuracy
    };

    const systemStatus = {
      batteryLevel,
      isCharging,
      temperature: undefined
    };

    const sensorData = {
      gForce: { x: 0, y: 0, z: 0 },
      rotationRate: { x: 0, y: 0, z: 0 },
      timestamp: new Date()
    };

    return new LiveDataMessageEntity(
      new Date(),
      position,
      motion,
      gnssStatus,
      systemStatus,
      sensorData
    );
  }

  public equals(other: LiveDataMessageEntity): boolean {
    return (
      this.timestamp.getTime() === other.timestamp.getTime() &&
      this.position.latitude === other.position.latitude &&
      this.position.longitude === other.position.longitude &&
      this.motion.speed.value === other.motion.speed.value &&
      this.motion.heading.value === other.motion.heading.value &&
      this.gnssStatus.fixStatus === other.gnssStatus.fixStatus &&
      this.systemStatus.batteryLevel === other.systemStatus.batteryLevel
    );
  }

  public toString(): string {
    return `LiveData[${this.timestamp.toISOString()}] - Pos: ${this.position.latitude.toFixed(6)}, ${this.position.longitude.toFixed(6)}, Speed: ${this.motion.speed.value.toFixed(1)} km/h, Battery: ${this.systemStatus.batteryLevel}%`;
  }

  public hasValidPosition(): boolean {
    return this.gnssStatus.fixStatus !== 0 && this.position.accuracy < 10;
  }

  public isMoving(): boolean {
    return this.motion.speed.value > 1.0; // More than 1 km/h
  }

  public getDataQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (this.hasValidPosition() && this.position.accuracy < 2 && this.gnssStatus.numSatellites >= 8) {
      return 'excellent';
    }
    if (this.hasValidPosition() && this.position.accuracy < 5 && this.gnssStatus.numSatellites >= 6) {
      return 'good';
    }
    if (this.hasValidPosition() && this.position.accuracy < 10) {
      return 'fair';
    }
    return 'poor';
  }
} 