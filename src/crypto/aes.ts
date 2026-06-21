/**
 * AES-256-GCM encryption and decryption.
 *
 * Compatible with the t1yOS Go server's AES-256-GCM implementation.
 * Payload format: { "n": "<nonce base64>", "j": "<ciphertext base64>", "t": "<tag base64>" }
 *
 * Uses Web Crypto API when available (Web browsers, Node.js), with automatic
 * fallback to pure-JS implementation for environments without Web Crypto
 * (WeChat/QQ/Alipay Mini Programs, Quick App, etc.).
 */

import { aesGcmEncryptPure, aesGcmDecryptPure } from './aes-pure'

// Detect Web Crypto API (browser globalThis.crypto.subtle or Node require('node:crypto').webcrypto)
function getWebCrypto(): {
  subtle: SubtleCrypto
  getRandomValues: (arr: Uint8Array) => Uint8Array
} | null {
  try {
    if (typeof globalThis !== 'undefined') {
      // Browser
      if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
        return globalThis.crypto as ReturnType<typeof getWebCrypto>
      }
      // Node.js — try node:crypto.webcrypto
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const nodeReq = typeof require !== 'undefined' ? require : null
        if (nodeReq) {
          const nodeCryptoModule = nodeReq('node:crypto') as {
            webcrypto: { subtle: SubtleCrypto; getRandomValues: (arr: Uint8Array) => Uint8Array }
          }
          if (nodeCryptoModule?.webcrypto) {
            return nodeCryptoModule.webcrypto
          }
        }
      } catch {
        // fall through
      }
    }
  } catch {
    // globalThis not available
  }
  return null
}

/**
 * Check whether AES-256-GCM encryption/decryption is available in the current environment.
 *
 * Web Crypto API is available in modern browsers and Node.js.
 * In mini programs (WeChat/QQ/Alipay) and Quick App, the pure-JS fallback is used.
 *
 * @returns `true` if AES-256-GCM is available (always true since we have pure-JS fallback)
 */
export function isAESGCMAvailable(): boolean {
  // With pure-JS fallback, AES-GCM is always available
  return true
}

/**
 * Check whether the native Web Crypto API is available (faster than pure-JS fallback).
 */
export function isWebCryptoAvailable(): boolean {
  return getWebCrypto() !== null
}

// ==================== GCM constants ====================

/** GCM authentication tag length in bytes */
const AES_GCM_TAG_LENGTH = 16

/** AES-GCM nonce/IV length in bytes */
const AES_GCM_NONCE_LENGTH = 12

// ==================== Base64 helpers ====================

/** Get random bytes using the best available source */
function getRandomBytes(length: number): Uint8Array {
  const wc = getWebCrypto()
  if (wc) {
    const bytes = new Uint8Array(length)
    wc.getRandomValues(bytes)
    return bytes
  }

  // Fallback: Math.random-based (NOT cryptographically secure, but works everywhere)
  // For mini programs, they may have their own random API (e.g., wx.getRandomValues)
  try {
    if (
      typeof wx !== 'undefined' &&
      typeof (wx as Record<string, unknown>).getRandomValues === 'function'
    ) {
      const bytes = new Uint8Array(length)
      ;(wx as unknown as { getRandomValues: (arr: Uint8Array) => Uint8Array }).getRandomValues(
        bytes
      )
      return bytes
    }
  } catch {
    // fall through
  }

  // Last resort: Math.random (NOT cryptographically secure)
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }
  return bytes
}

function encodeBase64(uint8array: Uint8Array): string {
  let binary = ''
  const len = uint8array.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8array[i]!)
  }
  return btoa(binary)
}

function decodeBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// ==================== Public API types ====================

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

// ==================== Web Crypto implementation ====================

async function encryptAESGCMWebCrypto(data: string, keyBytes: Uint8Array): Promise<string> {
  const cryptoApi = getWebCrypto()!
  if (!cryptoApi) {
    throw new Error('Web Crypto API is not available')
  }

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

async function decryptAESGCMWebCrypto(jsonPayload: string, keyBytes: Uint8Array): Promise<string> {
  const cryptoApi = getWebCrypto()!
  if (!cryptoApi) {
    throw new Error('Web Crypto API is not available')
  }

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

// ==================== Pure-JS fallback implementation ====================

function encryptAESGCMPure(data: string, keyBytes: Uint8Array): string {
  const nonce = getRandomBytes(AES_GCM_NONCE_LENGTH)
  const plaintext = new TextEncoder().encode(data)

  const { ciphertext, tag } = aesGcmEncryptPure(plaintext, keyBytes, nonce)

  const payload: AESGCMPayload = {
    n: encodeBase64(nonce),
    j: encodeBase64(ciphertext),
    t: encodeBase64(tag),
  }

  return JSON.stringify(payload)
}

function decryptAESGCMPure(jsonPayload: string, keyBytes: Uint8Array): string {
  const { n, j, t } = JSON.parse(jsonPayload) as AESGCMPayload

  const nonce = decodeBase64(n)
  const ciphertext = decodeBase64(j)
  const tag = decodeBase64(t)

  const decrypted = aesGcmDecryptPure(ciphertext, tag, keyBytes, nonce)

  return new TextDecoder().decode(decrypted)
}

// ==================== Unified public API ====================

/**
 * Encrypt data using AES-256-GCM.
 *
 * Uses Web Crypto API when available (faster), falls back to pure-JS
 * implementation in environments without Web Crypto (mini programs, Quick App).
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

  if (getWebCrypto()) {
    return await encryptAESGCMWebCrypto(data, keyBytes)
  }

  // Pure-JS fallback (synchronous, but wrapped in async for consistent API)
  return encryptAESGCMPure(data, keyBytes)
}

/**
 * Decrypt data using AES-256-GCM.
 *
 * Uses Web Crypto API when available (faster), falls back to pure-JS
 * implementation in environments without Web Crypto (mini programs, Quick App).
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

  if (getWebCrypto()) {
    return await decryptAESGCMWebCrypto(jsonPayload, keyBytes)
  }

  // Pure-JS fallback
  return decryptAESGCMPure(jsonPayload, keyBytes)
}
