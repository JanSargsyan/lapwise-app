export type ConnectionType = "BLE" | "WiFi" | "Mock" | "Phone";

export interface BLEConnectionProps {
  advertisedNamePrefix: string;
  address?: string;
}

export interface WiFiConnectionProps {
    ssidPrefix?: string;
    ipAddress?: string;
    port?: number;
  }

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PhoneConnectionProps {}

export type ConnectionProps = BLEConnectionProps | WiFiConnectionProps | PhoneConnectionProps;