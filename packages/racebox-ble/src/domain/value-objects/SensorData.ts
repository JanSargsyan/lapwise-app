import { GForce } from './GForce';
import { RotationRate } from './RotationRate';

export interface SensorData {
  gForce: GForce;
  rotationRate: RotationRate;
  timestamp: Date;
}

export class SensorDataValueObject {
  constructor(
    public readonly gForce: GForce,
    public readonly rotationRate: RotationRate,
    public readonly timestamp: Date = new Date()
  ) {}

  public toInterface(): SensorData {
    return {
      gForce: this.gForce.toInterface(),
      rotationRate: this.rotationRate.toInterface(),
      timestamp: this.timestamp
    };
  }

  public static fromInterface(sensorData: SensorData): SensorDataValueObject {
    return new SensorDataValueObject(
      GForce.fromInterface(sensorData.gForce),
      RotationRate.fromInterface(sensorData.rotationRate),
      sensorData.timestamp
    );
  }

  public static fromRawData(
    gForceXRaw: number,
    gForceYRaw: number,
    gForceZRaw: number,
    rotationRateXRaw: number,
    rotationRateYRaw: number,
    rotationRateZRaw: number
  ): SensorDataValueObject {
    const gForce = GForce.fromRawData(gForceXRaw, gForceYRaw, gForceZRaw);
    const rotationRate = RotationRate.fromRawData(rotationRateXRaw, rotationRateYRaw, rotationRateZRaw);

    return new SensorDataValueObject(gForce, rotationRate);
  }

  public equals(other: SensorDataValueObject): boolean {
    return (
      this.gForce.equals(other.gForce) &&
      this.rotationRate.equals(other.rotationRate)
    );
  }

  public toString(): string {
    return `G-Force: ${this.gForce.toString()}, Rotation: ${this.rotationRate.toString()}`;
  }

  public isStationary(): boolean {
    return this.gForce.isStationary() && this.rotationRate.isStationary();
  }

  public getAccelerationMagnitude(): number {
    return this.gForce.getMagnitude();
  }

  public getRotationMagnitude(): number {
    return this.rotationRate.getMagnitude();
  }
} 