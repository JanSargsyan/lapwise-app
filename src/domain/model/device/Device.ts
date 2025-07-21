import { ConnectionProps, ConnectionType } from "@/src/domain/model/device/ConnectionType";

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

export interface Device {
    id: string;
    label: string;
    manufacturer: string;
    connectionType: ConnectionType;
    connectionProps: ConnectionProps;
  }

