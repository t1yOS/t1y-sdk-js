/**
 * AES-256-GCM encryption and decryption.
 *
 * Compatible with the t1yOS Go server's AES-256-GCM implementation.
 * Payload format: { "n": "<nonce base64>", "j": "<ciphertext base64>", "t": "<tag base64>" }
 *
 * Works in both Node.js and browser via Web Crypto API.
 */

// Detect Web Crypto API (browser globalThis.crypto.subtle or Node require('node:crypto').webcrypto)
function getCrypto(): { subtle: SubtleCrypto; getRandomValues: (arr: Uint8Array) => Uint8Array } {
  if (typeof globalThis !== 'undefined') {
    // Browser
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
      return globalThis.crypto as ReturnType<typeof getCrypto>
    }
    // Node.js — try node:crypto.webcrypto
    try {
      const nodeCryptoModule = (globalThis as unknown as Record<string, unknown>).require
        ? (((globalThis as unknown as Record<string, unknown>).require as (m: string) => unknown)(
            'node:crypto'
          ) as {
            webcrypto: { subtle: SubtleCrypto; getRandomValues: (arr: Uint8Array) => Uint8Array }
          })
        : null
      if (nodeCryptoModule?.webcrypto) {
        return nodeCryptoModule.webcrypto
      }
    } catch {
      // fall through
    }
  }
  throw new Error('Web Crypto API is not available in this environment')
}

/** GCM authentication tag length in bytes */
const AES_GCM_TAG_LENGTH = 16

/** AES-GCM nonce/IV length in bytes */
const AES_GCM_NONCE_LENGTH = 12

// === Base64 helpers (compatible with Go's encoding/base64.StdEncoding) ===

function encodeBase64(uint8array: Uint8Array): string {
  let binary = ''
  const len = uint8array.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8array[i]!)
  }
  return btoa(binary)
}

function decodeBase64(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64)
  const len = binary.length
  const bytes = new Uint8Array(len) as Uint8Array<ArrayBuffer>
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * AES-256-GCM encrypted payload structure.
 * Matches the Go server's AESGCMEncryptedPayload struct.
 */
export interface AESGCMPayload {
  /** Base64-encoded nonce */
  n: string
  /** Base64-encoded ciphertext */
  j: string
  /** Base64-encoded authentication tag */
  t: string
}

/**
 * Encrypt data using AES-256-GCM.
 *
 * @param data - The plaintext data to encrypt (string)
 * @param keyBytes - 32-byte encryption key (Uint8Array)
 * @returns JSON string of { n, j, t } payload
 */
export async function encryptAESGCM(data: string, keyBytes: Uint8Array): Promise<string> {
  if (!(keyBytes instanceof Uint8Array)) {
    throw new Error('key must be Uint8Array')
  }
  if (keyBytes.length !== 32) {
    throw new Error('key length must be 32 bytes for AES-256-GCM')
  }

  const cryptoApi = getCrypto()

  const key = await cryptoApi.subtle.importKey(
    'raw',
    keyBytes as Uint8Array<ArrayBuffer>,
    'AES-GCM',
    false,
    ['encrypt']
  )

  const nonce = new Uint8Array(AES_GCM_NONCE_LENGTH)
  cryptoApi.getRandomValues(nonce)

  const encodedData = new TextEncoder().encode(data) as Uint8Array<ArrayBuffer>

  const encrypted = new Uint8Array(
    await cryptoApi.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce as Uint8Array<ArrayBuffer>, tagLength: 128 },
      key,
      encodedData
    )
  )

  const ciphertext = encrypted.slice(0, encrypted.length - AES_GCM_TAG_LENGTH)
  const tag = encrypted.slice(encrypted.length - AES_GCM_TAG_LENGTH)

  const payload: AESGCMPayload = {
    n: encodeBase64(nonce),
    j: encodeBase64(ciphertext),
    t: encodeBase64(tag),
  }

  return JSON.stringify(payload)
}

/**
 * Decrypt data using AES-256-GCM.
 *
 * @param jsonPayload - JSON string of { n, j, t } payload
 * @param keyBytes - 32-byte decryption key (Uint8Array)
 * @returns Decrypted plaintext string
 */
export async function decryptAESGCM(jsonPayload: string, keyBytes: Uint8Array): Promise<string> {
  if (!(keyBytes instanceof Uint8Array)) {
    throw new Error('key must be Uint8Array')
  }
  if (keyBytes.length !== 32) {
    throw new Error('key length must be 32 bytes for AES-256-GCM')
  }

  const cryptoApi = getCrypto()

  const { n, j, t } = JSON.parse(jsonPayload) as AESGCMPayload

  const nonce = decodeBase64(n)
  const ciphertext = decodeBase64(j)
  const tag = decodeBase64(t)

  const sealed = new Uint8Array(ciphertext.length + tag.length)
  sealed.set(ciphertext)
  sealed.set(tag, ciphertext.length)

  const key = await cryptoApi.subtle.importKey(
    'raw',
    keyBytes as Uint8Array<ArrayBuffer>,
    'AES-GCM',
    false,
    ['decrypt']
  )

  const decrypted = await cryptoApi.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce as Uint8Array<ArrayBuffer>, tagLength: 128 },
    key,
    sealed as Uint8Array<ArrayBuffer>
  )

  return new TextDecoder().decode(decrypted)
}
