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
    // Rotation rates can be negative and typically range from -500 to +500 deg/s
    if (Math.abs(this.x) > 1000 || Math.abs(this.y) > 1000 || Math.abs(this.z) > 1000) {
      throw new Error('Rotation rate values are outside reasonable range (-1000 to +1000 deg/s)');
    }
  }

  public toInterface(): RotationRate {
    return {
      x: this.x,
      y: this.y,
      z: this.z
    };
  }

  public static fromInterface(rotationRate: RotationRate): RotationRateValueObject {
    return new RotationRateValueObject(rotationRate.x, rotationRate.y, rotationRate.z);
  }

  public static fromRawData(xRaw: number, yRaw: number, zRaw: number): RotationRateValueObject {
    // Convert from centi-degrees/second to degrees/second
    const x = xRaw / 100;
    const y = yRaw / 100;
    const z = zRaw / 100;

    return new RotationRateValueObject(x, y, z);
  }

  public equals(other: RotationRateValueObject): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  public toString(): string {
    return `X: ${this.x.toFixed(2)}°/s, Y: ${this.y.toFixed(2)}°/s, Z: ${this.z.toFixed(2)}°/s`;
  }

  public getMagnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  public toRadiansPerSecond(): number {
    return this.getMagnitude() * (Math.PI / 180);
  }

  public isStationary(): boolean {
    const magnitude = this.getMagnitude();
    return magnitude < 1.0; // Less than 1 deg/s
  }
} 