import { TimeData } from '@/src/domain/model/livedata/TimeData';
import { LocationData } from '@/src/domain/model/livedata/LocationData';
import { MotionData } from '@/src/domain/model/livedata/MotionData';
import { SensorData } from '@/src/domain/model/livedata/SensorData';

export interface DeviceData {
  time: TimeData;
  location: LocationData;
  motion: MotionData;
  sensors: SensorData;
} 