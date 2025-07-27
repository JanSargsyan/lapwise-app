export interface SystemStatus {
  batteryLevel: number; // percentage (0-100)
  batteryVoltage?: number; // volts
  isCharging: boolean;
  temperature?: number; // celsius
}

export class SystemStatusValueObject {
  constructor(
    public readonly batteryLevel: number,
    public readonly batteryVoltage?: number,
    public readonly isCharging: boolean = false,
    public readonly temperature?: number
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.batteryLevel < 0 || this.batteryLevel > 100) {
      throw new Error('Battery level must be between 0 and 100');
    }
    if (this.batteryVoltage !== undefined && this.batteryVoltage < 0) {
      throw new Error('Battery voltage must be non-negative');
    }
    if (this.temperature !== undefined && (this.temperature < -50 || this.temperature > 100)) {
      throw new Error('Temperature must be between -50 and 100 degrees Celsius');
    }
  }

  public toInterface(): SystemStatus {
    return {
      batteryLevel: this.batteryLevel,
      batteryVoltage: this.batteryVoltage,
      isCharging: this.isCharging,
      temperature: this.temperature
    };
  }

  public static fromInterface(systemStatus: SystemStatus): SystemStatusValueObject {
    return new SystemStatusValueObject(
      systemStatus.batteryLevel,
      systemStatus.batteryVoltage,
      systemStatus.isCharging,
      systemStatus.temperature
    );
  }

  public static fromRawData(
    batteryRaw: number,
    isChargingRaw: boolean = false,
    temperatureRaw?: number
  ): SystemStatusValueObject {
    // Convert raw battery data
    let batteryLevel: number;
    let batteryVoltage: number | undefined;

    if (batteryRaw & 0x80) {
      // Charging bit is set
      batteryLevel = batteryRaw & 0x7F; // Remove charging bit
      batteryVoltage = undefined; // Voltage not available in this format
    } else {
      // Regular battery level (0-100)
      batteryLevel = batteryRaw;
      batteryVoltage = batteryRaw * 0.1; // Convert to voltage (approximate)
    }

    return new SystemStatusValueObject(
      batteryLevel,
      batteryVoltage,
      isChargingRaw,
      temperatureRaw
    );
  }

  public equals(other: SystemStatusValueObject): boolean {
    return (
      this.batteryLevel === other.batteryLevel &&
      this.batteryVoltage === other.batteryVoltage &&
      this.isCharging === other.isCharging &&
      this.temperature === other.temperature
    );
  }

  public toString(): string {
    let result = `Battery: ${this.batteryLevel}%`;
    if (this.batteryVoltage !== undefined) {
      result += ` (${this.batteryVoltage.toFixed(1)}V)`;
    }
    if (this.isCharging) {
      result += ' (Charging)';
    }
    if (this.temperature !== undefined) {
      result += `, Temp: ${this.temperature.toFixed(1)}°C`;
    }
    return result;
  }

  public getBatteryStatus(): 'critical' | 'low' | 'medium' | 'high' | 'full' {
    if (this.batteryLevel <= 10) return 'critical';
    if (this.batteryLevel <= 25) return 'low';
    if (this.batteryLevel <= 50) return 'medium';
    if (this.batteryLevel <= 90) return 'high';
    return 'full';
  }

  public isLowBattery(): boolean {
    return this.batteryLevel <= 20;
  }

  public isCriticalBattery(): boolean {
    return this.batteryLevel <= 10;
  }
} 