/**
 * Fetch-based request adapter for Web (H5) and Node.js environments.
 *
 * Uses the standard `fetch` API (native in Node.js 18+, all modern browsers).
 */

import type { PlatformRequestOptions, PlatformResponse, PlatformRequestFn } from '../types'

/**
 * Execute an HTTP request using the standard `fetch` API.
 *
 * @param options - Standardized request options
 * @returns Standardized response object
 */
export const fetchRequest: PlatformRequestFn = async (
  options: PlatformRequestOptions
): Promise<PlatformResponse> => {
  const { url, method, headers, body, signal } = options

  const fetchOptions: RequestInit = {
    method,
    headers,
    signal,
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
}
