export enum DeviceType {
    RaceBoxMini = "racebox_mini",
    RaceBoxMicro = "racebox_micro",
    RaceBoxOriginal = "racebox_original",
    Mock = "mock",
    Phone = "phone",
}

export function fromString(deviceType: string): DeviceType | null {
    return Object.values(DeviceType).find(type => type === deviceType) ?? null;
}
