/**
 * Unit tests for validators and utility functions.
 */
import { describe, it, expect } from 'vitest'
import {
  validateAppId,
  validateApiKey,
  validateSecretKey,
  validateBaseUrl,
  validateInitConfig,
  assertObjectID,
} from '../../src/utils/validators'
import {
  convertDateTypes,
  isNonEmptyObject,
  isPlainObject,
  isNonEmptyArrayWithNonEmptyObjects,
} from '../../src/utils/convert'
import { normalizeBaseUrl, buildQueryString, getPathAndQuery } from '../../src/utils/url'
import { formatTimestampsToLocal } from '../../src/utils/time'
import { T1YError, ValidationError } from '../../src/utils/errors'

// ==================== Validators ====================

describe('validateAppId', () => {
  it('should accept valid appId', () => {
    expect(() => validateAppId(1001)).not.toThrow()
    expect(() => validateAppId(9999)).not.toThrow()
  })

  it('should reject non-integer', () => {
    expect(() => validateAppId(1001.5)).toThrow(ValidationError)
    expect(() => validateAppId(NaN)).toThrow()
  })

  it('should reject appId < 1001', () => {
    expect(() => validateAppId(1000)).toThrow(ValidationError)
    expect(() => validateAppId(0)).toThrow()
    expect(() => validateAppId(-1)).toThrow()
  })
})

describe('validateApiKey', () => {
  it('should accept 32-char string', () => {
    expect(() => validateApiKey('a'.repeat(32))).not.toThrow()
  })

  it('should reject wrong length', () => {
    expect(() => validateApiKey('a'.repeat(31))).toThrow(ValidationError)
    expect(() => validateApiKey('a'.repeat(33))).toThrow(ValidationError)
    expect(() => validateApiKey('')).toThrow()
  })
})

describe('validateSecretKey', () => {
  it('should accept 32-char string', () => {
    expect(() => validateSecretKey('a'.repeat(32))).not.toThrow()
  })

  it('should reject wrong length', () => {
    expect(() => validateSecretKey('a'.repeat(16))).toThrow(ValidationError)
  })
})

describe('validateBaseUrl', () => {
  it('should accept http and https URLs', () => {
    expect(() => validateBaseUrl('https://myapp.t1y.net')).not.toThrow()
    expect(() => validateBaseUrl('http://localhost:8082')).not.toThrow()
  })

  it('should reject URLs without protocol', () => {
    expect(() => validateBaseUrl('myapp.t1y.net')).toThrow(ValidationError)
    expect(() => validateBaseUrl('//myapp.t1y.net')).toThrow()
  })
})

describe('validateInitConfig', () => {
  const validConfig = {
    appId: 1001,
    apiKey: 'a'.repeat(32),
    secretKey: 'b'.repeat(32),
  }

  it('should accept valid config', () => {
    expect(() => validateInitConfig(validConfig)).not.toThrow()
  })

  it('should accept valid config with optional fields', () => {
    expect(() =>
      validateInitConfig({ ...validConfig, baseUrl: 'https://example.com', version: 1 })
    ).not.toThrow()
  })

  it('should reject invalid version', () => {
    expect(() => validateInitConfig({ ...validConfig, version: -1 })).toThrow(ValidationError)
  })
})

describe('assertObjectID', () => {
  it('should accept valid 24-char hex string', () => {
    expect(assertObjectID('507f1f77bcf86cd799439011')).toBe(true)
    expect(assertObjectID('abcdef0123456789abcdef01')).toBe(true)
  })

  it('should reject invalid strings', () => {
    expect(() => assertObjectID('too-short')).toThrow(ValidationError)
    expect(() => assertObjectID('gggggggggggggggggggggggg')).toThrow()
    expect(() => assertObjectID('')).toThrow()
  })
})

// ==================== Convert ====================

describe('convertDateTypes', () => {
  it('should convert Date objects to Date markers', () => {
    const date = new Date('2024-01-15T10:30:00Z')
    const result = convertDateTypes({ createdAt: date })
    expect(result).toEqual({ createdAt: "Date('2024-01-15T10:30:00.000Z')" })
  })

  it('should convert 10+ digit numbers to Timestamp markers', () => {
    const result = convertDateTypes({ ts: 1705312200 })
    expect(result).toEqual({ ts: "Timestamp('1705312200')" })
  })

  it('should leave regular numbers unchanged', () => {
    const result = convertDateTypes({ age: 25, price: 9.99 })
    expect(result).toEqual({ age: 25, price: 9.99 })
  })

  it('should recursively convert nested objects', () => {
    const result = convertDateTypes({
      user: { createdAt: new Date('2024-01-15T10:30:00Z') },
    })
    expect(result).toEqual({
      user: { createdAt: "Date('2024-01-15T10:30:00.000Z')" },
    })
  })

  it('should handle arrays', () => {
    const result = convertDateTypes([new Date('2024-01-15T10:30:00Z'), 25])
    expect(result).toEqual(["Date('2024-01-15T10:30:00.000Z')", 25])
  })

  it('should handle null and primitives', () => {
    expect(convertDateTypes(null)).toBeNull()
    expect(convertDateTypes('hello')).toBe('hello')
    expect(convertDateTypes(42)).toBe(42)
  })
})

