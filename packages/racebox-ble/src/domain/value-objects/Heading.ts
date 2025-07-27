export interface Heading {
  value: number; // degrees
  accuracy: number; // degrees
}

export class HeadingValueObject {
  constructor(
    public readonly value: number,
    public readonly accuracy: number
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.value < 0 || this.value > 360) {
      throw new Error('Heading must be between 0 and 360 degrees');
    }
    if (this.accuracy < 0) {
      throw new Error('Heading accuracy must be non-negative');
    }
  }

  public toInterface(): Heading {
    return {
      value: this.value,
      accuracy: this.accuracy
    };
  }

  public static fromInterface(heading: Heading): HeadingValueObject {
    return new HeadingValueObject(heading.value, heading.accuracy);
  }

  public static fromRawData(headingRaw: number, accuracyRaw: number): HeadingValueObject {
    // Convert from ×10⁵ degrees to degrees
    const value = headingRaw / 100000;
    const accuracy = accuracyRaw / 100000;

    return new HeadingValueObject(value, accuracy);
  }

  public equals(other: HeadingValueObject): boolean {
    return this.value === other.value && this.accuracy === other.accuracy;
  }

  public toString(): string {
    return `${this.value.toFixed(1)}° ±${this.accuracy.toFixed(1)}°`;
  }

  public toRadians(): number {
    return (this.value * Math.PI) / 180;
  }

  public getDirection(): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(this.value / 22.5) % 16;
    return directions[index];
  }
} 