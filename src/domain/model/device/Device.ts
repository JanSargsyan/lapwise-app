import { ConnectionProps, ConnectionType } from "@/src/domain/model/device/ConnectionType";

export interface Device {
    id: string; // UUID, generated when adding to DB
    type: string; // was id, now type (DeviceType)
    label: string;
    manufacturer: string;
    connectionType: ConnectionType;
    connectionProps: ConnectionProps;
  }

