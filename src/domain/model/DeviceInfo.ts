export interface DeviceInfo {
  id: string;
  name: string;
  type: DeviceType;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  firmwareVersion?: string;
  hardwareVersion?: string;
}

export enum DeviceType {
  RACEBOX = 'racebox',
  RACELOGIC = 'racelogic',
  CUSTOM = 'custom',
} 