describe('isNonEmptyObject', () => {
  it('should return true for non-empty objects', () => {
    expect(isNonEmptyObject({ a: 1 })).toBe(true)
  })

  it('should return false for empty objects', () => {
    expect(isNonEmptyObject({})).toBe(false)
  })

  it('should return false for null', () => {
    expect(isNonEmptyObject(null)).toBe(false)
  })

  it('should return false for arrays', () => {
    expect(isNonEmptyObject([1, 2, 3])).toBe(false)
  })
})

describe('isNonEmptyArrayWithNonEmptyObjects', () => {
  it('should return true for valid array', () => {
    expect(isNonEmptyArrayWithNonEmptyObjects([{ a: 1 }, { b: 2 }])).toBe(true)
  })

  it('should return false for empty array', () => {
    expect(isNonEmptyArrayWithNonEmptyObjects([])).toBe(false)
  })

  it('should return false for array with empty objects', () => {
    expect(isNonEmptyArrayWithNonEmptyObjects([{}])).toBe(false)
  })

  it('should return false for non-array', () => {
    expect(isNonEmptyArrayWithNonEmptyObjects({ a: 1 })).toBe(false)
  })
})

// ==================== URL ====================

describe('normalizeBaseUrl', () => {
  it('should strip trailing slashes', () => {
    expect(normalizeBaseUrl('https://example.com/')).toBe('https://example.com')
    expect(normalizeBaseUrl('https://example.com///')).toBe('https://example.com')
  })

  it('should leave clean URLs unchanged', () => {
    expect(normalizeBaseUrl('https://example.com')).toBe('https://example.com')
  })
})

describe('buildQueryString', () => {
  it('should build query string from params', () => {
    const qs = buildQueryString({ name: 'Alice', age: 25 })
    expect(qs).toContain('name=Alice')
    expect(qs).toContain('age=25')
    expect(qs).toMatch(/^\?/)
  })

  it('should skip null/undefined values', () => {
    const qs = buildQueryString({ name: 'Alice', skip: null, also: undefined })
    expect(qs).toContain('name=Alice')
    expect(qs).not.toContain('skip')
    expect(qs).not.toContain('also')
  })

  it('should JSON-stringify non-string values', () => {
    const qs = buildQueryString({ obj: { a: 1 } })
    expect(qs).toContain(encodeURIComponent('{"a":1}'))
  })

  it('should return empty string for empty object', () => {
    const qs = buildQueryString({})
    expect(qs).toBe('')
  })
})

describe('getPathAndQuery', () => {
  it('should extract path and query from full URL', () => {
    expect(getPathAndQuery('https://example.com/v5/classes/users')).toBe('/v5/classes/users')
    expect(getPathAndQuery('https://example.com/v5/classes/users?name=Alice')).toBe(
      '/v5/classes/users?name=Alice'
    )
  })

  it('should return / for root URL', () => {
    expect(getPathAndQuery('https://example.com')).toBe('/')
  })

  it('should return string unchanged for path-only inputs', () => {
    expect(getPathAndQuery('/v5/classes/users')).toBe('/v5/classes/users')
  })
})

// ==================== Time ====================

describe('formatTimestampsToLocal', () => {
  it('should format createdAt and updatedAt fields', () => {
    const data = {
      name: 'Alice',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T11:00:00.000Z',
    }
    const result = formatTimestampsToLocal(data, 'YYYY-MM-DD HH:mm:ss')
    expect(result).toHaveProperty('name', 'Alice')
    expect(typeof (result as Record<string, unknown>).createdAt).toBe('string')
    expect((result as Record<string, unknown>).createdAt).not.toBe('2024-01-15T10:30:00.000Z')
  })

  it('should handle arrays', () => {
    const data = [
      { name: 'Alice', createdAt: '2024-01-15T10:30:00.000Z' },
      { name: 'Bob', createdAt: '2024-01-15T11:00:00.000Z' },
    ]
    const result = formatTimestampsToLocal(data) as Record<string, unknown>[]
    expect(result).toHaveLength(2)
    expect(result[0]!.createdAt).not.toBe('2024-01-15T10:30:00.000Z')
  })

  it('should handle null/undefined', () => {
    expect(formatTimestampsToLocal(null)).toBeNull()
    expect(formatTimestampsToLocal(undefined)).toBeUndefined()
  })
})

// ==================== Errors ====================

describe('T1YError', () => {
  it('should create error with code and message', () => {
    const err = new T1YError(403, 'Forbidden')
    expect(err).toBeInstanceOf(Error)
    expect(err.code).toBe(403)
    expect(err.message).toBe('Forbidden')
    expect(err.name).toBe('T1YError')
  })

  it('should serialize to JSON', () => {
    const err = new T1YError(500, 'Server Error', { detail: 'crash' })
    const json = err.toJSON()
    expect(json).toEqual({
      name: 'T1YError',
      code: 500,
      message: 'Server Error',
      data: { detail: 'crash' },
    })
  })
})
