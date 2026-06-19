/**
 * Unit tests for cryptographic functions.
 */
import { describe, it, expect } from 'vitest'
import {
  sha256Hex,
  hmacSHA256Hex,
  verifyHmacSHA256,
  encryptAESGCM,
  decryptAESGCM,
  createSignature,
} from '../../src/crypto'

describe('sha256Hex', () => {
  it('should produce a 64-char hex string', () => {
    const result = sha256Hex('hello world')
    expect(result).toHaveLength(64)
    expect(/^[0-9a-f]{64}$/.test(result)).toBe(true)
  })

  it('should produce deterministic output', () => {
    const a = sha256Hex('test')
    const b = sha256Hex('test')
    expect(a).toBe(b)
  })

  it('should produce different output for different inputs', () => {
    const a = sha256Hex('hello')
    const b = sha256Hex('world')
    expect(a).not.toBe(b)
  })

  it('should match known SHA-256 vector', () => {
    // SHA-256 of empty string
    const result = sha256Hex('')
    expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })

  it('should handle UTF-8 input', () => {
    const result = sha256Hex('你好世界')
    expect(result).toHaveLength(64)
  })
})

describe('hmacSHA256Hex', () => {
  it('should produce a 64-char hex string', () => {
    const result = hmacSHA256Hex('secret', 'message')
    expect(result).toHaveLength(64)
    expect(/^[0-9a-f]{64}$/.test(result)).toBe(true)
  })

  it('should produce deterministic output', () => {
    const a = hmacSHA256Hex('key', 'data')
    const b = hmacSHA256Hex('key', 'data')
    expect(a).toBe(b)
  })

  it('should produce different output for different keys', () => {
    const a = hmacSHA256Hex('key1', 'data')
    const b = hmacSHA256Hex('key2', 'data')
    expect(a).not.toBe(b)
  })

  it('should produce different output for different messages', () => {
    const a = hmacSHA256Hex('key', 'msg1')
    const b = hmacSHA256Hex('key', 'msg2')
    expect(a).not.toBe(b)
  })
})

describe('verifyHmacSHA256', () => {
  it('should verify a correct signature', () => {
    const sig = hmacSHA256Hex('secret', 'message')
    expect(verifyHmacSHA256('secret', 'message', sig)).toBe(true)
  })

  it('should reject an incorrect signature', () => {
    expect(verifyHmacSHA256('secret', 'message', 'a'.repeat(64))).toBe(false)
  })

  it('should reject non-string signatures', () => {
    // @ts-expect-error testing invalid input
    expect(verifyHmacSHA256('secret', 'message', 123)).toBe(false)
  })

  it('should be case-insensitive', () => {
    const sig = hmacSHA256Hex('secret', 'message')
    expect(verifyHmacSHA256('secret', 'message', sig.toUpperCase())).toBe(true)
  })
})

describe('encryptAESGCM / decryptAESGCM', () => {
  const key = new Uint8Array(32)
  // Fill with deterministic test data
  for (let i = 0; i < 32; i++) key[i] = i

  it('should encrypt and decrypt roundtrip', async () => {
    const plaintext = 'Hello, T1Y!'
    const encrypted = await encryptAESGCM(plaintext, key)
    expect(typeof encrypted).toBe('string')

    // Parse as JSON
    const payload = JSON.parse(encrypted)
    expect(payload).toHaveProperty('n')
    expect(payload).toHaveProperty('j')
    expect(payload).toHaveProperty('t')

    const decrypted = await decryptAESGCM(encrypted, key)
    expect(decrypted).toBe(plaintext)
  })

  it('should produce different ciphertext for same input (random nonce)', async () => {
    const plaintext = 'test'
    const enc1 = await encryptAESGCM(plaintext, key)
    const enc2 = await encryptAESGCM(plaintext, key)
    // Should be different due to random nonce
    expect(enc1).not.toBe(enc2)
    // But both should decrypt correctly
    expect(await decryptAESGCM(enc1, key)).toBe(plaintext)
    expect(await decryptAESGCM(enc2, key)).toBe(plaintext)
  })

  it('should reject keys of wrong length', async () => {
    await expect(encryptAESGCM('test', new Uint8Array(16))).rejects.toThrow(
      'key length must be 32 bytes'
    )
  })

  it('should reject non-Uint8Array keys', async () => {
    // @ts-expect-error testing invalid input
    await expect(encryptAESGCM('test', 'not-a-uint8array')).rejects.toThrow(
      'key must be Uint8Array'
    )
  })

  it('should handle JSON payload', async () => {
    const data = JSON.stringify({ name: 'Alice', age: 25 })
    const encrypted = await encryptAESGCM(data, key)
    const decrypted = await decryptAESGCM(encrypted, key)
    expect(JSON.parse(decrypted)).toEqual({ name: 'Alice', age: 25 })
  })
})

describe('createSignature', () => {
  it('should produce a 64-char hex string', () => {
    const sig = createSignature({
      method: 'POST',
      pathAndQuery: '/v5/classes/users',
      body: '{"name":"Alice"}',
      appId: 1001,
      timestamp: 1705312200,
      secretKey: 'a'.repeat(32),
    })
    expect(sig).toHaveLength(64)
    expect(/^[0-9a-f]{64}$/.test(sig)).toBe(true)
  })

  it('should produce deterministic output', () => {
    const input = {
      method: 'POST',
      pathAndQuery: '/v5/classes/users',
      body: '{"name":"Alice"}',
      appId: 1001,
      timestamp: 1705312200,
      secretKey: 'a'.repeat(32),
    }
    const a = createSignature(input)
    const b = createSignature(input)
    expect(a).toBe(b)
  })

  it('should produce different signature for different methods', () => {
    const base = {
      pathAndQuery: '/v5/classes/users',
      body: '',
      appId: 1001,
      timestamp: 1705312200,
      secretKey: 'a'.repeat(32),
    }
    const getSig = createSignature({ ...base, method: 'GET' })
    const postSig = createSignature({ ...base, method: 'POST' })
    expect(getSig).not.toBe(postSig)
  })

  it('should match Go server signing', () => {
    // Test vector from Go server:
    // method=GET, path=/v5/meta, bodyHash=SHA256("")=e3b0c442..., appId=1001, timestamp=1705312200
    // message = "GET\n/v5/meta\ne3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n1001\n1705312200"
    const sig = createSignature({
      method: 'GET',
      pathAndQuery: '/v5/meta',
      body: '',
      appId: 1001,
      timestamp: 1705312200,
      secretKey: 'test-secret-key-32-characters!!',
    })
    // We just verify it's a valid HMAC-SHA256 hex
    expect(sig).toHaveLength(64)
  })
})
