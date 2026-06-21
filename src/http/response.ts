/**
 * Response handling — decryption, timestamp formatting, and error wrapping.
 *
 * Works with platform-agnostic `PlatformResponse` objects instead of the
 * browser-native `Response` type, enabling cross-platform support.
 */

import { decryptAESGCM } from '../crypto/aes'
import { formatTimestampsToLocal } from '../utils/time'
import { T1YError } from '../utils/errors'
import type { ApiResponse } from '../types/api'
import type { PlatformResponse } from '../platform/types'

/**
 * Process a platform response into the SDK's standard ApiResponse format.
 *
 * Handles:
 * 1. JSON parsing or string fallback
 * 2. Safe mode AES-GCM decryption (response data has `j` field)
 * 3. Timestamp formatting (createdAt/updatedAt → local time)
 * 4. Error wrapping for non-2xx status codes
 *
 * @param response - Platform-agnostic response object
 * @param isSafeMode - Whether safe mode encryption is active
 * @param secretKey - Secret key for decryption (as raw string)
 * @param timeFormat - Time format for createdAt/updatedAt fields
 * @returns Processed ApiResponse
 */
export async function handleResponse<T = unknown>(
  response: PlatformResponse,
  isSafeMode: boolean,
  secretKey: string,
  timeFormat: string
): Promise<ApiResponse<T>> {
  // Determine content type from response headers
  const contentType = response.headers['content-type'] || ''

  // Try to parse response body
  let rawData: unknown
  const responseText = response.body

  if (contentType.includes('application/json')) {
    try {
      rawData = JSON.parse(responseText)
    } catch {
      rawData = responseText
    }
  } else {
    rawData = responseText
  }

  // If safe mode is on and the response data looks encrypted (has `j` field),
  // decrypt it first
  if (
    isSafeMode &&
    rawData &&
    typeof rawData === 'object' &&
    'j' in (rawData as Record<string, unknown>)
  ) {
    try {
      const decrypted = await decryptAESGCM(
        JSON.stringify(rawData),
        new TextEncoder().encode(secretKey)
      )

      // Try to parse decrypted result as JSON
      try {
        rawData = JSON.parse(decrypted)
      } catch {
        rawData = decrypted
      }
    } catch (err) {
      throw new T1YError(
        400,
        'AES-256-GCM decryption failed',
        err instanceof Error ? err.message : null
      )
    }
  }

  const isOk = response.status >= 200 && response.status < 300

  // If the response is a standard ApiResponse wrapper, format timestamps
  if (rawData && typeof rawData === 'object' && 'data' in (rawData as Record<string, unknown>)) {
    const apiResp = rawData as ApiResponse<T>
    apiResp.data = formatTimestampsToLocal(apiResp.data, timeFormat) as T

    // If the status code is not 2xx, throw a T1YError
    if (!isOk) {
      throw new T1YError(
        apiResp.code || response.status,
        apiResp.message || response.statusText,
        apiResp.data
      )
    }

    return apiResp
  }

  // Handle non-standard responses
  if (!isOk) {
    throw new T1YError(response.status, response.statusText, rawData)
  }

  // Raw success response — wrap in ApiResponse shape
  return {
    code: 0,
    message: 'ok',
    data: formatTimestampsToLocal(rawData, timeFormat) as T,
  }
}

/**
 * Handle request errors (network errors, timeouts, etc.) from any platform.
 */
export function handleFetchError(error: unknown): never {
  // Re-throw as T1YError if it's not already
  if (error instanceof T1YError) {
    throw error
  }

  if (error instanceof Error) {
    // Network error / timeout
    const message = error.message || 'Unknown error'
    if (
      message.includes('timeout') ||
      message.includes('超时') ||
      error.name === 'AbortError' ||
      message.includes('abort')
    ) {
      throw new T1YError(408, 'Request timeout', null)
    }
    throw new T1YError(0, message, null)
  }

  throw new T1YError(0, 'Unknown error', error)
}
