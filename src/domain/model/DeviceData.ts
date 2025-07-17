import { LocationData } from './LocationData';
import { MotionData } from './MotionData';
import { SensorData } from './SensorData';
import { DeviceStatus } from './DeviceStatus';

export interface DeviceData {
  location?: LocationData;
  motion?: MotionData;
  sensors?: SensorData;
  status?: DeviceStatus;
  rawData?: string;
  timestamp: Date;
} 