import { toBase64, fromBase64 } from './utils';

describe('base64 utils', () => {
  it('encodes and decodes a Uint8Array (round-trip)', () => {
    const arr = new Uint8Array([1, 2, 3, 4, 255]);
    const b64 = toBase64(arr);
    const decoded = fromBase64(b64);
    expect(Array.from(decoded)).toEqual(Array.from(arr));
  });

  it('encodes and decodes an empty Uint8Array', () => {
    const arr = new Uint8Array([]);
    const b64 = toBase64(arr);
    const decoded = fromBase64(b64);
    expect(Array.from(decoded)).toEqual([]);
  });

  it('encodes a known value', () => {
    const arr = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    expect(toBase64(arr)).toBe('SGVsbG8=');
  });

  it('decodes a known base64 string', () => {
    const b64 = 'SGVsbG8=';
    expect(Array.from(fromBase64(b64))).toEqual([72, 101, 108, 108, 111]);
  });
});
