/**
 * Fetch-based request adapter for Web (H5), Node.js, and React Native environments.
 *
 * Uses the standard `fetch` API (native in Node.js 18+, all modern browsers,
 * and React Native 0.70+). Implements timeout via AbortController.
 */

import type { PlatformRequestOptions, PlatformResponse, PlatformRequestFn } from '../types'

/** Default request timeout (5 minutes) */
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000

/**
 * Execute an HTTP request using the standard `fetch` API.
 *
 * Timeout is enforced via AbortController — after `timeout` milliseconds
 * the request is aborted. If an external `signal` is provided, its abort
 * is forwarded to the controller so both timeout and caller cancellation
 * are handled correctly.
 *
 * @param options - Standardized request options
 * @returns Standardized response object
 */
export const fetchRequest: PlatformRequestFn = async (
  options: PlatformRequestOptions
): Promise<PlatformResponse> => {
  const { url, method, headers, body, signal, timeout } = options

  // Create an AbortController for timeout enforcement.
  // We always create our own controller so we can combine the timeout
  // signal with any externally-provided signal.
  const controller = new AbortController()
  const timeoutMs = timeout ?? DEFAULT_TIMEOUT_MS
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  // If the caller provided an external signal, forward its abort to our
  // controller (and handle the case where it's already aborted).
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId)
      controller.abort()
    } else {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timeoutId)
          controller.abort()
        },
        { once: true }
      )
    }
  }

  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    }

    if (body !== undefined && method !== 'GET') {
      fetchOptions.body = body
    }

    const response = await fetch(url, fetchOptions)

    // Extract response headers into a plain object
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value: string, key: string) => {
      responseHeaders[key.toLowerCase()] = value
    })

    const responseBody = await response.text()

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
