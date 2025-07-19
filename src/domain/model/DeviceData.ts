import { TimeData } from '@/src/domain/model/TimeData';
import { LocationData } from '@/src/domain/model/LocationData';
import { MotionData } from '@/src/domain/model/MotionData';
import { SensorData } from '@/src/domain/model/SensorData';

export interface DeviceData {
  time: TimeData;
  location: LocationData;
  motion: MotionData;
  sensors: SensorData;
} 