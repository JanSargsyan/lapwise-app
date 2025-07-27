import { MessageFactoryPort } from '../../../ports/secondary/MessageFactoryPort';
import { RaceBoxMessage } from '../../../ports/secondary/PacketParserPort';
import { GNSSConfiguration, RecordingConfiguration } from '../../../domain/entities';

export class RaceBoxMessageFactoryAdapter implements MessageFactoryPort {
  // UBX protocol constants
  private static readonly UBX_SYNC_CHAR_1 = 0xB5;
  private static readonly UBX_SYNC_CHAR_2 = 0x62;
  private static readonly UBX_HEADER_LENGTH = 6;
  private static readonly UBX_CHECKSUM_LENGTH = 2;

  // RaceBox message class and ID constants
  private static readonly RACEBOX_CLASS = 0xFF;
  private static readonly RACEBOX_LIVE_DATA_ID = 0x01;
  private static readonly RACEBOX_GNSS_CONFIG_ID = 0x27;
  private static readonly RACEBOX_RECORDING_CONFIG_ID = 0x22;
  private static readonly RACEBOX_START_RECORDING_ID = 0x25;
  private static readonly RACEBOX_STOP_RECORDING_ID = 0x23;
  private static readonly RACEBOX_PAUSE_RECORDING_ID = 0x24;
  private static readonly RACEBOX_DOWNLOAD_HISTORY_ID = 0x21;
  private static readonly RACEBOX_ERASE_MEMORY_ID = 0x24;
  private static readonly RACEBOX_UNLOCK_MEMORY_ID = 0x30;
  private static readonly RACEBOX_ACK_ID = 0x05;
  private static readonly RACEBOX_NACK_ID = 0x00;

  // GNSS configuration messages
  createGNSSConfigRequest(): RaceBoxMessage {
    const payload = new Uint8Array(0); // Empty payload for request
    return this.createMessage(RaceBoxMessageFactoryAdapter.RACEBOX_GNSS_CONFIG_ID, payload);
  }

  createGNSSConfigSet(config: GNSSConfiguration): RaceBoxMessage {
    const payload = new Uint8Array(4);
    const dataView = new DataView(payload.buffer);
    
    dataView.setUint8(0, config.platformModel);
    dataView.setUint8(1, config.enable3DSpeed ? 0x01 : 0x00);
    dataView.setUint16(2, Math.round(config.minHorizontalAccuracy * 1000), true); // Convert to mm
    
    return this.createMessage(RaceBoxMessageFactoryAdapter.RACEBOX_GNSS_CONFIG_ID, payload);
  }

  // Recording configuration messages
  createRecordingConfigRequest(): RaceBoxMessage {
    const payload = new Uint8Array(0); // Empty payload for request
    return this.createMessage(RaceBoxMessageFactoryAdapter.RACEBOX_RECORDING_CONFIG_ID, payload);
  }

  createRecordingConfigSet(config: RecordingConfiguration): RaceBoxMessage {
    const payload = new Uint8Array(8);
    const dataView = new DataView(payload.buffer);
    
    dataView.setUint8(0, config.enabled ? 0x01 : 0x00);
    dataView.setUint8(1, config.dataRate);
    dataView.setUint16(2, Math.round((config.filters.minSpeed || 0) * 100), true); // Convert to cm/s
    dataView.setUint16(4, Math.round((config.filters.maxSpeed || 300) * 100), true); // Convert to cm/s
    dataView.setUint16(6, Math.round((config.filters.minAccuracy || 5) * 1000), true); // Convert to mm
    
    return this.createMessage(RaceBoxMessageFactoryAdapter.RACEBOX_RECORDING_CONFIG_ID, payload);
  }

  // Recording control messages
  createStartRecordingCommand(): RaceBoxMessage {
    const payload = new Uint8Array(0); // Empty payload for command
    return this.createMessage(RaceBoxMessageFactoryAdapter.RACEBOX_START_RECORDING_ID, payload);
  }

  createStopRecordingCommand(): RaceBoxMessage {
    const payload = new Uint8Array(0); // Empty payload for command
    return this.createMessage(RaceBoxMessageFactoryAdapter.RACEBOX_STOP_RECORDING_ID, payload);
  }

  createPauseRecordingCommand(): RaceBoxMessage {
    const payload = new Uint8Array(0); // Empty payload for command
    return this.createMessage(RaceBoxMessageFactoryAdapter.RACEBOX_PAUSE_RECORDING_ID, payload);
  }

  // Data download messages
  createDownloadHistoryCommand(): RaceBoxMessage {
    const payload = new Uint8Array(0); // Empty payload for command
    return this.createMessage(RaceBoxMessageFactoryAdapter.RACEBOX_DOWNLOAD_HISTORY_ID, payload);
  }

  createDownloadHistoryRequest(startIndex: number, count: number): RaceBoxMessage {
    const payload = new Uint8Array(8);
    const dataView = new DataView(payload.buffer);
    
    dataView.setUint32(0, startIndex, true);
    dataView.setUint32(4, count, true);
    
    return this.createMessage(RaceBoxMessageFactoryAdapter.RACEBOX_DOWNLOAD_HISTORY_ID, payload);
  }

  // Memory management messages
  createEraseMemoryCommand(): RaceBoxMessage {
    const payload = new Uint8Array(0); // Empty payload for command
    return this.createMessage(RaceBoxMessageFactoryAdapter.RACEBOX_ERASE_MEMORY_ID, payload);
  }

