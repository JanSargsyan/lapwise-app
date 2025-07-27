export interface RecordingStatus {
  isRecording: boolean;
  isPaused: boolean;
  duration?: number;
  dataPoints?: number;
  memoryLevel?: number;
  startTime?: Date;
}

export class RecordingStatusValueObject {
  constructor(
    public readonly isRecording: boolean,
    public readonly isPaused: boolean,
    public readonly duration?: number,
    public readonly dataPoints?: number,
    public readonly memoryLevel?: number,
    public readonly startTime?: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.duration !== undefined && this.duration < 0) {
      throw new Error('Duration cannot be negative');
    }
    if (this.dataPoints !== undefined && this.dataPoints < 0) {
      throw new Error('Data points cannot be negative');
    }
    if (this.memoryLevel !== undefined && (this.memoryLevel < 0 || this.memoryLevel > 100)) {
      throw new Error('Memory level must be between 0 and 100');
    }
  }

  public toInterface(): RecordingStatus {
    return {
      isRecording: this.isRecording,
      isPaused: this.isPaused,
      duration: this.duration,
      dataPoints: this.dataPoints,
      memoryLevel: this.memoryLevel,
      startTime: this.startTime
    };
  }

  public static fromRawData(
    isRecordingRaw: number,
    isPausedRaw: number,
    durationRaw?: number,
    dataPointsRaw?: number,
    memoryLevelRaw?: number,
    startTimeRaw?: number
  ): RecordingStatusValueObject {
    return new RecordingStatusValueObject(
      isRecordingRaw !== 0,
      isPausedRaw !== 0,
      durationRaw,
      dataPointsRaw,
      memoryLevelRaw,
      startTimeRaw ? new Date(startTimeRaw * 1000) : undefined
    );
  }

  public equals(other: RecordingStatusValueObject): boolean {
    return (
      this.isRecording === other.isRecording &&
      this.isPaused === other.isPaused &&
      this.duration === other.duration &&
      this.dataPoints === other.dataPoints &&
      this.memoryLevel === other.memoryLevel &&
      this.startTime?.getTime() === other.startTime?.getTime()
    );
  }

  public toString(): string {
    const status = this.isRecording ? 'Recording' : this.isPaused ? 'Paused' : 'Stopped';
    const durationStr = this.duration ? `, Duration: ${this.duration}s` : '';
    const dataPointsStr = this.dataPoints ? `, Points: ${this.dataPoints}` : '';
    const memoryStr = this.memoryLevel ? `, Memory: ${this.memoryLevel}%` : '';
    
    return `RecordingStatus(${status}${durationStr}${dataPointsStr}${memoryStr})`;
  }

  public getStatus(): 'recording' | 'paused' | 'stopped' {
    if (this.isRecording) return 'recording';
    if (this.isPaused) return 'paused';
    return 'stopped';
  }
} 