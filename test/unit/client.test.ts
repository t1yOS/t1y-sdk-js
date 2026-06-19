/**
 * Unit tests for T1YOS client class (constructor, init, request format).
 * Uses mocked fetch for controlled testing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { T1YOS } from '../../src/client/T1YOS'
import { T1Collection } from '../../src/client/T1Collection'
import { ValidationError } from '../../src/utils/errors'

describe('T1YOS constructor', () => {
  const validConfig = {
    appId: 1001,
    apiKey: 'a'.repeat(32),
    secretKey: 'b'.repeat(32),
  }

  it('should create a client with valid config', () => {
    const client = new T1YOS(validConfig)
    expect(client).toBeInstanceOf(T1YOS)
  })

  it('should set defaults for optional params', () => {
    const client = new T1YOS(validConfig)
    // @ts-expect-error accessing private for test
    expect(client.config.baseUrl).toBe('https://myapp.t1y.net')
    // @ts-expect-error accessing private for test
    expect(client.config.version).toBe(0)
    // @ts-expect-error accessing private for test
    expect(client.config.isSafeMode).toBe(false)
    // @ts-expect-error accessing private for test
    expect(client.config.timeFormat).toBe('YYYY-MM-DD HH:mm:ss')
    // @ts-expect-error accessing private for test
    expect(client.config.offset).toBe(0)
  })

  it('should respect custom config values', () => {
    const client = new T1YOS({
      ...validConfig,
      baseUrl: 'https://custom.example.com',
      version: 5,
      timeFormat: 'DD/MM/YYYY',
    })
    // @ts-expect-error accessing private for test
    expect(client.config.baseUrl).toBe('https://custom.example.com')
    // @ts-expect-error accessing private for test
    expect(client.config.version).toBe(5)
    // @ts-expect-error accessing private for test
    expect(client.config.timeFormat).toBe('DD/MM/YYYY')
  })

  it('should throw for invalid appId', () => {
    expect(() => new T1YOS({ ...validConfig, appId: 500 })).toThrow(ValidationError)
  })

  it('should throw for invalid apiKey length', () => {
    expect(() => new T1YOS({ ...validConfig, apiKey: 'short' })).toThrow(ValidationError)
  })

  it('should throw for invalid secretKey length', () => {
    expect(() => new T1YOS({ ...validConfig, secretKey: 'short' })).toThrow(ValidationError)
  })

  it('should expose db accessor', () => {
    const client = new T1YOS(validConfig)
    expect(client.db).toBeDefined()
    expect(typeof client.db.collection).toBe('function')
    expect(typeof client.db.toObjectID).toBe('function')
  })

  it('should create collection via db.collection()', () => {
    const client = new T1YOS(validConfig)
    const coll = client.db.collection('users')
    expect(coll).toBeInstanceOf(T1Collection)
  })

  it('should create ObjectID marker via db.toObjectID()', () => {
    const client = new T1YOS(validConfig)
    const result = client.db.toObjectID('507f1f77bcf86cd799439011')
    expect(result).toBe("ObjectID('507f1f77bcf86cd799439011')")
  })
})

describe('T1YOS init', () => {
  const validConfig = {
    appId: 1001,
    apiKey: 'a'.repeat(32),
    secretKey: 'b'.repeat(32),
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should sync offset and isSafeMode from server', async () => {
    const mockResponse = {
      code: 200,
      message: 'ok',
      data: {
        unix: Math.floor(Date.now() / 1000) + 5,
        is_safe_mode: true,
      },
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    })

    const client = new T1YOS(validConfig)
    await client.init()

    // @ts-expect-error accessing private for test
    expect(client.config.isSafeMode).toBe(true)
    // @ts-expect-error accessing private for test
    expect(client.config.offset).toBeGreaterThanOrEqual(0)
  })

  it('should handle server returning 404 gracefully (app not found)', async () => {
    const mockResponse = {
      code: 404,
      message: '资源不存在',
      data: null,
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    })

    const client = new T1YOS(validConfig)
    // Should not throw — graceful degradation sets defaults
    await client.init()
    // @ts-expect-error accessing private for test
    expect(client.config.isSafeMode).toBe(false)
    // @ts-expect-error accessing private for test
    expect(client.config.offset).toBe(0)
  })
})

describe('T1YOS utility methods', () => {
  const validConfig = {
    appId: 1001,
    apiKey: 'a'.repeat(32),
    secretKey: 'b'.repeat(32),
  }

  it('assertObjectID should validate ObjectIDs', () => {
    const client = new T1YOS(validConfig)
    expect(client.assertObjectID('507f1f77bcf86cd799439011')).toBe(true)
    expect(() => client.assertObjectID('invalid')).toThrow(ValidationError)
  })

  it('isNonEmptyObject should work correctly', () => {
    const client = new T1YOS(validConfig)
    expect(client.isNonEmptyObject({ a: 1 })).toBe(true)
    expect(client.isNonEmptyObject({})).toBe(false)
    expect(client.isNonEmptyObject(null)).toBe(false)
  })

  it('hmacSHA256 should produce hex string', () => {
    const client = new T1YOS(validConfig)
    const result = client.hmacSHA256('message', 'secret')
    expect(result).toHaveLength(64)
  })

  it('verifyHmacSHA256 should verify signatures', () => {
    const client = new T1YOS(validConfig)
    const sig = client.hmacSHA256('message', 'secret')
    expect(client.verifyHmacSHA256('message', 'secret', sig)).toBe(true)
    expect(client.verifyHmacSHA256('message', 'secret', 'wrong')).toBe(false)
  })
})

describe('T1YOS request signing format', () => {
  const validConfig = {
    appId: 1001,
    apiKey: 'a'.repeat(32),
    secretKey: 'b'.repeat(32),
  }

  it('should include all required auth headers', async () => {
    const mockResponse = {
      code: 200,
      message: 'ok',
      data: { result: { name: 'Alice' } },
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    })

    const client = new T1YOS(validConfig)
    await client.request('GET', '/v5/meta')

    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const fetchUrl = fetchCall[0]
    const fetchOptions = fetchCall[1]

    expect(fetchOptions.method).toBe('GET')
    expect(fetchOptions.headers['X-T1Y-Application-ID']).toBe('1001')
    expect(fetchOptions.headers['X-T1Y-API-Key']).toBe('a'.repeat(32))
    expect(fetchOptions.headers['X-T1Y-Safe-Timestamp']).toBeDefined()
    expect(fetchOptions.headers['X-T1Y-Safe-Sign']).toHaveLength(64)
  })
})
