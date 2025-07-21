import { DeviceType } from "@/src/domain/model/device/Device";

export const DeviceCatalog = {
    [DeviceType.RaceBoxMini]: {
      id: DeviceType.RaceBoxMini,
      label: "RaceBox Mini / Mini S",
      manufacturer: "RaceBox",
      connectionType: "BLE",
      connectionProps: {
        advertisedNamePrefix: "RaceBox Mini"
      }
    },
    [DeviceType.RaceBoxMicro]: {
      id: DeviceType.RaceBoxMicro,
      label: "RaceBox Micro",
      manufacturer: "RaceBox",
      connectionType: "BLE",
      connectionProps: {
        advertisedNamePrefix: "RaceBox Micro"
      }
    },
    [DeviceType.RaceBoxOriginal]: {
      id: DeviceType.RaceBoxOriginal,
      label: "RaceBox Original",
      manufacturer: "RaceBox",
      connectionType: "WiFi",
      connectionProps: {}
    },
    [DeviceType.Mock]: {
        id: DeviceType.Mock,
        label: "MockBox",
        manufacturer: "Lapwise",
        connectionType: "Mock",
        connectionProps: {}
      },
      [DeviceType.Phone]: {
      id: DeviceType.Phone,
      label: "Phone GPS",
      manufacturer: "",
      connectionType: "Phone",
      connectionProps: {}
    }
  } as const;
