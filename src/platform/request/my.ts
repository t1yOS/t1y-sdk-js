/**
 * Alipay Mini Program request adapter.
 *
 * Alipay Mini Program uses `my.request` which has a slightly different API
 * from WeChat's `wx.request`. Key differences:
 * - Uses `headers` instead of `header`
 * - Response `data` is always parsed JSON (not raw text)
 * - Different error object structure
 *
 * API reference: https://opendocs.alipay.com/mini/api/owycmh
 */

import type { PlatformRequestOptions, PlatformResponse, PlatformRequestFn } from '../types'

/**
 * Execute an HTTP request using Alipay's `my.request` API.
 *
 * @param options - Standardized request options
 * @returns Standardized response object
 */
export const myRequest: PlatformRequestFn = async (
  options: PlatformRequestOptions
): Promise<PlatformResponse> => {
  // Access the Alipay global API
  const mpApi = my as unknown as Record<string, unknown>

  if (!mpApi || typeof mpApi.request !== 'function') {
    throw new Error('Alipay mini program request API (my.request) is not available')
  }

  const requestFn = mpApi.request as (opts: Record<string, unknown>) => { abort: () => void }

  const { url, method, headers, body, timeout } = options

  return new Promise<PlatformResponse>((resolve, reject) => {
    const requestTask = requestFn({
      url,
      method: method.toUpperCase(),
      headers, // Alipay uses `headers` (not `header` like WeChat)
      data: body !== undefined ? body : undefined,
      timeout: timeout ?? 300000,
      // Request JSON but we handle parsing ourselves
      dataType: 'text',
      success: (res: {
        status?: number
        statusCode?: number
        headers?: Record<string, string>
        data?: unknown
      }) => {
        // Normalize response
        const status = res.status ?? res.statusCode ?? 200

        const responseHeaders: Record<string, string> = {}
        if (res.headers) {
          for (const key of Object.keys(res.headers)) {
            responseHeaders[key.toLowerCase()] = res.headers[key]!
          }
        }

        let bodyStr: string
        if (typeof res.data === 'string') {
          bodyStr = res.data
        } else if (res.data !== undefined && res.data !== null) {
          bodyStr = JSON.stringify(res.data)
        } else {
          bodyStr = ''
        }

        resolve({
          status,
          statusText: '',
          headers: responseHeaders,
          body: bodyStr,
        })
      },
      fail: (err: { error?: number | string; errorMessage?: string; errMsg?: string }) => {
        const errMsg =
          err.errorMessage ?? err.errMsg ?? `Alipay request failed (error: ${err.error})`
        reject(new Error(errMsg))
      },
      complete: () => {
        // No-op — handled in success/fail
      },
    })

    // Handle AbortSignal if provided
    if (options.signal) {
      const onAbort = () => {
        if (requestTask && typeof requestTask.abort === 'function') {
          requestTask.abort()
        }
      }
      options.signal.addEventListener('abort', onAbort, { once: true })
    }
  })
}
