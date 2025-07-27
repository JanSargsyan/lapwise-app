export interface GForce {
  x: number; // g
  y: number; // g
  z: number; // g
}

export class GForceValueObject {
  constructor(
    public readonly x: number,
    public readonly y: number,
    public readonly z: number
  ) {
    this.validate();
  }

  private validate(): void {
    // G-force values can be negative and typically range from -10g to +10g
    if (Math.abs(this.x) > 20 || Math.abs(this.y) > 20 || Math.abs(this.z) > 20) {
      throw new Error('G-force values are outside reasonable range (-20g to +20g)');
    }
  }

  public toInterface(): GForce {
    return {
      x: this.x,
      y: this.y,
      z: this.z
    };
  }

  public static fromInterface(gForce: GForce): GForceValueObject {
    return new GForceValueObject(gForce.x, gForce.y, gForce.z);
  }

  public static fromRawData(xRaw: number, yRaw: number, zRaw: number): GForceValueObject {
    // Convert from milli-g to g
    const x = xRaw / 1000;
    const y = yRaw / 1000;
    const z = zRaw / 1000;

    return new GForceValueObject(x, y, z);
  }

  public equals(other: GForceValueObject): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  public toString(): string {
    return `X: ${this.x.toFixed(3)}g, Y: ${this.y.toFixed(3)}g, Z: ${this.z.toFixed(3)}g`;
  }

  public getMagnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  public getTotalGForce(): number {
    return this.getMagnitude();
  }

  public isStationary(): boolean {
    const magnitude = this.getMagnitude();
    return Math.abs(magnitude - 1.0) < 0.1; // Within 0.1g of 1g
  }
} 