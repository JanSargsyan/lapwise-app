export interface Speed {
  value: number; // km/h
  accuracy: number; // km/h
}

export class SpeedValueObject {
  constructor(
    public readonly value: number,
    public readonly accuracy: number
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.value < 0) {
      throw new Error('Speed value must be non-negative');
    }
    if (this.accuracy < 0) {
      throw new Error('Speed accuracy must be non-negative');
    }
  }

  public toInterface(): Speed {
    return {
      value: this.value,
      accuracy: this.accuracy
    };
  }

  public static fromRawData(speedRaw: number, accuracyRaw: number): SpeedValueObject {
    return new SpeedValueObject(speedRaw / 1000, accuracyRaw / 1000);
  }

  public equals(other: SpeedValueObject): boolean {
    return this.value === other.value && this.accuracy === other.accuracy;
  }

  public toString(): string {
    return `Speed(${this.value} km/h ± ${this.accuracy} km/h)`;
  }

  public toMph(): number {
    return this.value * 0.621371; // km/h to mph
  }

  public toMps(): number {
    return this.value / 3.6; // km/h to m/s
  }
} 