import type { RaceBoxLiveData } from 'racebox-api/types';
import type { DeviceData } from '../../domain/model/DeviceData';
import type { TimeData } from '../../domain/model/TimeData';
import type { LocationData } from '../../domain/model/LocationData';
import type { MotionData } from '../../domain/model/MotionData';
import type { SensorData } from '../../domain/model/SensorData';

export function mapRaceBoxLiveDataToDeviceData(liveData: RaceBoxLiveData): DeviceData {
  const time: TimeData = {
    iTOW: liveData.iTOW,
    year: liveData.year,
    month: liveData.month,
    day: liveData.day,
    hour: liveData.hour,
    minute: liveData.minute,
    second: liveData.second,
    nanoseconds: liveData.nanoseconds,
    timeAccuracy: liveData.timeAccuracy,
    validityFlags: liveData.validityFlags,
  };

  const location: LocationData = {
    latitude: liveData.latitude,
    longitude: liveData.longitude,
    wgsAltitude: liveData.wgsAltitude,
    mslAltitude: liveData.mslAltitude,
    horizontalAccuracy: liveData.horizontalAccuracy,
    verticalAccuracy: liveData.verticalAccuracy,
    speed: liveData.speed,
    heading: liveData.heading,
    speedAccuracy: liveData.speedAccuracy,
    headingAccuracy: liveData.headingAccuracy,
    pdop: liveData.pdop,
    numSV: liveData.numSV,
    fixStatus: liveData.fixStatus,
    fixStatusFlags: liveData.fixStatusFlags,
    dateTimeFlags: liveData.dateTimeFlags,
    latLonFlags: liveData.latLonFlags,
  };

  const motion: MotionData = {
    gForceX: liveData.gForceX,
    gForceY: liveData.gForceY,
    gForceZ: liveData.gForceZ,
    rotationRateX: liveData.rotationRateX,
    rotationRateY: liveData.rotationRateY,
    rotationRateZ: liveData.rotationRateZ,
  };

  const sensors: SensorData = {
    batteryOrVoltage: liveData.batteryOrVoltage,
  };

  return {
    time,
    location,
    motion,
    sensors,
  };
} 