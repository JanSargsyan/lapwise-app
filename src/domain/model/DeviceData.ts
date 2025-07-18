import { TimeData } from './TimeData';
import { LocationData } from './LocationData';
import { MotionData } from './MotionData';
import { SensorData } from './SensorData';

export interface DeviceData {
  time: TimeData;
  location: LocationData;
  motion: MotionData;
  sensors: SensorData;
} 