/**
 * Browser entry point for the t1yOS SDK.
 *
 * This is the entry point used for the IIFE/UMD bundle (script tag usage).
 * It re-exports everything from the main entry and also sets up the global `T1Y` namespace.
 *
 * Usage via script tag:
 * ```html
 * <script src="https://unpkg.com/t1y-sdk-js/dist/umd/t1y.min.js"></script>
 * <script>
 *   const client = new T1Y.T1YOS({ appId: 1001, apiKey: '...', secretKey: '...' })
 *   await client.init()
 *   await client.db.collection('users').insertOne({ name: 'Alice' })
 * </script>
 * ```
 */

// Re-export everything from the main entry for bundling
export {
  T1YOS,
  T1Collection,
  // Special types
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
  // Crypto
  sha256Hex,
  sha256HexAsync,
  hmacSHA256Hex,
  hmacSHA256HexAsync,
  verifyHmacSHA256,
  encryptAESGCM,
  decryptAESGCM,
  createSignature,
  getSafeTimestamp,
  // Utils
  formatTimestampsToLocal,
  convertDateTypes,
  validateInitConfig,
  validateAppId,
  validateApiKey,
  validateSecretKey,
  assertObjectID,
  isNonEmptyObject,
  isPlainObject,
  isNonEmptyArrayWithNonEmptyObjects,
  // Errors
  T1YError,
  ValidationError,
} from './index'

// Default export
export { default } from './client/T1YOS'

// When loaded via script tag, esbuild's IIFE format with globalName: 'T1Y'
// will auto-attach all exports to globalThis.T1Y.
