import { BLEConnectionProps } from "@/src/domain/model/device/ConnectionType";
import { Device } from "@/src/domain/model/device/Device";

export function getDeviceId(device: Device): string {
  switch (device.connectionType) {
    case "BLE":
      return ("BLE:" + (device.connectionProps as BLEConnectionProps).address);
    case "WiFi":
      throw new Error('WiFi devices are not supported yet'); 
    default:
      throw new Error('Invalid device type');
  }
}