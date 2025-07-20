export const DeviceCatalog = {
    RaceBoxMini: {
      id: "racebox_mini",
      label: "RaceBox Mini / Mini S",
      manufacturer: "RaceBox",
      connectionType: "BLE",
      connectionProps: {
        advertisedNamePrefix: "RaceBox Mini"
      }
    },
    RaceBoxMicro: {
      id: "racebox_micro",
      label: "RaceBox Micro",
      manufacturer: "RaceBox",
      connectionType: "BLE",
      connectionProps: {
        advertisedNamePrefix: "RaceBox Micro"
      }
    },
    RaceBoxOriginal: {
      id: "racebox_original",
      label: "RaceBox Original",
      manufacturer: "RaceBox",
      connectionType: "WiFi",
      connectionProps: {}
    },
    Phone: {
      id: "phone",
      label: "Phone GPS",
      manufacturer: "",
      connectionType: "Phone",
      connectionProps: {}
    }
  } as const;