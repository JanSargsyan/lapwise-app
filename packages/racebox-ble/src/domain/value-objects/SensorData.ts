import { GForce, GForceValueObject } from './GForce';
import { RotationRate, RotationRateValueObject } from './RotationRate';

export interface SensorData {
  gForce: GForce;
  rotationRate: RotationRate;
  timestamp: Date;
}

export class SensorDataValueObject {
  constructor(
    public readonly gForce: GForceValueObject,
    public readonly rotationRate: RotationRateValueObject,
    public readonly timestamp: Date
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
      new GForceValueObject(sensorData.gForce.x, sensorData.gForce.y, sensorData.gForce.z),
      new RotationRateValueObject(sensorData.rotationRate.x, sensorData.rotationRate.y, sensorData.rotationRate.z),
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
    const gForce = GForceValueObject.fromRawData(gForceXRaw, gForceYRaw, gForceZRaw);
    const rotationRate = RotationRateValueObject.fromRawData(rotationRateXRaw, rotationRateYRaw, rotationRateZRaw);

    return new SensorDataValueObject(
      gForce,
      rotationRate,
      new Date()
    );
  }

  public equals(other: SensorDataValueObject): boolean {
    return (
      this.gForce.equals(other.gForce) &&
      this.rotationRate.equals(other.rotationRate)
    );
  }

  public toString(): string {
    return `SensorData(${this.gForce.toString()}, ${this.rotationRate.toString()})`;
  }

  public isStationary(): boolean {
    return this.gForce.isStationary() && this.rotationRate.isStationary();
  }

  public getGForceMagnitude(): number {
    return this.gForce.getMagnitude();
  }

  public getRotationMagnitude(): number {
    return this.rotationRate.getMagnitude();
  }
} 