/**
 * Unit tests for special type helper functions.
 * These helpers create marker strings that the Go server recognizes.
 */
import { describe, it, expect } from 'vitest'
import {
  ObjectID,
  Date,
  DateTime,
  Timestamp,
  Boolean,
  Integer,
  Bigint,
  Float,
  Double,
  Array,
  Map,
  MapArray,
  Null,
  None,
  Nil,
  Empty,
  UNDEFINED,
  Undefined,
  timeNow,
} from '../../src/special-types'

describe('ObjectID', () => {
  it('should create a valid ObjectID marker', () => {
    const result = ObjectID('507f1f77bcf86cd799439011')
    expect(result).toBe("ObjectID('507f1f77bcf86cd799439011')")
  })

  it('should throw on invalid hex', () => {
    expect(() => ObjectID('not-a-valid-object-id')).toThrow()
    expect(() => ObjectID('too-short')).toThrow()
  })

  it('should be case-insensitive for hex', () => {
    const result = ObjectID('ABCDEF0123456789ABCDEF01')
    expect(result).toBe("ObjectID('ABCDEF0123456789ABCDEF01')")
  })
})

describe('Date helpers', () => {
  it('Date() should create a Date marker', () => {
    const result = Date('2024-01-15T10:30:00Z')
    expect(result).toBe("Date('2024-01-15T10:30:00Z')")
  })

  it('DateTime() should create a DateTime marker', () => {
    const result = DateTime('2024-01-15T10:30:00Z')
    expect(result).toBe("DateTime('2024-01-15T10:30:00Z')")
  })

  it('Timestamp() should create a Timestamp marker', () => {
    const result = Timestamp(1705312200)
    expect(result).toBe("Timestamp('1705312200')")
  })

  it('Timestamp() should accept string input', () => {
    const result = Timestamp('1705312200')
    expect(result).toBe("Timestamp('1705312200')")
  })
})

describe('Numeric helpers', () => {
  it('Boolean() should create a Boolean marker', () => {
    expect(Boolean(true)).toBe('Boolean(true)')
    expect(Boolean(false)).toBe('Boolean(false)')
  })

  it('Integer() should create an Integer marker', () => {
    expect(Integer(42)).toBe('Integer(42)')
    expect(Integer(-10)).toBe('Integer(-10)')
  })

  it('Bigint() should create a Bigint marker', () => {
    expect(Bigint(9007199254740991)).toBe('Bigint(9007199254740991)')
  })

  it('Float() should create a Float marker', () => {
    expect(Float(3.14)).toBe('Float(3.14)')
  })

  it('Double() should create a Double marker', () => {
    expect(Double(3.141592653589793)).toBe('Double(3.141592653589793)')
  })
})

describe('Structured helpers', () => {
  it('Array() should create an Array marker', () => {
    const result = Array([1, 2, 3])
    expect(result).toBe('Array([1,2,3])')
  })

  it('Map() should create a Map marker', () => {
    const result = Map({ key: 'value' })
    expect(result).toBe('Map({"key":"value"})')
  })

  it('MapArray() should create a Map[] marker', () => {
    const result = MapArray([{ a: 1 }, { b: 2 }])
    expect(result).toBe('Map[]([{"a":1},{"b":2}])')
  })
})

describe('Null helpers', () => {
  it('should have expected constant values', () => {
    expect(Null).toBe('Null')
    expect(None).toBe('None')
    expect(Nil).toBe('Nil')
    expect(Empty).toBe('')
    expect(UNDEFINED).toBe('UNDEFINED')
    expect(Undefined).toBe('Undefined')
  })
})

describe('timeNow helpers', () => {
  it('should return expected marker strings', () => {
    expect(timeNow.Now()).toBe('time.Now()')
    expect(timeNow.NowUnix()).toBe('time.Now().Unix()')
    expect(timeNow.NowUnixNano()).toBe('time.Now().UnixNano()')
    expect(timeNow.NowWeekday()).toBe('time.Now().Weekday()')
    expect(timeNow.NowWeekdayChinese()).toBe('time.Now().Weekday().Chinese()')
  })
})
