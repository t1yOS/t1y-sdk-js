/**
 * Request signing algorithm for T1Y v5 RESTful API authentication.
 *
 * Implements the same signing logic as the Go server's middleware/v5_auth.go:
 *
 *   message   = METHOD + "\n" + URL_PATH_AND_QUERY + "\n" + SHA256(body) + "\n" + appId + "\n" + timestamp
 *   signature = HMAC-SHA256(secretKey, message)
 */

import { sha256Hex } from './sha256'
import { hmacSHA256Hex } from './hmac'

/**
 * Parameters for creating a request signature.
 */
export interface SignatureInput {
  /** HTTP method in uppercase (GET, POST, PUT, DELETE) */
  method: string
  /** URL path including query string, e.g. /v5/classes/users?field=name */
  pathAndQuery: string
  /** Request body as a raw string (empty string for GET requests) */
  body: string
  /** Application ID */
  appId: number
  /** 10-digit Unix timestamp (UTC + offset) */
  timestamp: number
  /** 32-character Secret Key */
  secretKey: string
}

/**
 * Create an HMAC-SHA256 signature for a T1Y API request.
 *
 * The message format is (each line separated by \n):
 *   1. HTTP method (uppercase)
 *   2. URL path + query string
 *   3. SHA-256 hex digest of the request body
 *   4. Application ID (as string)
 *   5. Unix timestamp (as string)
 *
 * @param input - Signature parameters
 * @returns 64-character hex-encoded HMAC-SHA256 signature
 *
 * @example
 * ```ts
 * const sign = createSignature({
 *   method: 'POST',
 *   pathAndQuery: '/v5/classes/users',
 *   body: '{"name":"Alice"}',
 *   appId: 1001,
 *   timestamp: 1705312200,
 *   secretKey: '17b784e359c946ffa65eebbf9ce29752',
 * })
 * // Set as X-T1Y-Safe-Sign header
 * ```
 */
export function createSignature(input: SignatureInput): string {
  const { method, pathAndQuery, body, appId, timestamp, secretKey } = input

  const bodyHash = sha256Hex(body)

  const message = [
    method.toUpperCase(),
    pathAndQuery,
    bodyHash,
    String(appId),
    String(timestamp),
  ].join('\n')

  return hmacSHA256Hex(secretKey, message)
}

/**
 * Get the current UTC Unix timestamp adjusted by the given offset.
 *
 * @param offset - Time offset in seconds (from server init)
 * @returns 10-digit Unix timestamp string
 */
export function getSafeTimestamp(offset: number): string {
  return String(Math.floor(Date.now() / 1000) + offset)
}
