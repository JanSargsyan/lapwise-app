import { PlatformModel } from '../types/PlatformModel';

export interface GNSSConfiguration {
  platformModel: PlatformModel;
  enable3DSpeed: boolean;
  minHorizontalAccuracy: number; // meters
}

export class GNSSConfigurationEntity {
  constructor(
    public readonly platformModel: PlatformModel,
    public readonly enable3DSpeed: boolean,
    public readonly minHorizontalAccuracy: number
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.minHorizontalAccuracy < 0) {
      throw new Error('Minimum horizontal accuracy must be non-negative');
    }
    if (this.minHorizontalAccuracy > 100) {
      throw new Error('Minimum horizontal accuracy must be less than 100 meters');
    }
  }

  public toInterface(): GNSSConfiguration {
    return {
      platformModel: this.platformModel,
      enable3DSpeed: this.enable3DSpeed,
      minHorizontalAccuracy: this.minHorizontalAccuracy
    };
  }

  public static fromInterface(config: GNSSConfiguration): GNSSConfigurationEntity {
    return new GNSSConfigurationEntity(
      config.platformModel,
      config.enable3DSpeed,
      config.minHorizontalAccuracy
    );
  }

  public static createDefault(): GNSSConfigurationEntity {
    return new GNSSConfigurationEntity(
      PlatformModel.AUTOMOTIVE,
      true,
      5.0 // 5 meters default
    );
  }

  public equals(other: GNSSConfigurationEntity): boolean {
    return (
      this.platformModel === other.platformModel &&
      this.enable3DSpeed === other.enable3DSpeed &&
      this.minHorizontalAccuracy === other.minHorizontalAccuracy
    );
  }

  public toString(): string {
    return `GNSSConfig[platform: ${this.platformModel}, 3D speed: ${this.enable3DSpeed}, min accuracy: ${this.minHorizontalAccuracy}m]`;
  }

  public isConfigured(): boolean {
    return this.platformModel !== undefined && this.minHorizontalAccuracy >= 0;
  }

  public clone(): GNSSConfigurationEntity {
    return new GNSSConfigurationEntity(
      this.platformModel,
      this.enable3DSpeed,
      this.minHorizontalAccuracy
    );
  }

  public update(updates: Partial<GNSSConfiguration>): GNSSConfigurationEntity {
    return new GNSSConfigurationEntity(
      updates.platformModel ?? this.platformModel,
      updates.enable3DSpeed ?? this.enable3DSpeed,
      updates.minHorizontalAccuracy ?? this.minHorizontalAccuracy
    );
  }

  public getPlatformModelLabel(): string {
    const labels = {
      [PlatformModel.AUTOMOTIVE]: 'Automotive',
      [PlatformModel.SEA_USE]: 'Sea Use',
      [PlatformModel.AIRBORNE_LOW_DYNAMIC]: 'Airborne (Low Dynamic)',
      [PlatformModel.AIRBORNE_HIGH_DYNAMIC]: 'Airborne (High Dynamic)'
    };
    return labels[this.platformModel] || 'Unknown';
  }

  public getPlatformModelDescription(): string {
    const descriptions = {
      [PlatformModel.AUTOMOTIVE]: 'Optimized for automotive applications',
      [PlatformModel.SEA_USE]: 'Optimized for marine applications',
      [PlatformModel.AIRBORNE_LOW_DYNAMIC]: 'Optimized for low-dynamic airborne applications',
      [PlatformModel.AIRBORNE_HIGH_DYNAMIC]: 'Optimized for high-dynamic airborne applications'
    };
    return descriptions[this.platformModel] || 'Unknown platform model';
  }
} 