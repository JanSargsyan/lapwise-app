import { Speed, SpeedValueObject } from './Speed';
import { Heading, HeadingValueObject } from './Heading';
import { GForce, GForceValueObject } from './GForce';
import { RotationRate, RotationRateValueObject } from './RotationRate';

export interface MotionData {
  speed: Speed;
  heading: Heading;
  gForce: GForce;
  rotationRate: RotationRate;
  timestamp: Date;
}

export class MotionDataValueObject {
  constructor(
    public readonly speed: SpeedValueObject,
    public readonly heading: HeadingValueObject,
    public readonly gForce: GForceValueObject,
    public readonly rotationRate: RotationRateValueObject,
    public readonly timestamp: Date
  ) {}

  public toInterface(): MotionData {
    return {
      speed: this.speed.toInterface(),
      heading: this.heading.toInterface(),
      gForce: this.gForce.toInterface(),
      rotationRate: this.rotationRate.toInterface(),
      timestamp: this.timestamp
    };
  }

  public static fromInterface(motionData: MotionData): MotionDataValueObject {
    return new MotionDataValueObject(
      new SpeedValueObject(motionData.speed.value, motionData.speed.accuracy),
      new HeadingValueObject(motionData.heading.value, motionData.heading.accuracy),
      new GForceValueObject(motionData.gForce.x, motionData.gForce.y, motionData.gForce.z),
      new RotationRateValueObject(motionData.rotationRate.x, motionData.rotationRate.y, motionData.rotationRate.z),
      motionData.timestamp
    );
  }

  public static fromRawData(
    speedRaw: number,
    speedAccuracyRaw: number,
    headingRaw: number,
    headingAccuracyRaw: number,
    gForceXRaw: number,
    gForceYRaw: number,
    gForceZRaw: number,
    rotationRateXRaw: number,
    rotationRateYRaw: number,
    rotationRateZRaw: number
  ): MotionDataValueObject {
    const speed = SpeedValueObject.fromRawData(speedRaw, speedAccuracyRaw);
    const heading = HeadingValueObject.fromRawData(headingRaw, headingAccuracyRaw);
    const gForce = GForceValueObject.fromRawData(gForceXRaw, gForceYRaw, gForceZRaw);
    const rotationRate = RotationRateValueObject.fromRawData(rotationRateXRaw, rotationRateYRaw, rotationRateZRaw);

    return new MotionDataValueObject(
      speed,
      heading,
      gForce,
      rotationRate,
      new Date()
    );
  }

  public equals(other: MotionDataValueObject): boolean {
    return (
      this.speed.equals(other.speed) &&
      this.heading.equals(other.heading) &&
      this.gForce.equals(other.gForce) &&
      this.rotationRate.equals(other.rotationRate)
    );
  }

  public toString(): string {
    return `MotionData(${this.speed.toString()}, ${this.heading.toString()}, ${this.gForce.toString()}, ${this.rotationRate.toString()})`;
  }
} 