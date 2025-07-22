import { ConnectionProps, ConnectionType } from "@/src/domain/model/device/ConnectionType";

export interface Device {
    id: string;
    label: string;
    manufacturer: string;
    connectionType: ConnectionType;
    connectionProps: ConnectionProps;
  }

