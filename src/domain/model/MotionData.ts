export interface MotionData {
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
  rotationRate: {
    x: number;
    y: number;
    z: number;
  };
  gForce: number;
} 