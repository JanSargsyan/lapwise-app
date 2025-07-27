import { FixStatus } from '../types/FixStatus';

export interface GNSSStatus {
  fixStatus: FixStatus;
  numSatellites: number;
  pdop: number;
  horizontalAccuracy: number;
  verticalAccuracy: number;
}

export class GNSSStatusValueObject {
  constructor(
    public readonly fixStatus: FixStatus,
    public readonly numSatellites: number,
    public readonly pdop: number,
    public readonly horizontalAccuracy: number,
    public readonly verticalAccuracy: number
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.numSatellites < 0) {
      throw new Error('Number of satellites must be non-negative');
    }
    if (this.pdop < 0) {
      throw new Error('PDOP must be non-negative');
    }
    if (this.horizontalAccuracy < 0) {
      throw new Error('Horizontal accuracy must be non-negative');
    }
    if (this.verticalAccuracy < 0) {
      throw new Error('Vertical accuracy must be non-negative');
    }
  }

  public toInterface(): GNSSStatus {
    return {
      fixStatus: this.fixStatus,
      numSatellites: this.numSatellites,
      pdop: this.pdop,
      horizontalAccuracy: this.horizontalAccuracy,
      verticalAccuracy: this.verticalAccuracy
    };
  }

  public static fromInterface(gnssStatus: GNSSStatus): GNSSStatusValueObject {
    return new GNSSStatusValueObject(
      gnssStatus.fixStatus,
      gnssStatus.numSatellites,
      gnssStatus.pdop,
      gnssStatus.horizontalAccuracy,
      gnssStatus.verticalAccuracy
    );
  }

  public static fromRawData(
    fixStatusRaw: number,
    numSatellitesRaw: number,
    pdopRaw: number,
    horizontalAccuracyRaw: number,
    verticalAccuracyRaw: number
  ): GNSSStatusValueObject {
    // Convert raw values
    const fixStatus = fixStatusRaw as FixStatus;
    const numSatellites = numSatellitesRaw;
    const pdop = pdopRaw / 100; // ×100 to actual value
    const horizontalAccuracy = horizontalAccuracyRaw / 1000; // mm to meters
    const verticalAccuracy = verticalAccuracyRaw / 1000; // mm to meters

    return new GNSSStatusValueObject(
      fixStatus,
      numSatellites,
      pdop,
      horizontalAccuracy,
      verticalAccuracy
    );
  }

  public equals(other: GNSSStatusValueObject): boolean {
    return (
      this.fixStatus === other.fixStatus &&
      this.numSatellites === other.numSatellites &&
      this.pdop === other.pdop &&
      this.horizontalAccuracy === other.horizontalAccuracy &&
      this.verticalAccuracy === other.verticalAccuracy
    );
  }

  public toString(): string {
    return `Fix: ${this.fixStatus}, Sats: ${this.numSatellites}, PDOP: ${this.pdop.toFixed(2)}, H-Acc: ${this.horizontalAccuracy.toFixed(2)}m, V-Acc: ${this.verticalAccuracy.toFixed(2)}m`;
  }

  public hasFix(): boolean {
    return this.fixStatus !== FixStatus.NO_FIX;
  }

  public hasGoodAccuracy(): boolean {
    return this.horizontalAccuracy < 5.0; // Less than 5 meters
  }

  public getQualityLevel(): 'excellent' | 'good' | 'fair' | 'poor' {
    if (this.horizontalAccuracy < 1.0 && this.pdop < 2.0) return 'excellent';
    if (this.horizontalAccuracy < 3.0 && this.pdop < 4.0) return 'good';
    if (this.horizontalAccuracy < 10.0 && this.pdop < 6.0) return 'fair';
    return 'poor';
  }
} 