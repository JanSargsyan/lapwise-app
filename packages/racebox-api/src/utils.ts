// Utility functions for base64 encoding/decoding in Node.js and browser environments

export function toBase64(uint8: Uint8Array): string {
  // Node.js Buffer or browser
  if (typeof Buffer !== 'undefined')
    return Buffer.from(uint8).toString('base64');
  // Fallback for browser
  let binary = '';
  for (let i = 0; i < uint8.length; i++)
    binary += String.fromCharCode(uint8[i]!);
  return btoa(binary);
}

export function fromBase64(str: string): Uint8Array {
  if (typeof Buffer !== 'undefined')
    return new Uint8Array(Buffer.from(str, 'base64'));
  // Fallback for browser
  if (typeof atob === 'function') {
    const binary = atob(str);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return arr;
  }
  throw new Error('No base64 decoder available in this environment');
}
