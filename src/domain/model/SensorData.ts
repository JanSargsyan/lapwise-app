export interface SensorData {
  temperature?: number;
  humidity?: number;
  pressure?: number;
  [key: string]: number | undefined;
} 