/**
 * Core HTTP request execution for the t1yOS SDK.
 *
 * Handles:
 * - URL construction (baseUrl + path + query params for GET)
 * - Date type conversion in params
 * - AES-256-GCM encryption (safe mode)
 * - Request signing (HMAC-SHA256)
 * - Auth header injection
 * - Platform-agnostic request execution (via platform adapters)
 * - Response processing (decryption, timestamp formatting)
 */

import { encryptAESGCM } from '../crypto/aes'
import { createSignature, getSafeTimestamp } from '../crypto/sign'
import { convertDateTypes } from '../utils/convert'
import { appendQueryParams, normalizeBaseUrl } from '../utils/url'
import { REQUEST_TIMEOUT_MS } from '../constants'
import { handleResponse, handleFetchError } from './response'
import { getPlatformRequest } from '../platform/dispatcher'
import type { T1YOSInternalConfig, HttpMethod, ApiResponse } from '../types'

/**
 * Options for a single HTTP request.
 */
export interface RequestOptions {
  /** HTTP method */
  method: HttpMethod
  /** API path (e.g., /v5/classes/users) */
  path: string
  /** Request parameters/body */
  params?: unknown
  /** Override encryption for this request (defaults to client.isSafeMode) */
  encryption?: boolean
  /** Request timeout in milliseconds (default: 5 minutes) */
  timeout?: number
}

/**
 * Execute an HTTP request to the t1yOS API with full auth and encryption handling.
 *
 * This function is platform-agnostic. It builds the request (URL, headers, body,
 * encryption, signing) and then delegates the actual HTTP call to a platform-specific
 * adapter that works in Web, Node.js, WeChat/QQ/Alipay/Toutiao/Douyin Mini Programs,
 * and Quick App.
 *
 * @param client - Internal client configuration
 * @param options - Request options
 * @returns The processed API response
 */
export async function executeRequest<T = unknown>(
  client: T1YOSInternalConfig,
  options: RequestOptions
): Promise<ApiResponse<T>> {
  const { method, path, params, encryption, timeout } = options

  // Normalize base URL
  const baseUrl = normalizeBaseUrl(client.baseUrl)
  const isSafeMode = encryption ?? client.isSafeMode

  // Build URL
  const fullUrl = new URL(baseUrl + path)

  // Convert Date types in params
  const convertedParams = convertDateTypes(params)

  // Handle request body
  let bodyForRequest: string | undefined
  let rawBodyString = ''

  if (method !== 'GET') {
    // For non-GET requests, the body is the params
    if (isSafeMode && convertedParams !== undefined) {
      // Safe mode: encrypt the JSON body
      const encryptedBody = await encryptAESGCM(
        JSON.stringify(convertedParams),
        new TextEncoder().encode(client.secretKey)
      )
      bodyForRequest = encryptedBody
      rawBodyString = encryptedBody
    } else if (convertedParams !== undefined) {
      const jsonBody = JSON.stringify(convertedParams)
      bodyForRequest = jsonBody
      rawBodyString = jsonBody
    } else {
      rawBodyString = ''
    }
  } else if (
    convertedParams &&
    typeof convertedParams === 'object' &&
    Object.keys(convertedParams as object).length > 0
  ) {
    // For GET requests, append params as query string
    appendQueryParams(fullUrl, convertedParams as Record<string, unknown>)
  }

  // Compute timestamp with offset
  const timestamp = Number(getSafeTimestamp(client.offset))

  // Get the path + query for signing
  const originalURL = fullUrl.pathname + fullUrl.search

  // Create the HMAC-SHA256 signature
  const sign = createSignature({
    method,
    pathAndQuery: originalURL,
    body: rawBodyString,
    appId: client.appId,
    timestamp,
    secretKey: client.secretKey,
  })

  // Use the platform-specific request adapter
  const platformRequest = getPlatformRequest()
  const timeoutMs = timeout ?? REQUEST_TIMEOUT_MS

  try {
    const response = await platformRequest({
      url: fullUrl.toString(),
      method,
      headers: {
        'X-T1Y-Application-ID': String(client.appId),
        'X-T1Y-API-Key': client.apiKey,
        'X-T1Y-Safe-Timestamp': String(timestamp),
        'X-T1Y-Safe-Sign': sign,
        'Content-Type': 'application/json',
      },
      body: method !== 'GET' ? bodyForRequest : undefined,
      timeout: timeoutMs,
    })

    return await handleResponse<T>(response, isSafeMode, client.secretKey, client.timeFormat)
  } catch (error) {
    return handleFetchError(error)
  }
}
