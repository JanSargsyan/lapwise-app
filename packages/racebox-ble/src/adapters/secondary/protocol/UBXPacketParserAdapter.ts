import { PacketParserPort, RaceBoxMessage } from '../../ports/secondary/PacketParserPort';
import { LiveDataMessage } from '../../../domain/entities/LiveDataMessage';

export class UBXPacketParserAdapter implements PacketParserPort {
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

  parsePacket(data: Uint8Array): RaceBoxMessage {
    if (!this.validatePacketStructure(data)) {
      throw new Error('Invalid packet structure');
    }

    if (!this.validateChecksum(data)) {
      throw new Error('Invalid checksum');
    }

    const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
    
    // Parse UBX header
    const syncChar1 = dataView.getUint8(0);
    const syncChar2 = dataView.getUint8(1);
    const messageClass = dataView.getUint8(2);
    const messageId = dataView.getUint8(3);
    const payloadLength = dataView.getUint16(4, false); // Little-endian

    // Extract payload
    const payloadStart = 6;
    const payload = data.slice(payloadStart, payloadStart + payloadLength);

    // Extract checksum
    const checksumStart = payloadStart + payloadLength;
    const checksumA = dataView.getUint8(checksumStart);
    const checksumB = dataView.getUint8(checksumStart + 1);

    return {
      class: messageClass,
      id: messageId,
      payload,
      checksum: [checksumA, checksumB]
    };
  }

  validateChecksum(packet: Uint8Array): boolean {
    if (packet.length < this.getPacketLength(packet)) {
      return false;
    }

    const dataView = new DataView(packet.buffer, packet.byteOffset, packet.byteLength);
    const payloadLength = dataView.getUint16(4, false);
    const totalLength = UBXPacketParserAdapter.UBX_HEADER_LENGTH + payloadLength + UBXPacketParserAdapter.UBX_CHECKSUM_LENGTH;

    if (packet.length < totalLength) {
      return false;
    }

    // Calculate checksum
    let checksumA = 0;
    let checksumB = 0;

    // Calculate checksum over header (excluding sync chars) and payload
    for (let i = 2; i < UBXPacketParserAdapter.UBX_HEADER_LENGTH + payloadLength; i++) {
      checksumA = (checksumA + packet[i]) & 0xFF;
      checksumB = (checksumB + checksumA) & 0xFF;
    }

    // Get expected checksum
    const expectedChecksumA = packet[UBXPacketParserAdapter.UBX_HEADER_LENGTH + payloadLength];
    const expectedChecksumB = packet[UBXPacketParserAdapter.UBX_HEADER_LENGTH + payloadLength + 1];

    return checksumA === expectedChecksumA && checksumB === expectedChecksumB;
  }

  reassemblePackets(fragments: Uint8Array[]): Uint8Array {
    if (fragments.length === 0) {
      throw new Error('No fragments provided');
    }

    if (fragments.length === 1) {
      return fragments[0];
    }

    // Calculate total length
    let totalLength = 0;
    for (const fragment of fragments) {
      totalLength += fragment.length;
    }

    // Combine fragments
    const reassembled = new Uint8Array(totalLength);
    let offset = 0;
    for (const fragment of fragments) {
      reassembled.set(fragment, offset);
      offset += fragment.length;
    }

    return reassembled;
  }

