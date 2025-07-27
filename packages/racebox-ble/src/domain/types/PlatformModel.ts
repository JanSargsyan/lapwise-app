export enum PlatformModel {
  AUTOMOTIVE = 4,
  SEA_USE = 5,
  AIRBORNE_LOW_DYNAMIC = 6,
  AIRBORNE_HIGH_DYNAMIC = 8
}

export const PlatformModelLabels: Record<PlatformModel, string> = {
  [PlatformModel.AUTOMOTIVE]: 'Automotive',
  [PlatformModel.SEA_USE]: 'Sea Use',
  [PlatformModel.AIRBORNE_LOW_DYNAMIC]: 'Airborne (Low Dynamic)',
  [PlatformModel.AIRBORNE_HIGH_DYNAMIC]: 'Airborne (High Dynamic)'
};

export const PlatformModelDescriptions: Record<PlatformModel, string> = {
  [PlatformModel.AUTOMOTIVE]: 'Optimized for automotive applications',
  [PlatformModel.SEA_USE]: 'Optimized for marine applications',
  [PlatformModel.AIRBORNE_LOW_DYNAMIC]: 'Optimized for low-dynamic airborne applications',
  [PlatformModel.AIRBORNE_HIGH_DYNAMIC]: 'Optimized for high-dynamic airborne applications'
}; 