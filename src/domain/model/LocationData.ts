export interface LocationData {
  latitude: number;
  longitude: number;
  wgsAltitude: number;
  mslAltitude: number;
  horizontalAccuracy: number;
  verticalAccuracy: number;
  speed: number;
  heading: number;
  speedAccuracy: number;
  headingAccuracy: number;
  pdop: number;
  numSV: number;
  fixStatus: number;
  fixStatusFlags: number;
  dateTimeFlags: number;
  latLonFlags: number;
}
