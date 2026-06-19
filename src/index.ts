/**
 * t1yOS Serverless Platform JavaScript/TypeScript SDK
 *
 * @packageDocumentation
 *
 * @example
 * ```ts
 * import { T1YOS, ObjectID, timeNow } from 't1y-sdk-js'
 *
 * const client = new T1YOS({
 *   appId: 1001,
 *   apiKey: 'your-api-key-32-characters-here!',
 *   secretKey: 'your-secret-key-32-characters!',
 * })
 *
 * await client.init()
 *
 * // Database operations
 * await client.db.collection('users').insertOne({
 *   name: 'Alice',
 *   age: 25,
 *   createdAt: timeNow.Now(),
 * })
 *
 * const { data } = await client.db.collection('users').findOne({ name: 'Alice' })
 * console.log(data.result)
 * ```
 */

// Main client classes
export { T1YOS } from './client/T1YOS'
export { T1Collection } from './client/T1Collection'

// Special type helpers
export {
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
  TimeNow,
  TimeNowUnix,
  TimeNowUnixNano,
  TimeNowWeekday,
  TimeNowWeekdayChinese,
  timeNow,
} from './special-types'

// Cryptographic utilities (for advanced use)
export {
  sha256Hex,
  sha256HexAsync,
  hmacSHA256Hex,
  hmacSHA256HexAsync,
  verifyHmacSHA256,
  encryptAESGCM,
  decryptAESGCM,
  createSignature,
  getSafeTimestamp,
} from './crypto'

// Utility functions
export {
  formatTimestampsToLocal,
  convertDateTypes,
  validateInitConfig,
  validateAppId,
  validateApiKey,
  validateSecretKey,
  validateBaseUrl,
  assertObjectID,
  isNonEmptyObject,
  isPlainObject,
  isNonEmptyArrayWithNonEmptyObjects,
} from './utils'

// Custom error classes
export { T1YError, ValidationError } from './utils/errors'

// Core types
export type {
  T1YOSConfig,
  T1YOSInternalConfig,
  HttpMethod,
  ApiResponse,
  InsertResult,
  InsertManyResult,
  DeleteResult,
  DeleteManyResult,
  UpdateResult,
  UpdateManyResult,
  FindResult,
  Pagination,
  PaginationResult,
  AggregateResult,
  InitResult,
} from './types'

export type { AESGCMPayload, SignatureInput } from './crypto'

// Special type marker types
export type {
  ObjectIDMarker,
  DateMarker,
  DateTimeMarker,
  TimestampMarker,
  BooleanMarker,
  IntegerMarker,
  BigintMarker,
  FloatMarker,
  DoubleMarker,
  ArrayMarker,
  MapMarker,
  MapArrayMarker,
  NullMarker,
  UndefinedMarker,
  TimeNowMarker,
  TimeNowUnixMarker,
  TimeNowUnixNanoMarker,
  TimeNowWeekdayMarker,
  TimeNowWeekdayChineseMarker,
  SpecialTypeMarker,
} from './types/special-types'

// Default export
export { default } from './client/T1YOS'
