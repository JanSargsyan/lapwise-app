export interface MemoryStatus {
  totalCapacity: number;
  usedCapacity: number;
  freeCapacity: number;
  memoryLevel: number;
}

export class MemoryStatusValueObject {
  constructor(
    public readonly totalCapacity: number,
    public readonly usedCapacity: number,
    public readonly freeCapacity: number,
    public readonly memoryLevel: number
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.totalCapacity <= 0) {
      throw new Error('Total capacity must be positive');
    }
    if (this.usedCapacity < 0) {
      throw new Error('Used capacity cannot be negative');
    }
    if (this.freeCapacity < 0) {
      throw new Error('Free capacity cannot be negative');
    }
    if (this.memoryLevel < 0 || this.memoryLevel > 100) {
      throw new Error('Memory level must be between 0 and 100');
    }
    if (this.usedCapacity + this.freeCapacity !== this.totalCapacity) {
      throw new Error('Used capacity + free capacity must equal total capacity');
    }
  }

  public toInterface(): MemoryStatus {
    return {
      totalCapacity: this.totalCapacity,
      usedCapacity: this.usedCapacity,
      freeCapacity: this.freeCapacity,
      memoryLevel: this.memoryLevel
    };
  }

  public static fromRawData(
    totalCapacityRaw: number,
    usedCapacityRaw: number,
    freeCapacityRaw: number,
    memoryLevelRaw: number
  ): MemoryStatusValueObject {
    return new MemoryStatusValueObject(
      totalCapacityRaw,
      usedCapacityRaw,
      freeCapacityRaw,
      memoryLevelRaw
    );
  }

  public equals(other: MemoryStatusValueObject): boolean {
    return (
      this.totalCapacity === other.totalCapacity &&
      this.usedCapacity === other.usedCapacity &&
      this.freeCapacity === other.freeCapacity &&
      this.memoryLevel === other.memoryLevel
    );
  }

  public toString(): string {
    const usedGB = (this.usedCapacity / (1024 * 1024 * 1024)).toFixed(2);
    const totalGB = (this.totalCapacity / (1024 * 1024 * 1024)).toFixed(2);
    return `MemoryStatus(${usedGB}GB/${totalGB}GB, ${this.memoryLevel}% used)`;
  }

  public getUsagePercentage(): number {
    return this.memoryLevel;
  }

  public getFreeSpace(): number {
    return this.freeCapacity;
  }

  public getUsedSpace(): number {
    return this.usedCapacity;
  }

  public getTotalSpace(): number {
    return this.totalCapacity;
  }

  public isLow(): boolean {
    return this.memoryLevel > 80;
  }

  public isCritical(): boolean {
    return this.memoryLevel > 95;
  }
} 