  createUnlockMemoryCommand(securityCode: number): RaceBoxMessage {
    const payload = new Uint8Array(4);
    const dataView = new DataView(payload.buffer);
    
    dataView.setUint32(0, securityCode, true);
    
    return this.createMessage(RaceBoxMessageFactoryAdapter.RACEBOX_UNLOCK_MEMORY_ID, payload);
  }

  // Status request messages
  createDeviceInfoRequest(): RaceBoxMessage {
    const payload = new Uint8Array(0); // Empty payload for request
    return this.createMessage(0x20, payload); // Device info request ID
  }

  createRecordingStatusRequest(): RaceBoxMessage {
    const payload = new Uint8Array(0); // Empty payload for request
    return this.createMessage(0x26, payload); // Recording status request ID
  }

  createGNSSStatusRequest(): RaceBoxMessage {
    const payload = new Uint8Array(0); // Empty payload for request
    return this.createMessage(0x28, payload); // GNSS status request ID
  }

  createMemoryStatusRequest(): RaceBoxMessage {
    const payload = new Uint8Array(0); // Empty payload for request
    return this.createMessage(0x29, payload); // Memory status request ID
  }

  // Utility methods
  createAcknowledgmentRequest(messageId: number): RaceBoxMessage {
    const payload = new Uint8Array(1);
    const dataView = new DataView(payload.buffer);
    
    dataView.setUint8(0, messageId);
    
    return this.createMessage(RaceBoxMessageFactoryAdapter.RACEBOX_ACK_ID, payload);
  }

  createKeepAliveMessage(): RaceBoxMessage {
    const payload = new Uint8Array(0); // Empty payload for keep-alive
    return this.createMessage(0x0A, payload); // Keep-alive message ID
  }

  createResetCommand(): RaceBoxMessage {
    const payload = new Uint8Array(0); // Empty payload for reset command
    return this.createMessage(0x0B, payload); // Reset command ID
  }

  // Helper method to create UBX packets
  private createMessage(messageId: number, payload: Uint8Array): RaceBoxMessage {
    // Create UBX packet
    const packetLength = RaceBoxMessageFactoryAdapter.UBX_HEADER_LENGTH + payload.length + RaceBoxMessageFactoryAdapter.UBX_CHECKSUM_LENGTH;
    const packet = new Uint8Array(packetLength);
    const dataView = new DataView(packet.buffer);
    
    // Set UBX header
    dataView.setUint8(0, RaceBoxMessageFactoryAdapter.UBX_SYNC_CHAR_1);
    dataView.setUint8(1, RaceBoxMessageFactoryAdapter.UBX_SYNC_CHAR_2);
    dataView.setUint8(2, RaceBoxMessageFactoryAdapter.RACEBOX_CLASS);
    dataView.setUint8(3, messageId);
    dataView.setUint16(4, payload.length, false); // Little-endian
    
    // Set payload
    packet.set(payload, RaceBoxMessageFactoryAdapter.UBX_HEADER_LENGTH);
    
    // Calculate and set checksum
    const checksum = this.calculateChecksum(packet.slice(2, RaceBoxMessageFactoryAdapter.UBX_HEADER_LENGTH + payload.length));
    dataView.setUint8(RaceBoxMessageFactoryAdapter.UBX_HEADER_LENGTH + payload.length, checksum[0]);
    dataView.setUint8(RaceBoxMessageFactoryAdapter.UBX_HEADER_LENGTH + payload.length + 1, checksum[1]);
    
    return {
      class: RaceBoxMessageFactoryAdapter.RACEBOX_CLASS,
      id: messageId,
      payload,
      checksum
    };
  }

  // Helper method to calculate UBX checksum
  private calculateChecksum(data: Uint8Array): [number, number] {
    let checksumA = 0;
    let checksumB = 0;

    for (let i = 0; i < data.length; i++) {
      checksumA = (checksumA + data[i]) & 0xFF;
      checksumB = (checksumB + checksumA) & 0xFF;
    }

    return [checksumA, checksumB];
  }

  // Helper method to convert RaceBoxMessage to Uint8Array for transmission
  public messageToPacket(message: RaceBoxMessage): Uint8Array {
    const packetLength = RaceBoxMessageFactoryAdapter.UBX_HEADER_LENGTH + message.payload.length + RaceBoxMessageFactoryAdapter.UBX_CHECKSUM_LENGTH;
    const packet = new Uint8Array(packetLength);
    const dataView = new DataView(packet.buffer);
    
    // Set UBX header
    dataView.setUint8(0, RaceBoxMessageFactoryAdapter.UBX_SYNC_CHAR_1);
    dataView.setUint8(1, RaceBoxMessageFactoryAdapter.UBX_SYNC_CHAR_2);
    dataView.setUint8(2, message.class);
    dataView.setUint8(3, message.id);
    dataView.setUint16(4, message.payload.length, false); // Little-endian
    
    // Set payload
    packet.set(message.payload, RaceBoxMessageFactoryAdapter.UBX_HEADER_LENGTH);
    
    // Set checksum
    dataView.setUint8(RaceBoxMessageFactoryAdapter.UBX_HEADER_LENGTH + message.payload.length, message.checksum[0]);
    dataView.setUint8(RaceBoxMessageFactoryAdapter.UBX_HEADER_LENGTH + message.payload.length + 1, message.checksum[1]);
    
    return packet;
  }
} 