export interface LocationData {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  satellites: number;
  fixType: 'none' | '2d' | '3d';
} 