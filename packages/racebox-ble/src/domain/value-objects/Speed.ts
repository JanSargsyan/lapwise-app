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
      throw new Error('Speed must be non-negative');
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

  public static fromInterface(speed: Speed): SpeedValueObject {
    return new SpeedValueObject(speed.value, speed.accuracy);
  }

  public static fromRawData(speedRaw: number, accuracyRaw: number): SpeedValueObject {
    // Convert from mm/s to km/h
    const value = (speedRaw / 1000) * 3.6; // mm/s to km/h
    const accuracy = (accuracyRaw / 1000) * 3.6; // mm/s to km/h

    return new SpeedValueObject(value, accuracy);
  }

  public equals(other: SpeedValueObject): boolean {
    return this.value === other.value && this.accuracy === other.accuracy;
  }

  public toString(): string {
    return `${this.value.toFixed(1)} km/h ±${this.accuracy.toFixed(1)} km/h`;
  }

  public toMph(): number {
    return this.value * 0.621371; // km/h to mph
  }

  public toMps(): number {
    return this.value / 3.6; // km/h to m/s
  }
} 