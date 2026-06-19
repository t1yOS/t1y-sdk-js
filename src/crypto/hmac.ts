/**
 * HMAC-SHA256 implementation — works in both Node.js and browser environments.
 *
 * Node.js (CJS): Uses node:crypto (synchronous via require)
 * Browser / ESM: Uses pure-JS implementation operating on Uint8Array
 */

import { sha256RawBytesHex } from './sha256'

// Detect if require is available (CJS context)
function getNodeRequire(): ((m: string) => unknown) | null {
  try {
    if (typeof require !== 'undefined') {
      return require
    }
  } catch {
    // require is not defined (ESM or browser)
  }
  return null
}

/**
 * Compute HMAC-SHA256 and return hex digest.
 *
 * This is intentionally synchronous because it's called in the request
 * signing path, which must be fast and cannot defer to async.
 *
 * @param secret - The secret key (raw string, used as-is as bytes)
 * @param message - The message to sign
 * @returns Hex-encoded HMAC-SHA256 signature (64 hex characters)
 */
export function hmacSHA256Hex(secret: string, message: string): string {
  const nodeReq = getNodeRequire()
  if (nodeReq) {
    try {
      const nodeCrypto = nodeReq('node:crypto') as {
        createHmac: (
          alg: string,
          key: string
        ) => { update: (d: string) => { digest: (enc: string) => string } }
      }
      return nodeCrypto.createHmac('sha256', secret).update(message).digest('hex')
    } catch {
      // fall through to pure-JS
    }
  }

  // Pure-JS HMAC-SHA256 implementation
  return hmacSHA256Pure(secret, message)
}

/**
 * Compute HMAC-SHA256 asynchronously using Web Crypto API.
 */
export async function hmacSHA256HexAsync(secret: string, message: string): Promise<string> {
  const nodeReq = getNodeRequire()
  if (nodeReq) {
    try {
      const nodeCrypto = nodeReq('node:crypto') as {
        createHmac: (
          alg: string,
          key: string
        ) => { update: (d: string) => { digest: (enc: string) => string } }
      }
      return nodeCrypto.createHmac('sha256', secret).update(message).digest('hex')
    } catch {
      // fall through
    }
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret) as Uint8Array<ArrayBuffer>,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message) as Uint8Array<ArrayBuffer>
  )
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Verify an HMAC-SHA256 signature using constant-time comparison.
 */
export function verifyHmacSHA256(secret: string, message: string, signature: string): boolean {
  if (typeof signature !== 'string') return false
  const expected = hmacSHA256Hex(secret, message)
  return timingSafeEqual(expected, signature.toLowerCase())
}

/** Constant-time string comparison */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// ==================== Pure-JS HMAC-SHA256 ====================

/**
 * HMAC-SHA256 using only pure-JS SHA-256 (byte-oriented).
 *
 * Implements: HMAC(K, m) = H((K' XOR opad) || H((K' XOR ipad) || m))
 * where H is SHA-256, K' is the processed key, ipad=0x36, opad=0x5c
 *
 * This implementation uses Uint8Array for ALL binary data,
 * avoiding the corruption issue with raw-byte-in-JS-strings.
 */
function hmacSHA256Pure(secret: string, message: string): string {
  const BLOCK_SIZE = 64

  // Convert secret and message to UTF-8 bytes
  let keyBytes = utf8ToBytes(secret)
  const msgBytes = utf8ToBytes(message)

  // If key is longer than block size, hash it first
  if (keyBytes.length > BLOCK_SIZE) {
    keyBytes = hexToBytes(sha256RawBytesHex(keyBytes))
  }

  // Pad key to block size (or truncate — should not happen for SHA-256)
  const paddedKey = new Uint8Array(BLOCK_SIZE)
  paddedKey.set(keyBytes.subarray(0, Math.min(keyBytes.length, BLOCK_SIZE)))
  // rest is already zero-initialized

  // Compute inner: H((key XOR ipad) || message)
  const ipad = new Uint8Array(BLOCK_SIZE)
  ipad.fill(0x36)
  const innerKey = xorBytes(paddedKey, ipad)
  const innerData = new Uint8Array(BLOCK_SIZE + msgBytes.length)
  innerData.set(innerKey)
  innerData.set(msgBytes, BLOCK_SIZE)
  const innerHash = hexToBytes(sha256RawBytesHex(innerData))

  // Compute outer: H((key XOR opad) || innerHash)
  const opad = new Uint8Array(BLOCK_SIZE)
  opad.fill(0x5c)
  const outerKey = xorBytes(paddedKey, opad)
  const outerData = new Uint8Array(BLOCK_SIZE + innerHash.length)
  outerData.set(outerKey)
  outerData.set(innerHash, BLOCK_SIZE)

  return sha256RawBytesHex(outerData)
}

/** XOR two Uint8Arrays (must be same length) */
function xorBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const result = new Uint8Array(a.length)
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i]! ^ b[i]!
  }
  return result as Uint8Array<ArrayBuffer>
}

/** UTF-8 encode a string to Uint8Array */
function utf8ToBytes(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str) as Uint8Array<ArrayBuffer>
  }
  // Fallback for ancient browsers
  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i)
    if (c < 0x80) {
      bytes.push(c)
    } else if (c < 0x800) {
      bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f))
    } else if (c < 0xd800 || c >= 0xe000) {
      bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f))
    } else {
      i++
      const c2 = str.charCodeAt(i)
      const cp = 0x10000 + ((c & 0x3ff) << 10) + (c2 & 0x3ff)
      bytes.push(
        0xf0 | (cp >> 18),
        0x80 | ((cp >> 12) & 0x3f),
        0x80 | ((cp >> 6) & 0x3f),
        0x80 | (cp & 0x3f)
      )
    }
  }
  return new Uint8Array(bytes) as Uint8Array<ArrayBuffer>
}

/** Convert hex string to Uint8Array */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes as Uint8Array<ArrayBuffer>
}
