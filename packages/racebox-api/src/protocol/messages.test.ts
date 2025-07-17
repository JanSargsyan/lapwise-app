import { decodePacket, decodeGnssConfig } from './messages';

// Helper function to calculate UBX checksum
function calculateChecksum(data: Uint8Array): [number, number] {
  let ckA = 0,
    ckB = 0;
  for (let i = 0; i < data.length; i++) {
    ckA = (ckA + data[i]!) & 0xff;
    ckB = (ckB + ckA) & 0xff;
  }
  return [ckA, ckB];
}

describe('decodePacket', () => {
  it('decodes a valid packet from documentation', () => {
    // Sample packet from documentation: B5 62 FF 01 50 00 ...
    const packet = new Uint8Array([
      0xb5, 0x62, 0xff, 0x01, 0x50, 0x00, 0xa0, 0xe7, 0x0c, 0x07, 0xe6, 0x07,
      0x01, 0x0a, 0x08, 0x33, 0x08, 0x37, 0x19, 0x00, 0x00, 0x00, 0x2a, 0xad,
      0x4d, 0x0e, 0x03, 0x01, 0xea, 0x0b, 0xc6, 0x93, 0xe1, 0x0d, 0x3b, 0x37,
      0x6f, 0x19, 0x61, 0x8c, 0x09, 0x00, 0x0f, 0x01, 0x09, 0x00, 0x9c, 0x03,
      0x00, 0x00, 0x2c, 0x07, 0x00, 0x00, 0x23, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0xd0, 0x00, 0x00, 0x00, 0x88, 0xa9, 0xdd, 0x00, 0x2c, 0x01,
      0x00, 0x59, 0xfd, 0xff, 0x71, 0x00, 0xce, 0x03, 0x2f, 0xff, 0x56, 0x00,
      0xfc, 0xff, 0x06, 0xdb,
    ]);

    const result = decodePacket(packet);
    expect(result).not.toBeNull();
    expect(result?.messageClass).toBe(0xff);
    expect(result?.messageId).toBe(0x01);
    expect(result?.payload.length).toBe(0x50); // 80 bytes
  });

  it('decodes a simple packet with empty payload', () => {
    const header = [0xff, 0x22, 0x00, 0x00]; // Class, ID, Length (0)
    const [ckA, ckB] = calculateChecksum(new Uint8Array(header));

    const packet = new Uint8Array([
      0xb5,
      0x62, // UBX header
      ...header, // Class, ID, Length
      ckA,
      ckB, // Checksum
    ]);

    const result = decodePacket(packet);
    expect(result).not.toBeNull();
    expect(result?.messageClass).toBe(0xff);
    expect(result?.messageId).toBe(0x22);
    expect(result?.payload.length).toBe(0);
  });

  it('returns null for packet with wrong header', () => {
    const packet = new Uint8Array([
      0xb6,
      0x62,
      0xff,
      0x01,
      0x00,
      0x00,
      0x02,
      0x03, // Wrong first byte
    ]);

    const result = decodePacket(packet);
    expect(result).toBeNull();
  });

  it('returns null for packet that is too short', () => {
    const packet = new Uint8Array([0xb5, 0x62, 0xff, 0x01]); // Too short

    const result = decodePacket(packet);
    expect(result).toBeNull();
  });

  it('returns null for packet with invalid checksum', () => {
    const packet = new Uint8Array([
      0xb5,
      0x62,
      0xff,
      0x01,
      0x00,
      0x00,
      0x00,
      0x00, // Wrong checksum
    ]);

    const result = decodePacket(packet);
    expect(result).toBeNull();
  });

  it('decodes a packet with payload', () => {
    const payload = new Uint8Array([1, 2, 3, 4]);
    const header = [0xff, 0x25, 0x04, 0x00]; // Class, ID, Length (4)
    const [ckA, ckB] = calculateChecksum(
      new Uint8Array([...header, ...payload])
    );

    const packet = new Uint8Array([
      0xb5,
      0x62, // UBX header
      ...header, // Class, ID, Length
      ...payload, // Payload
      ckA,
      ckB, // Checksum
    ]);

    const result = decodePacket(packet);
    expect(result).not.toBeNull();
    expect(result?.messageClass).toBe(0xff);
    expect(result?.messageId).toBe(0x25);
    expect(Array.from(result?.payload || [])).toEqual([1, 2, 3, 4]);
  });

  it('handles packet with maximum payload size', () => {
    const payload = new Uint8Array(504); // Max payload size
    payload.fill(0xaa);

    const header = [0xff, 0x01, 0xf8, 0x01]; // Class, ID, Length (504)
    const [ckA, ckB] = calculateChecksum(
      new Uint8Array([...header, ...payload])
    );

    const packet = new Uint8Array([
      0xb5,
      0x62, // UBX header
      ...header, // Class, ID, Length
      ...payload, // Payload
      ckA,
      ckB, // Checksum
    ]);

    const result = decodePacket(packet);
    expect(result).not.toBeNull();
    expect(result?.payload.length).toBe(504);
  });
});

describe('decodeGnssConfig', () => {
  it('decodes a valid GNSS config payload', () => {
    const payload = new Uint8Array([4, 1, 5]); // Automotive, 3D speed enabled, 5m accuracy
    const result = decodeGnssConfig(payload);
    expect(result).toEqual({
      platformModel: 4,
      enable3DSpeed: true,
      minHorizontalAccuracy: 5,
    });
  });

  it('decodes a GNSS config with all zeros', () => {
    const payload = new Uint8Array([0, 0, 0]);
    const result = decodeGnssConfig(payload);
    expect(result).toEqual({
      platformModel: 0,
      enable3DSpeed: false,
      minHorizontalAccuracy: 0,
    });
  });

  it('decodes a GNSS config with all ones', () => {
    const payload = new Uint8Array([8, 1, 255]);
    const result = decodeGnssConfig(payload);
    expect(result).toEqual({
      platformModel: 8,
      enable3DSpeed: true,
      minHorizontalAccuracy: 255,
    });
  });

  it('returns null for invalid length', () => {
    expect(decodeGnssConfig(new Uint8Array([1, 2]))).toBeNull();
    expect(decodeGnssConfig(new Uint8Array([1, 2, 3, 4]))).toBeNull();
    expect(decodeGnssConfig(new Uint8Array([]))).toBeNull();
  });
});
