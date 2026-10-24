function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function isValidEncryptionKey(keyB64: string): boolean {
  try {
    return decodeBase64(keyB64).byteLength === 32
  } catch {
    return false
  }
}

async function importKey(keyB64: string, usage: KeyUsage[]): Promise<CryptoKey> {
  if (!isValidEncryptionKey(keyB64)) throw new Error('Invalid AES-256 key')
  return crypto.subtle.importKey('raw', new Uint8Array(decodeBase64(keyB64)), { name: 'AES-GCM' }, false, usage)
}

export async function encryptText(plain: string, keyB64: string): Promise<string> {
  const key = await importKey(keyB64, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new Uint8Array(new TextEncoder().encode(plain))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
  return `v1:${encodeBase64(iv)}:${encodeBase64(new Uint8Array(ciphertext))}`
}

export async function decryptText(stored: string, keyB64: string): Promise<string> {
  const [version, encodedIv, encodedCiphertext, ...extra] = stored.split(':')
  if (version !== 'v1' || !encodedIv || !encodedCiphertext || extra.length) throw new Error('Invalid encrypted text format')
  const iv = new Uint8Array(decodeBase64(encodedIv))
  if (iv.byteLength !== 12) throw new Error('Invalid AES-GCM IV')
  const key = await importKey(keyB64, ['decrypt'])
  const ciphertext = new Uint8Array(decodeBase64(encodedCiphertext))
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}
