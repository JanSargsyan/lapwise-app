export interface Acknowledgment {
  success: boolean;
  message: string;
  timestamp: Date;
  commandId?: string;
  deviceId?: string;
} 