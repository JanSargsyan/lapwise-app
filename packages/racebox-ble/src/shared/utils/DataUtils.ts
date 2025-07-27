// Data manipulation utilities
export class DataUtils {
  static convertToBuffer(data: string): Uint8Array {
    return new TextEncoder().encode(data);
  }

  static convertFromBuffer(buffer: Uint8Array): string {
    return new TextDecoder().decode(buffer);
  }

  static toBase64(data: Uint8Array): string {
    return Buffer.from(data).toString('base64');
  }

  static fromBase64(base64: string): Uint8Array {
    return Buffer.from(base64, 'base64');
  }

  static calculateChecksum(data: Uint8Array): [number, number] {
    let checksumA = 0;
    let checksumB = 0;

    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      if (byte !== undefined) {
        checksumA = (checksumA + byte) & 0xFF;
        checksumB = (checksumB + checksumA) & 0xFF;
      }
    }

    return [checksumA, checksumB];
  }

  static validateChecksum(data: Uint8Array, expectedChecksum: [number, number]): boolean {
    const [checksumA, checksumB] = this.calculateChecksum(data);
    return checksumA === expectedChecksum[0] && checksumB === expectedChecksum[1];
  }
} 