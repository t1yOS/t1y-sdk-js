/**
 * T1YOS — Main client class for the t1yOS Serverless Platform SDK.
 *
 * Provides:
 * - Initialization with server time sync
 * - Chainable database operations via `db.collection(name)`
 * - Cloud function invocation
 * - Metadata retrieval
 * - Cryptographic utilities
 */

import {
  DEFAULT_BASE_URL,
  DEFAULT_VERSION,
  DEFAULT_SAFE_MODE,
  DEFAULT_TIME_FORMAT,
  DEFAULT_OFFSET,
} from '../constants'
import { validateInitConfig, assertObjectID } from '../utils/validators'
import {
  isNonEmptyObject,
  isPlainObject,
  isNonEmptyArrayWithNonEmptyObjects,
} from '../utils/convert'
import { hmacSHA256Hex, verifyHmacSHA256 } from '../crypto'
import { executeRequest } from '../http'
import { T1Collection } from './T1Collection'
import type {
  T1YOSConfig,
  T1YOSInternalConfig,
  HttpMethod,
  ApiResponse,
  InitResult,
} from '../types'

/**
 * Main T1Y client class.
 *
 * @example
 * ```ts
 * import { T1YOS } from 't1y-sdk-js'
 *
 * const client = new T1YOS({
 *   appId: 1001,
 *   apiKey: '4fd7448cdc684431a62d8a0111dc6973',
 *   secretKey: '17b784e359c946ffa65eebbf9ce29752',
 * })
 *
 * await client.init()
 *
 * // Database operations
 * const { data } = await client.db.collection('users').insertOne({ name: 'Alice' })
 * ```
 */
export class T1YOS {
  private config: T1YOSInternalConfig

  /**
   * Database accessor providing chainable collection operations.
   *
   * @example
   * ```ts
   * await client.db.collection('users').insertOne({ name: 'Alice' })
   * await client.db.collection('users').findOne({ name: 'Alice' })
   * ```
   */
  readonly db: {
    collection: (name: string) => T1Collection
    toObjectID: (id: string) => string
    getCollections: () => Promise<ApiResponse<{ results: string[] }>>
  }

  /**
   * Create a new T1YOS client instance.
   *
   * @param config - Client configuration (appId, apiKey, secretKey are required)
   *
   * @throws {ValidationError} If required parameters are invalid
   */
  constructor(config: T1YOSConfig) {
    // Validate required parameters
    validateInitConfig(config)

    this.config = {
      baseUrl: config.baseUrl ?? DEFAULT_BASE_URL,
      appId: config.appId,
      apiKey: config.apiKey,
      secretKey: config.secretKey,
      version: config.version ?? DEFAULT_VERSION,
      isSafeMode: config.isSafeMode ?? DEFAULT_SAFE_MODE,
      timeFormat: config.timeFormat ?? DEFAULT_TIME_FORMAT,
      offset: config.offset ?? DEFAULT_OFFSET,
    }

    // Set up the chainable db accessor
    this.db = {
      collection: (name: string) => this.#collection(name),
      toObjectID: (id: string) => this.#toObjectID(id),
      getCollections: () => this.#getCollections(),
    }
  }

  /**
   * Initialize the SDK by syncing with the server.
   *
   * Calls `GET /init/:appId` to:
   * 1. Get the server's current UTC Unix timestamp
   * 2. Get the server's isSafeMode setting
   *
   * The time offset is computed as: `server.unix - client.unix`
   * This offset is used for all subsequent request signing to prevent clock skew issues.
   *
   * @throws {T1YError} If the server returns an error (e.g., app not found, app disabled)
   */
  async init(): Promise<void> {
    try {
      const res = await this.request<InitResult>(
        'GET',
        `/init/${this.config.appId}`,
        undefined,
        false
      )
      const data = res.data
      this.config.isSafeMode = data.is_safe_mode
      this.config.offset = data.unix - Math.floor(Date.now() / 1000)
    } catch (err) {
      console.warn('Failed to get time offset from server, defaulting to 0. Error:', err)
      this.config.isSafeMode = false
      this.config.offset = 0
    }
  }

  // ==================== Public API ====================

  /**
   * Get application metadata.
   *
   * @param field - Optional field name to retrieve a specific metadata field
   * @returns Metadata as key-value pairs, or a single field value if `field` is specified
   *
   * @example
   * ```ts
   * // Get all metadata
   * const { data } = await client.getMeta()
   * // data.results = { version: 1, collections: [...] }
   *
   * // Get a specific field
   * const { data } = await client.getMeta('version')
   * // data.result = 1
   * ```
   */
  async getMeta(field?: string): Promise<ApiResponse> {
    if (field !== undefined && field !== '' && typeof field !== 'string') {
      throw new TypeError('Meta field must be a string')
    }
    const queryPath = field ? `?field=${encodeURIComponent(field)}` : ''
    return await this.request('GET', `/v5/meta${queryPath}`)
  }

  /**
   * Check if there's a newer version of the application available.
   *
   * Compares the server's `version` metadata field against the configured `version`.
   *
   * @returns `true` if the server version is greater than the client version
   */
  async checkUpdate(): Promise<boolean> {
    try {
      const res = await this.request<{ result: number }>('GET', '/v5/meta?field=version')
      return res.data.result > this.config.version
    } catch {
      return false
    }
  }

