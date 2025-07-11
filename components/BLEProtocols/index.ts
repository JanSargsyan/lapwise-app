export interface BLEProtocol {
  name: string;
  serviceUUID: string;
  txCharacteristicUUID: string;
  rxCharacteristicUUID?: string;
  deviceInfoServiceUUID?: string;
  deviceInfoCharacteristics?: { [key: string]: string };
  decodePacket: (bytes: Uint8Array) => any;
  formatDecodedData?: (decoded: any) => string[];
}

export interface UBXPacket {
  class: number;
  id: number;
  length: number;
  payload: Uint8Array;
  checksumValid: boolean;
}

export const protocols: { [key: string]: BLEProtocol } = {};

export function registerProtocol(deviceType: string, protocol: BLEProtocol) {
  protocols[deviceType] = protocol;
}

export function getProtocol(deviceType: string): BLEProtocol | null {
  return protocols[deviceType] || null;
}

export function getAllProtocols(): string[] {
  return Object.keys(protocols);
}

// Register built-in protocols
import { RaceBoxProtocol } from './RaceBox';
registerProtocol('racebox', RaceBoxProtocol); 