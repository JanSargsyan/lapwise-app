export interface RotationRate {
  x: number; // degrees/second
  y: number; // degrees/second
  z: number; // degrees/second
}

export class RotationRateValueObject {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.x < -1000 || this.x > 1000) {
      throw new Error('Rotation rate X component must be between -1000 and 1000 deg/s');
    }
    if (this.y < -1000 || this.y > 1000) {
      throw new Error('Rotation rate Y component must be between -1000 and 1000 deg/s');
    }
    if (this.z < -1000 || this.z > 1000) {
      throw new Error('Rotation rate Z component must be between -1000 and 1000 deg/s');
    }
  }

  public toInterface(): RotationRate {
    return {
      x: this.x,
      y: this.y,
      z: this.z
    };
  }

  public static fromRawData(xRaw: number, yRaw: number, zRaw: number): RotationRateValueObject {
    return new RotationRateValueObject(xRaw / 100, yRaw / 100, zRaw / 100);
  }

  public equals(other: RotationRateValueObject): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  public toString(): string {
    return `RotationRate(${this.x.toFixed(2)}°/s, ${this.y.toFixed(2)}°/s, ${this.z.toFixed(2)}°/s)`;
  }

  public getMagnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  public isStationary(): boolean {
    return this.getMagnitude() < 1.0; // Less than 1 deg/s total rotation
  }
} 