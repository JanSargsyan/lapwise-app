import { DeviceType } from "@/src/domain/model/device/DeviceType";

export const DeviceCatalog = {
  [DeviceType.RaceBoxMini]: {
    id: "",
    type: DeviceType.RaceBoxMini,
    label: "RaceBox Mini / Mini S",
    manufacturer: "RaceBox",
    connectionType: "BLE",
    connectionProps: {
      advertisedNamePrefix: "RaceBox Mini"
    }
  },
  [DeviceType.RaceBoxMicro]: {
    id: "",
    type: DeviceType.RaceBoxMicro,
    label: "RaceBox Micro",
    manufacturer: "RaceBox",
    connectionType: "BLE",
    connectionProps: {
      advertisedNamePrefix: "RaceBox Micro"
    }
  },
  [DeviceType.RaceBoxOriginal]: {
    id: "",
    type: DeviceType.RaceBoxOriginal,
    label: "RaceBox Original",
    manufacturer: "RaceBox",
    connectionType: "WiFi",
    connectionProps: {}
  },
  [DeviceType.Mock]: {
    id: "",
    type: DeviceType.Mock,
    label: "MockBox",
    manufacturer: "Lapwise",
    connectionType: "Mock",
    connectionProps: {}
  },
  [DeviceType.Phone]: {
    id: "",
    type: DeviceType.Phone,
    label: "Phone GPS",
    manufacturer: "",
    connectionType: "Phone",
    connectionProps: {}
  }
} as const;
