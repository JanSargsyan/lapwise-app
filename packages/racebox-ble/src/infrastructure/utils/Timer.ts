export class Timer {
  private startTime: number = 0;
  private endTime: number = 0;

  start(): void {
    this.startTime = Date.now();
    this.endTime = 0;
  }

  stop(): number {
    this.endTime = Date.now();
    return this.getElapsed();
  }

  getElapsed(): number {
    const end = this.endTime || Date.now();
    return end - this.startTime;
  }

  reset(): void {
    this.startTime = 0;
    this.endTime = 0;
  }

  isRunning(): boolean {
    return this.startTime > 0 && this.endTime === 0;
  }
} 