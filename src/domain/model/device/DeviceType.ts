export enum DeviceType {
    RACEBOX = "RaceBox"
}

export const fromString = (deviceType: string): DeviceType | null => {
    switch (deviceType) {
        case DeviceType.RACEBOX:
            return DeviceType.RACEBOX; 
        default:
            return null;
    }
}