  getMessageType(packet: Uint8Array): string {
    try {
      const message = this.parsePacket(packet);
      
      if (message.class === UBXPacketParserAdapter.RACEBOX_CLASS) {
        switch (message.id) {
          case UBXPacketParserAdapter.RACEBOX_LIVE_DATA_ID:
            return 'LiveData';
          case UBXPacketParserAdapter.RACEBOX_GNSS_CONFIG_ID:
            return 'GNSSConfig';
          case UBXPacketParserAdapter.RACEBOX_RECORDING_CONFIG_ID:
            return 'RecordingConfig';
          case UBXPacketParserAdapter.RACEBOX_START_RECORDING_ID:
            return 'StartRecording';
          case UBXPacketParserAdapter.RACEBOX_STOP_RECORDING_ID:
            return 'StopRecording';
          case UBXPacketParserAdapter.RACEBOX_PAUSE_RECORDING_ID:
            return 'PauseRecording';
          case UBXPacketParserAdapter.RACEBOX_DOWNLOAD_HISTORY_ID:
            return 'DownloadHistory';
          case UBXPacketParserAdapter.RACEBOX_ERASE_MEMORY_ID:
            return 'EraseMemory';
          case UBXPacketParserAdapter.RACEBOX_UNLOCK_MEMORY_ID:
            return 'UnlockMemory';
          case UBXPacketParserAdapter.RACEBOX_ACK_ID:
            return 'Acknowledgment';
          case UBXPacketParserAdapter.RACEBOX_NACK_ID:
            return 'NegativeAcknowledgment';
          default:
            return `UnknownRaceBox(${message.id})`;
        }
      }

      return `UBX(${message.class},${message.id})`;
    } catch (error) {
      return 'InvalidPacket';
    }
  }

  isLiveDataMessage(packet: Uint8Array): boolean {
    try {
      const message = this.parsePacket(packet);
      return message.class === UBXPacketParserAdapter.RACEBOX_CLASS && 
             message.id === UBXPacketParserAdapter.RACEBOX_LIVE_DATA_ID;
    } catch {
      return false;
    }
  }

  isConfigurationMessage(packet: Uint8Array): boolean {
    try {
      const message = this.parsePacket(packet);
      return message.class === UBXPacketParserAdapter.RACEBOX_CLASS && 
             (message.id === UBXPacketParserAdapter.RACEBOX_GNSS_CONFIG_ID ||
              message.id === UBXPacketParserAdapter.RACEBOX_RECORDING_CONFIG_ID);
    } catch {
      return false;
    }
  }

  isAcknowledgmentMessage(packet: Uint8Array): boolean {
    try {
      const message = this.parsePacket(packet);
      return message.class === UBXPacketParserAdapter.RACEBOX_CLASS && 
             (message.id === UBXPacketParserAdapter.RACEBOX_ACK_ID ||
              message.id === UBXPacketParserAdapter.RACEBOX_NACK_ID);
    } catch {
      return false;
    }
  }

  extractLiveData(packet: Uint8Array): LiveDataMessage {
    if (!this.isLiveDataMessage(packet)) {
      throw new Error('Packet is not a live data message');
    }

    const message = this.parsePacket(packet);
    const dataView = new DataView(message.payload.buffer, message.payload.byteOffset, message.payload.byteLength);
    let offset = 0;

    // Parse position data (16 bytes)
    const latitude = dataView.getInt32(offset, true) / 10000000;
    offset += 4;
    const longitude = dataView.getInt32(offset, true) / 10000000;
    offset += 4;
    const altitude = dataView.getInt32(offset, true) / 1000;
    offset += 4;
    const accuracy = dataView.getUint32(offset, true) / 1000;
    offset += 4;

    // Parse motion data
    const speed = dataView.getUint32(offset, true);
    offset += 4;
    const heading = dataView.getUint32(offset, true);
    offset += 4;

    // Parse GNSS status
    const fixStatus = dataView.getUint8(offset);
    offset += 1;
    const numSatellites = dataView.getUint8(offset);
    offset += 1;
    const pdop = dataView.getUint16(offset, true) / 100;
    offset += 2;

    // Parse system status
    const batteryLevel = dataView.getUint8(offset);
    offset += 1;
    const isCharging = (dataView.getUint8(offset) & 0x01) !== 0;
    offset += 1;

    // Create LiveDataMessage
    const liveDataMessage: LiveDataMessage = {
      timestamp: new Date(),
      position: {
        latitude,
        longitude,
        altitude,
        accuracy,
        timestamp: new Date()
      },
      motion: {
        speed: { value: (speed / 1000) * 3.6, accuracy: 0.1 },
        heading: { value: heading / 100000, accuracy: 0.1 },
        gForce: { x: 0, y: 0, z: 0 },
        rotationRate: { x: 0, y: 0, z: 0 },
        timestamp: new Date()
      },
      gnssStatus: {
        fixStatus,
        numSatellites,
        pdop,
        horizontalAccuracy: accuracy,
        verticalAccuracy: accuracy
      },
      systemStatus: {
        batteryLevel,
        isCharging,
        temperature: undefined
      },
      sensorData: {
        gForce: { x: 0, y: 0, z: 0 },
        rotationRate: { x: 0, y: 0, z: 0 },
        timestamp: new Date()
      }
    };

    return liveDataMessage;
  }

