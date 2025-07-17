export interface DeviceStatus {
  isConnected: boolean;
  isScanning: boolean;
  lastSeen?: Date;
  signalStrength?: number;
  batteryLevel?: number;
  isCharging?: boolean;
} 