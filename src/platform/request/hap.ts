/**
 * Quick App (快应用) request adapter.
 *
 * Quick App uses the `@system.fetch` module for HTTP requests.
 * Unlike mini programs, Quick App's fetch API is more similar to the standard
 * `fetch` API but requires importing the system module.
 *
 * IMPORTANT: The `@system.fetch` module is only available inside Quick App.
 * In other environments, the require call is wrapped in a try-catch and will
 * safely return null, falling back to other adapters.
 *
 * API reference: https://doc.quickapp.cn/features/system/fetch.html
 */

import type { PlatformRequestOptions, PlatformResponse, PlatformRequestFn } from '../types'

/**
 * Safely access Quick App's @system.fetch module.
 *
 * Uses a dynamic require call wrapped in try-catch so that:
 * - In Quick App: returns the @system.fetch module ✓
 * - In other bundlers (webpack/esbuild): the require is preserved as-is
 * - In browsers: throws ReferenceError (require not defined) → caught → returns null
 */
function getSystemFetch(): {
  fetch: (opts: {
    url: string
    method?: string
    header?: Record<string, string>
    data?: string
    responseType?: string
    success?: (res: { code: number; data: string; headers: Record<string, string> }) => void
    fail?: (err: { code: number; data: string }) => void
    complete?: () => void
  }) => void
} | null {
  try {
    // In Quick App, @system.fetch is a built-in module accessible via require.
    // Quick App's hap-toolkit will resolve this at build time.
    // In other environments, this will throw and be caught.
    //
    // NOTE: For UMD/IIFE builds, esbuild is configured with --external:@system.fetch
    // so this require call is preserved as-is in the output.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sysFetch = require('@system.fetch')
    return sysFetch as ReturnType<typeof getSystemFetch>
  } catch (_e) {
    return null
  }
}

/**
 * Execute an HTTP request using Quick App's `@system.fetch` API.
 *
 * Key differences from standard fetch:
 * - Callback-based (success/fail/complete), not Promise-based
 * - Response status is in `res.code`
 * - Headers are in `res.headers`
 *
 * @param options - Standardized request options
 * @returns Standardized response object
 */
export const hapRequest: PlatformRequestFn = async (
  options: PlatformRequestOptions
): Promise<PlatformResponse> => {
  const sysFetch = getSystemFetch()

  if (!sysFetch) {
    throw new Error(
      'Quick App fetch module (@system.fetch) is not available. ' +
        'Ensure you are running inside a Quick App environment.'
    )
  }

  const { url, method, headers, body } = options

  return new Promise<PlatformResponse>((resolve, reject) => {
    sysFetch.fetch({
      url,
      method: method.toUpperCase(),
      header: headers,
      data: body,
      responseType: 'text',
      success: (res: { code: number; data: string; headers: Record<string, string> }) => {
        const responseHeaders: Record<string, string> = {}
        if (res.headers) {
          for (const key of Object.keys(res.headers)) {
            responseHeaders[key.toLowerCase()] = res.headers[key]!
          }
        }

        resolve({
          status: res.code,
          statusText: '',
          headers: responseHeaders,
          body: typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
        })
      },
      fail: (err: { code: number; data: string }) => {
        reject(new Error(`Quick App request failed (code: ${err.code}, data: ${err.data})`))
      },
      complete: () => {
        // No-op
      },
    })
  })
}
