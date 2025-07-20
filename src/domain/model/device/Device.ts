import { ConnectionProps, ConnectionType } from "@/src/domain/model/device/ConnectionType";

export interface DeviceType {
    id: string;
    label: string;
    manufacturer: string;
    connectionType: ConnectionType;
    connectionProps: ConnectionProps;
  }