  extractConfiguration(packet: Uint8Array): any {
    if (!this.isConfigurationMessage(packet)) {
      throw new Error('Packet is not a configuration message');
    }

    const message = this.parsePacket(packet);
    
    switch (message.id) {
      case UBXPacketParserAdapter.RACEBOX_GNSS_CONFIG_ID:
        return this.extractGNSSConfiguration(message.payload);
      case UBXPacketParserAdapter.RACEBOX_RECORDING_CONFIG_ID:
        return this.extractRecordingConfiguration(message.payload);
      default:
        throw new Error(`Unknown configuration message ID: ${message.id}`);
    }
  }

  extractAcknowledgment(packet: Uint8Array): { success: boolean; message: string } {
    if (!this.isAcknowledgmentMessage(packet)) {
      throw new Error('Packet is not an acknowledgment message');
    }

    const message = this.parsePacket(packet);
    
    if (message.id === UBXPacketParserAdapter.RACEBOX_ACK_ID) {
      return { success: true, message: 'Command acknowledged' };
    } else if (message.id === UBXPacketParserAdapter.RACEBOX_NACK_ID) {
      return { success: false, message: 'Command rejected' };
    } else {
      throw new Error(`Unknown acknowledgment message ID: ${message.id}`);
    }
  }

  calculateChecksum(data: Uint8Array): [number, number] {
    let checksumA = 0;
    let checksumB = 0;

    for (let i = 0; i < data.length; i++) {
      checksumA = (checksumA + data[i]) & 0xFF;
      checksumB = (checksumB + checksumA) & 0xFF;
    }

    return [checksumA, checksumB];
  }

  validatePacketStructure(packet: Uint8Array): boolean {
    if (packet.length < UBXPacketParserAdapter.UBX_HEADER_LENGTH) {
      return false;
    }

    // Check sync characters
    if (packet[0] !== UBXPacketParserAdapter.UBX_SYNC_CHAR_1 ||
        packet[1] !== UBXPacketParserAdapter.UBX_SYNC_CHAR_2) {
      return false;
    }

    // Check payload length
    const dataView = new DataView(packet.buffer, packet.byteOffset, packet.byteLength);
    const payloadLength = dataView.getUint16(4, false);
    const expectedLength = UBXPacketParserAdapter.UBX_HEADER_LENGTH + payloadLength + UBXPacketParserAdapter.UBX_CHECKSUM_LENGTH;

    return packet.length >= expectedLength;
  }

  getPacketLength(packet: Uint8Array): number {
    if (packet.length < UBXPacketParserAdapter.UBX_HEADER_LENGTH) {
      return 0;
    }

    const dataView = new DataView(packet.buffer, packet.byteOffset, packet.byteLength);
    const payloadLength = dataView.getUint16(4, false);
    
    return UBXPacketParserAdapter.UBX_HEADER_LENGTH + payloadLength + UBXPacketParserAdapter.UBX_CHECKSUM_LENGTH;
  }

  private extractGNSSConfiguration(payload: Uint8Array): any {
    const dataView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    
    return {
      platformModel: dataView.getUint8(0),
      enable3DSpeed: (dataView.getUint8(1) & 0x01) !== 0,
      minHorizontalAccuracy: dataView.getUint16(2, true) / 1000
    };
  }

  private extractRecordingConfiguration(payload: Uint8Array): any {
    const dataView = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    
    return {
      enabled: (dataView.getUint8(0) & 0x01) !== 0,
      dataRate: dataView.getUint8(1),
      filters: {
        minSpeed: dataView.getUint16(2, true) / 100,
        maxSpeed: dataView.getUint16(4, true) / 100,
        minAccuracy: dataView.getUint16(6, true) / 1000
      }
    };
  }
} 