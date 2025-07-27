export interface SystemStatus {
  batteryLevel: number;
  batteryVoltage?: number;
  isCharging: boolean;
  temperature?: number;
}

export class SystemStatusValueObject {
  constructor(
    public readonly batteryLevel: number,
    public readonly isCharging: boolean,
    public readonly temperature?: number
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.batteryLevel < 0 || this.batteryLevel > 100) {
      throw new Error('Battery level must be between 0 and 100');
    }
    if (this.temperature !== undefined && (this.temperature < -40 || this.temperature > 85)) {
      throw new Error('Temperature must be between -40 and 85 degrees Celsius');
    }
  }

  public toInterface(): SystemStatus {
    return {
      batteryLevel: this.batteryLevel,
      batteryVoltage: this.batteryLevel * 0.1, // Approximate voltage calculation
      isCharging: this.isCharging,
      temperature: this.temperature ?? undefined
    };
  }

  public static fromRawData(batteryRaw: number, isChargingRaw: number, temperatureRaw?: number): SystemStatusValueObject {
    return new SystemStatusValueObject(
      batteryRaw,
      isChargingRaw !== 0,
      temperatureRaw
    );
  }

  public equals(other: SystemStatusValueObject): boolean {
    return (
      this.batteryLevel === other.batteryLevel &&
      this.isCharging === other.isCharging &&
      this.temperature === other.temperature
    );
  }

  public toString(): string {
    const tempStr = this.temperature !== undefined ? `, Temp: ${this.temperature.toFixed(1)}°C` : '';
    return `SystemStatus(Battery: ${this.batteryLevel}%, Charging: ${this.isCharging}${tempStr})`;
  }

  public getBatteryStatus(): 'critical' | 'low' | 'medium' | 'high' | 'full' {
    if (this.batteryLevel <= 10) return 'critical';
    if (this.batteryLevel <= 25) return 'low';
    if (this.batteryLevel <= 50) return 'medium';
    if (this.batteryLevel <= 90) return 'high';
    return 'full';
  }
} 