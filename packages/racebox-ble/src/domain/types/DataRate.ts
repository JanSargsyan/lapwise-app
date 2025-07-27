export enum DataRate {
  RATE_25HZ = 0,
  RATE_10HZ = 1,
  RATE_5HZ = 2,
  RATE_1HZ = 3,
  RATE_20HZ = 4
}

export const DataRateLabels: Record<DataRate, string> = {
  [DataRate.RATE_25HZ]: '25 Hz',
  [DataRate.RATE_10HZ]: '10 Hz',
  [DataRate.RATE_5HZ]: '5 Hz',
  [DataRate.RATE_1HZ]: '1 Hz',
  [DataRate.RATE_20HZ]: '20 Hz'
};

export const DataRateValues: Record<DataRate, number> = {
  [DataRate.RATE_25HZ]: 25,
  [DataRate.RATE_10HZ]: 10,
  [DataRate.RATE_5HZ]: 5,
  [DataRate.RATE_1HZ]: 1,
  [DataRate.RATE_20HZ]: 20
}; 