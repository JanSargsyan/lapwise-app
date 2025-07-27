import { DataRate } from '../types/DataRate';

export interface RecordingFilters {
  minSpeed?: number; // km/h
  maxSpeed?: number; // km/h
  minAccuracy?: number; // meters
  enableAccelerometer?: boolean;
  enableGyroscope?: boolean;
  enableMagnetometer?: boolean;
}

export interface RecordingThresholds {
  speedThreshold?: number; // km/h
  accelerationThreshold?: number; // g
  rotationThreshold?: number; // deg/s
}

export interface RecordingTimeouts {
  startDelay?: number; // seconds
  stopDelay?: number; // seconds
  autoStop?: number; // seconds (0 = disabled)
}

export interface RecordingConfiguration {
  enabled: boolean;
  dataRate: DataRate;
  filters: RecordingFilters;
  thresholds: RecordingThresholds;
  timeouts: RecordingTimeouts;
}

export class RecordingConfigurationEntity {
  constructor(
    public readonly enabled: boolean,
    public readonly dataRate: DataRate,
    public readonly filters: RecordingFilters,
    public readonly thresholds: RecordingThresholds,
    public readonly timeouts: RecordingTimeouts
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.thresholds.speedThreshold !== undefined && this.thresholds.speedThreshold < 0) {
      throw new Error('Speed threshold must be non-negative');
    }
    if (this.thresholds.accelerationThreshold !== undefined && this.thresholds.accelerationThreshold < 0) {
      throw new Error('Acceleration threshold must be non-negative');
    }
    if (this.thresholds.rotationThreshold !== undefined && this.thresholds.rotationThreshold < 0) {
      throw new Error('Rotation threshold must be non-negative');
    }
    if (this.timeouts.startDelay !== undefined && this.timeouts.startDelay < 0) {
      throw new Error('Start delay must be non-negative');
    }
    if (this.timeouts.stopDelay !== undefined && this.timeouts.stopDelay < 0) {
      throw new Error('Stop delay must be non-negative');
    }
    if (this.timeouts.autoStop !== undefined && this.timeouts.autoStop < 0) {
      throw new Error('Auto stop timeout must be non-negative');
    }
  }

  public toInterface(): RecordingConfiguration {
    return {
      enabled: this.enabled,
      dataRate: this.dataRate,
      filters: this.filters,
      thresholds: this.thresholds,
      timeouts: this.timeouts
    };
  }

  public static fromInterface(config: RecordingConfiguration): RecordingConfigurationEntity {
    return new RecordingConfigurationEntity(
      config.enabled,
      config.dataRate,
      config.filters,
      config.thresholds,
      config.timeouts
    );
  }

  public static createDefault(): RecordingConfigurationEntity {
    return new RecordingConfigurationEntity(
      false, // disabled by default
      DataRate.RATE_10HZ,
      {
        minSpeed: 0,
        maxSpeed: 300,
        minAccuracy: 5,
        enableAccelerometer: true,
        enableGyroscope: true,
        enableMagnetometer: false
      },
      {
        speedThreshold: 1.0,
        accelerationThreshold: 0.1,
        rotationThreshold: 1.0
      },
      {
        startDelay: 0,
        stopDelay: 0,
        autoStop: 0
      }
    );
  }

  public equals(other: RecordingConfigurationEntity): boolean {
    return (
      this.enabled === other.enabled &&
      this.dataRate === other.dataRate &&
      JSON.stringify(this.filters) === JSON.stringify(other.filters) &&
      JSON.stringify(this.thresholds) === JSON.stringify(other.thresholds) &&
      JSON.stringify(this.timeouts) === JSON.stringify(other.timeouts)
    );
  }

  public toString(): string {
    return `RecordingConfig[enabled: ${this.enabled}, rate: ${this.dataRate}, filters: ${JSON.stringify(this.filters)}]`;
  }

  public isConfigured(): boolean {
    return this.enabled && this.dataRate !== undefined;
  }

  public getDataRateHz(): number {
    const rates = {
      [DataRate.RATE_25HZ]: 25,
      [DataRate.RATE_10HZ]: 10,
      [DataRate.RATE_5HZ]: 5,
      [DataRate.RATE_1HZ]: 1,
      [DataRate.RATE_20HZ]: 20
    };
    return rates[this.dataRate] || 10;
  }

  public clone(): RecordingConfigurationEntity {
    return new RecordingConfigurationEntity(
      this.enabled,
      this.dataRate,
      { ...this.filters },
      { ...this.thresholds },
      { ...this.timeouts }
    );
  }

  public update(updates: Partial<RecordingConfiguration>): RecordingConfigurationEntity {
    return new RecordingConfigurationEntity(
      updates.enabled ?? this.enabled,
      updates.dataRate ?? this.dataRate,
      { ...this.filters, ...updates.filters },
      { ...this.thresholds, ...updates.thresholds },
      { ...this.timeouts, ...updates.timeouts }
    );
  }
} 