import { DeviceInfo, DeviceType } from './DeviceInfo';
import { DeviceStatus } from './DeviceStatus';

export class Device {
  constructor(
    public readonly info: DeviceInfo,
    public status: DeviceStatus = {
      isConnected: false,
      isScanning: false,
    }
  ) {}

  updateStatus(status: Partial<DeviceStatus>): void {
    this.status = { ...this.status, ...status };
  }

  updateLastSeen(): void {
    this.status.lastSeen = new Date();
  }
} 