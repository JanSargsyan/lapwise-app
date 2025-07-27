import { Speed } from './Speed';
import { Heading } from './Heading';
import { GForce } from './GForce';
import { RotationRate } from './RotationRate';

export interface MotionData {
  speed: Speed;
  heading: Heading;
  gForce: GForce;
  rotationRate: RotationRate;
  timestamp: Date;
}

export class MotionDataValueObject {
  constructor(
    public readonly speed: Speed,
    public readonly heading: Heading,
    public readonly gForce: GForce,
    public readonly rotationRate: RotationRate,
    public readonly timestamp: Date = new Date()
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
      Speed.fromInterface(motionData.speed),
      Heading.fromInterface(motionData.heading),
      GForce.fromInterface(motionData.gForce),
      RotationRate.fromInterface(motionData.rotationRate),
      motionData.timestamp
    );
  }

  public static fromRawData(
    speedRaw: number,
    headingRaw: number,
    gForceXRaw: number,
    gForceYRaw: number,
    gForceZRaw: number,
    rotationRateXRaw: number,
    rotationRateYRaw: number,
    rotationRateZRaw: number
  ): MotionDataValueObject {
    // Convert raw values
    const speed = Speed.fromRawData(speedRaw);
    const heading = Heading.fromRawData(headingRaw);
    const gForce = GForce.fromRawData(gForceXRaw, gForceYRaw, gForceZRaw);
    const rotationRate = RotationRate.fromRawData(rotationRateXRaw, rotationRateYRaw, rotationRateZRaw);

    return new MotionDataValueObject(speed, heading, gForce, rotationRate);
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
    return `Speed: ${this.speed.toString()}, Heading: ${this.heading.toString()}, G-Force: ${this.gForce.toString()}, Rotation: ${this.rotationRate.toString()}`;
  }
} 