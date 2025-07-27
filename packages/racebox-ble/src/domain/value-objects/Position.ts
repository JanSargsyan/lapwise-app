export interface Position {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  timestamp: Date;
}

export class PositionValueObject {
  constructor(
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly altitude: number,
    public readonly accuracy: number,
    public readonly timestamp: Date = new Date()
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.latitude < -90 || this.latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    if (this.longitude < -180 || this.longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }
    if (this.accuracy < 0) {
      throw new Error('Accuracy must be non-negative');
    }
  }

  public toInterface(): Position {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      altitude: this.altitude,
      accuracy: this.accuracy,
      timestamp: this.timestamp
    };
  }

  public static fromInterface(position: Position): PositionValueObject {
    return new PositionValueObject(
      position.latitude,
      position.longitude,
      position.altitude,
      position.accuracy,
      position.timestamp
    );
  }

  public static fromRawData(
    latitudeRaw: number,
    longitudeRaw: number,
    altitudeRaw: number,
    accuracyRaw: number
  ): PositionValueObject {
    // Convert raw values (×10⁷ for lat/lon, mm for altitude/accuracy)
    const latitude = latitudeRaw / 10000000;
    const longitude = longitudeRaw / 10000000;
    const altitude = altitudeRaw / 1000; // mm to meters
    const accuracy = accuracyRaw / 1000; // mm to meters

    return new PositionValueObject(latitude, longitude, altitude, accuracy);
  }

  public equals(other: PositionValueObject): boolean {
    return (
      this.latitude === other.latitude &&
      this.longitude === other.longitude &&
      this.altitude === other.altitude &&
      this.accuracy === other.accuracy
    );
  }

  public toString(): string {
    return `${this.latitude.toFixed(6)}, ${this.longitude.toFixed(6)} (${this.altitude.toFixed(1)}m ±${this.accuracy.toFixed(1)}m)`;
  }
} 