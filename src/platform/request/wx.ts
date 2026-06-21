/**
 * WeChat / QQ / Toutiao / Douyin Mini Program request adapter.
 *
 * All of these platforms expose a `wx.request`-compatible API:
 * - WeChat:  `wx.request`
 * - QQ:      `qq.request`
 * - Toutiao: `tt.request`
 * - Douyin:  `tt.request`
 *
 * The actual API object is resolved at call time via `getMiniProgramAPI()`.
 */

import { getMiniProgramAPI } from '../detect'
import type { PlatformRequestOptions, PlatformResponse, PlatformRequestFn } from '../types'

/**
 * Execute an HTTP request using the mini program's `request` API.
 *
 * The mini program API uses callback-based `wx.request({ success, fail, complete })`.
 * This adapter wraps it in a Promise for consistent async/await usage.
 *
 * @param options - Standardized request options
 * @returns Standardized response object
 */
export const wxRequest: PlatformRequestFn = async (
  options: PlatformRequestOptions
): Promise<PlatformResponse> => {
  const mpApi = getMiniProgramAPI()

  if (!mpApi || typeof (mpApi as Record<string, unknown>).request !== 'function') {
    throw new Error('Mini program request API is not available')
  }

  const requestFn = (mpApi as Record<string, unknown>).request as (
    opts: Record<string, unknown>
  ) => { abort: () => void }

  const { url, method, headers, body, timeout } = options

  return new Promise<PlatformResponse>((resolve, reject) => {
    const requestTask = requestFn({
      url,
      method: method as
        | 'GET'
        | 'POST'
        | 'PUT'
        | 'DELETE'
        | 'OPTIONS'
        | 'HEAD'
        | 'TRACE'
        | 'CONNECT',
      header: headers,
      data: body,
      timeout: timeout ?? 300000, // 5 minutes default
      dataType: 'text', // Get raw text, we parse JSON ourselves
      responseType: 'text',
      success: (res: {
        statusCode: number
        errMsg?: string
        header?: Record<string, string>
        data?: string | object
      }) => {
        // Normalize response headers
        const responseHeaders: Record<string, string> = {}
        if (res.header) {
          for (const key of Object.keys(res.header)) {
            responseHeaders[key.toLowerCase()] = res.header[key]!
          }
        }

        // Handle response body — it might already be parsed as JSON
        let bodyStr: string
        if (typeof res.data === 'string') {
          bodyStr = res.data
        } else if (res.data !== undefined && res.data !== null) {
          bodyStr = JSON.stringify(res.data)
        } else {
          bodyStr = ''
        }

        resolve({
          status: res.statusCode,
          statusText: res.errMsg ?? '',
          headers: responseHeaders,
          body: bodyStr,
        })
      },
      fail: (err: { errMsg?: string; errno?: number }) => {
        // Handle timeout specially
        const errMsg = err.errMsg ?? 'Mini program request failed'
        if (errMsg.includes('timeout') || errMsg.includes('超时')) {
          reject(new Error('Request timeout'))
        } else {
          reject(new Error(errMsg))
        }
      },
    })

    // Handle AbortSignal if provided
    if (options.signal) {
      const onAbort = () => {
        if (typeof requestTask.abort === 'function') {
          requestTask.abort()
        }
      }
      options.signal.addEventListener('abort', onAbort, { once: true })
    }
  })
}
