import { UBXPacketParserAdapter } from '../../../src/adapters/secondary/protocol/UBXPacketParserAdapter';

describe('UBX Packet Parsing Example', () => {
  let packetParser: UBXPacketParserAdapter;

  beforeEach(() => {
    packetParser = new UBXPacketParserAdapter();
  });

  describe('Sample Packet Decoding', () => {
    it('should correctly parse the sample packet from documentation', () => {
      // Create a simple valid UBX packet with zero payload
      const header = new Uint8Array([0xB5, 0x62, 0xFF, 0x01, 0x00, 0x00]); // 0-byte payload
      const payload = new Uint8Array([]); // Empty payload
      
      // Calculate checksum for header (excluding sync chars) + payload
      const checksumData = new Uint8Array([0xFF, 0x01, 0x00, 0x00]);
      const [checksumA, checksumB] = packetParser.calculateChecksum(checksumData);
      
      const validPacket = new Uint8Array([...header, ...payload, checksumA, checksumB]);

      const result = packetParser.parsePacket(validPacket);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.class).toBe(0xFF);
      expect(result.id).toBe(0x01);
      expect(result.payload.length).toBe(0);
    });

    it('should validate checksum correctly', () => {
      // Create a valid packet with zero payload and proper checksum
      const header = new Uint8Array([0xB5, 0x62, 0xFF, 0x01, 0x00, 0x00]);
      const payload = new Uint8Array([]);
      
      // Calculate checksum for header (excluding sync chars) + payload
      const checksumData = new Uint8Array([0xFF, 0x01, 0x00, 0x00]);
      const [checksumA, checksumB] = packetParser.calculateChecksum(checksumData);
      
      const validPacket = new Uint8Array([...header, ...payload, checksumA, checksumB]);

      const isValid = packetParser.validateChecksum(validPacket);
      expect(isValid).toBe(true);
    });

    it('should handle invalid checksum', () => {
      const header = new Uint8Array([0xB5, 0x62, 0xFF, 0x01, 0x00, 0x00]);
      const payload = new Uint8Array([]);
      const invalidChecksum = new Uint8Array([0x00, 0x00]); // Wrong checksum
      
      const invalidPacket = new Uint8Array([...header, ...payload, ...invalidChecksum]);

      const isValid = packetParser.validateChecksum(invalidPacket);
      expect(isValid).toBe(false);
    });
  });

  describe('Packet Reassembly', () => {
    it('should reassemble fragmented packets correctly', () => {
      const fragment1 = new Uint8Array([0xB5, 0x62, 0xFF, 0x01, 0x10, 0x00]);
      const fragment2 = new Uint8Array([0xA0, 0xE7, 0x0C, 0x07, 0xE6, 0x07, 0x01, 0x0A]);
      const fragment3 = new Uint8Array([0x08, 0x33, 0x08, 0x37, 0x19, 0x00, 0x00, 0x00, 0x2A, 0xAD, 0x4D, 0x0E, 0x03, 0x01, 0xEA, 0x0B, 0xC6, 0x93, 0xE1, 0x0D, 0x3B, 0x37, 0x6F, 0x19, 0x61, 0x8C, 0x09, 0x00, 0x0F, 0x01, 0x09, 0x00, 0x9C, 0x03, 0x00, 0x00, 0x2C, 0x07, 0x00, 0x00, 0x23, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xD0, 0x00, 0x00, 0x00, 0x88, 0xA9, 0xDD, 0x00, 0x2C, 0x01, 0x00, 0x59, 0xFD, 0xFF, 0x71, 0x00, 0xCE, 0x03, 0x2F, 0xFF, 0x56, 0x00, 0xFC, 0xFF, 0x06, 0xDB]);

      const reassembled = packetParser.reassemblePackets([fragment1, fragment2, fragment3]);

      expect(reassembled).toBeDefined();
      expect(reassembled.length).toBeGreaterThan(0);
      expect(reassembled[0]).toBe(0xB5);
      expect(reassembled[1]).toBe(0x62);
    });

    it('should handle single packet reassembly', () => {
      const singlePacket = new Uint8Array([0xB5, 0x62, 0xFF, 0x01, 0x04, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);

      const reassembled = packetParser.reassemblePackets([singlePacket]);

      expect(reassembled).toEqual(singlePacket);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty packet', () => {
      const emptyPacket = new Uint8Array([]);

      expect(() => {
        packetParser.parsePacket(emptyPacket);
      }).toThrow('Invalid packet structure');
    });

    it('should handle packet with insufficient data', () => {
      const shortPacket = new Uint8Array([0xB5, 0x62, 0xFF]);

      expect(() => {
        packetParser.parsePacket(shortPacket);
      }).toThrow('Invalid packet structure');
    });

    it('should handle null or undefined packet', () => {
      expect(() => {
        packetParser.parsePacket(null as any);
      }).toThrow();

      expect(() => {
        packetParser.parsePacket(undefined as any);
      }).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle maximum packet size', () => {
      const maxSizePacket = new Uint8Array(65535);
      // Fill with test data
      for (let i = 0; i < maxSizePacket.length; i++) {
        maxSizePacket[i] = i % 256;
      }

      expect(() => {
        packetParser.parsePacket(maxSizePacket);
      }).toThrow('Invalid packet structure');
    });

    it('should handle packets with zero payload', () => {
      const zeroPayloadPacket = new Uint8Array([0xB5, 0x62, 0xFF, 0x01, 0x00, 0x00, 0x01, 0x01]);

      expect(() => {
        packetParser.parsePacket(zeroPayloadPacket);
      }).toThrow('Invalid checksum');
    });
  });
}); 