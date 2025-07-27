export enum FixStatus {
  NO_FIX = 0,
  FIX_2D = 2,
  FIX_3D = 3
}

export const FixStatusLabels: Record<FixStatus, string> = {
  [FixStatus.NO_FIX]: 'No Fix',
  [FixStatus.FIX_2D]: '2D Fix',
  [FixStatus.FIX_3D]: '3D Fix'
};

export const FixStatusDescriptions: Record<FixStatus, string> = {
  [FixStatus.NO_FIX]: 'No GPS fix available',
  [FixStatus.FIX_2D]: '2D position fix (latitude/longitude)',
  [FixStatus.FIX_3D]: '3D position fix (latitude/longitude/altitude)'
}; 