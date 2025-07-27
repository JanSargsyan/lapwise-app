import { LiveDataMessage } from '../../domain/entities/LiveDataMessage';

export interface RaceBoxMessage {
  class: number;
  id: number;
  payload: Uint8Array;
  checksum: [number, number];
}

export interface PacketParserPort {
  parsePacket(data: Uint8Array): RaceBoxMessage;
  validateChecksum(packet: Uint8Array): boolean;
  reassemblePackets(fragments: Uint8Array[]): Uint8Array;
  getMessageType(packet: Uint8Array): string;
  isLiveDataMessage(packet: Uint8Array): boolean;
  isConfigurationMessage(packet: Uint8Array): boolean;
  isAcknowledgmentMessage(packet: Uint8Array): boolean;
  extractLiveData(packet: Uint8Array): LiveDataMessage;
  extractConfiguration(packet: Uint8Array): any;
  extractAcknowledgment(packet: Uint8Array): { success: boolean; message: string };
  calculateChecksum(data: Uint8Array): [number, number];
  validatePacketStructure(packet: Uint8Array): boolean;
  getPacketLength(packet: Uint8Array): number;
} 