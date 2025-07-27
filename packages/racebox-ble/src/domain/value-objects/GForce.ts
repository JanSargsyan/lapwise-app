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
    if (this.x < -10 || this.x > 10) {
      throw new Error('G-force X component must be between -10 and 10 g');
    }
    if (this.y < -10 || this.y > 10) {
      throw new Error('G-force Y component must be between -10 and 10 g');
    }
    if (this.z < -10 || this.z > 10) {
      throw new Error('G-force Z component must be between -10 and 10 g');
    }
  }

  public toInterface(): GForce {
    return {
      x: this.x,
      y: this.y,
      z: this.z
    };
  }

  public static fromRawData(xRaw: number, yRaw: number, zRaw: number): GForceValueObject {
    return new GForceValueObject(xRaw / 1000, yRaw / 1000, zRaw / 1000);
  }

  public equals(other: GForceValueObject): boolean {
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  public toString(): string {
    return `GForce(${this.x.toFixed(3)}g, ${this.y.toFixed(3)}g, ${this.z.toFixed(3)}g)`;
  }

  public getMagnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  public isStationary(): boolean {
    return this.getMagnitude() < 0.1; // Less than 0.1g total acceleration
  }
} 