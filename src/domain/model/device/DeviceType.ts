export enum DeviceType {
    RACEBOX = "RaceBox",
    PHONE = "This phone",
}

export const fromString = (deviceType: string): DeviceType | null => {
    switch (deviceType) {
        case DeviceType.RACEBOX:
            return DeviceType.RACEBOX; 
        default:
            return null;
    }
}