  /**
   * Call a cloud function (`.jsc` file).
   *
   * If `name` doesn't end with `.jsc`, it's auto-appended.
   * If `name` ends with `/`, `index.jsc` is appended.
   * If `name` ends with `.js`, it's replaced with `.jsc`.
   *
   * @param name - Function name or path (e.g., 'hello' or 'hello.jsc')
   * @param params - Parameters to pass to the function
   * @param enableSafeMode - Override safe mode for this call (defaults to client setting)
   *
   * @example
   * ```ts
   * const { data } = await client.callFunc('hello', { name: 'World' })
   * ```
   */
  async callFunc(
    name: string,
    params: unknown = null,
    enableSafeMode?: boolean
  ): Promise<ApiResponse> {
    if (typeof name !== 'string') {
      throw new TypeError('Function name must be a string')
    }
    return await this.request(
      'POST',
      `/${this.config.appId}/${this.#ensureJscExtension(name)}`,
      params,
      enableSafeMode
    )
  }

  /**
   * Core HTTP request method with full authentication and encryption.
   *
   * @param method - HTTP method (GET, POST, PUT, DELETE)
   * @param path - API path (e.g., /v5/classes/users)
   * @param params - Request parameters/body
   * @param encryption - Override encryption (defaults to client.isSafeMode)
   * @returns Typed API response
   *
   * @throws {T1YError} On API errors (non-2xx responses)
   * @throws {Error} On network errors or timeouts
   */
  async request<T = unknown>(
    method: HttpMethod,
    path: string,
    params?: unknown,
    encryption?: boolean
  ): Promise<ApiResponse<T>> {
    if (typeof path !== 'string') {
      throw new TypeError('request path must be a string')
    }

    return await executeRequest<T>(this.config, {
      method,
      path,
      params,
      encryption: encryption ?? this.config.isSafeMode,
    })
  }

  // ==================== Utilities ====================

  /**
   * Validate an ObjectID hex string.
   *
   * @param idStr - 24-character hex string to validate
   * @param name - Optional name for error messages (default: 'ObjectID')
   * @returns `true` if valid
   * @throws {ValidationError} If the string is not a valid ObjectID
   */
  assertObjectID(idStr: string, name = 'ObjectID'): boolean {
    return assertObjectID(idStr, name)
  }

  /** Check if a value is a non-null, non-array object with at least one key */
  isNonEmptyObject(value: unknown): boolean {
    return isNonEmptyObject(value)
  }

  /** Check if a value is a plain object (non-null, non-array) */
  isPlainObject(value: unknown): boolean {
    return isPlainObject(value)
  }

  /** Check if a value is a non-empty array where every element is a non-empty object */
  isNonEmptyArrayWithNonEmptyObjects(value: unknown): boolean {
    return isNonEmptyArrayWithNonEmptyObjects(value)
  }

  // ==================== Crypto ====================

  /**
   * Compute HMAC-SHA256 hash and return hex digest.
   *
   * @param message - The message to sign
   * @param secret - The secret key
   * @returns 64-character hex-encoded HMAC-SHA256
   */
  hmacSHA256(secret: string, message: string): string {
    return hmacSHA256Hex(secret, message)
  }

  /**
   * Verify an HMAC-SHA256 signature using constant-time comparison.
   *
   * @param secret - The secret key
   * @param message - The message that was signed
   * @param signature - The expected signature (hex string)
   * @returns `true` if the signature matches
   */
  verifyHmacSHA256(secret: string, message: string, signature: string): boolean {
    return verifyHmacSHA256(secret, message, signature)
  }

  // ==================== Private Helpers ====================

  /** Create a T1Collection for the given collection name */
  #collection(name: string): T1Collection {
    if (typeof name !== 'string') {
      throw new TypeError('Collection name must be a string')
    }
    return new T1Collection(this, name)
  }

  /** Get all collections in the application's database */
  async #getCollections(): Promise<ApiResponse<{ results: string[] }>> {
    return await this.request<{ results: string[] }>('GET', '/v5/schemas')
  }

  /** Convert a 24-char hex string to an ObjectID marker */
  #toObjectID(idStr: string): string {
    assertObjectID(idStr)
    return `ObjectID('${idStr}')`
  }

  /** Ensure a function name has the .jsc extension */
  #ensureJscExtension(input: string): string {
    let path = input.startsWith('/') ? input.slice(1) : input

    // Separate hash fragment
    const hashIndex = path.indexOf('#')
    const hash = hashIndex !== -1 ? path.slice(hashIndex) : ''
    const withoutHash = hashIndex !== -1 ? path.slice(0, hashIndex) : path

    // Separate query string
    const qIndex = withoutHash.indexOf('?')
    const query = qIndex !== -1 ? withoutHash.slice(qIndex) : ''
    let mainPath = qIndex !== -1 ? withoutHash.slice(0, qIndex) : withoutHash

    // Apply extension rules
    if (mainPath.endsWith('/')) {
      mainPath = mainPath + 'index.jsc'
    } else if (mainPath.endsWith('.jsc')) {
      // Already has .jsc
    } else if (mainPath.endsWith('.js')) {
      mainPath = mainPath.replace(/\.js$/, '.jsc')
    } else {
      mainPath = mainPath + '.jsc'
    }

    return mainPath + query + hash
  }
}

export default T1YOS
