function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function uuidV4(): string {
  const cryptoObj: Crypto | undefined = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  const bytes = new Uint8Array(16);
  cryptoObj.getRandomValues(bytes);

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = toHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
