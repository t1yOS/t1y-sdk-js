/**
 * Platform request dispatcher.
 *
 * Detects the runtime platform and returns the appropriate request function
 * and platform metadata. This is the single entry point used by the HTTP
 * module to execute requests in any environment.
 */

import { getPlatformType, getMiniProgramSubType } from './detect'
import { fetchRequest } from './request/fetch'
import { wxRequest } from './request/wx'
import { myRequest } from './request/my'
import { hapRequest } from './request/hap'
import type { PlatformRequestFn, PlatformInfo } from './types'

/** Cached platform request function */
let _cachedRequest: PlatformRequestFn | null = null
let _cachedInfo: PlatformInfo | null = null

/**
 * Get the platform-appropriate request function.
 *
 * On first call, detects the platform and caches the result.
 * Subsequent calls return the cached adapter.
 *
 * @returns The request function for the current platform
 * @throws {Error} If the platform cannot be determined or no adapter is available
 */
export function getPlatformRequest(): PlatformRequestFn {
  if (_cachedRequest !== null) {
    return _cachedRequest
  }

  const platform = getPlatformType()

  switch (platform) {
    case 'h5':
    case 'nodejs':
      _cachedRequest = fetchRequest
      break
    case 'wx':
      _cachedRequest = wxRequest
      break
    case 'my':
      _cachedRequest = myRequest
      break
    case 'hap':
      _cachedRequest = hapRequest
      break
    default:
      // Fallback: try fetch first (works in modern environments)
      if (typeof fetch === 'function') {
        _cachedRequest = fetchRequest
      } else {
        throw new Error(
          'Unable to determine platform request adapter. ' +
            'The current environment does not have `fetch`, `wx.request`, `my.request`, ' +
            'or `@system.fetch` available. Please ensure you are running in a supported environment: ' +
            'Web browser, Node.js 18+, WeChat/QQ/Alipay/Toutiao/Douyin Mini Program, or Quick App.'
        )
      }
      break
  }

  return _cachedRequest!
}

/**
 * Get platform metadata including the SDK type string for request headers.
 *
 * The `sdkType` value is sent in the `X-T1Y-SDK-Type` header to help the
 * server identify which platform the request is coming from.
 *
 * @returns Platform metadata
 */
export function getPlatformInfo(): PlatformInfo {
  if (_cachedInfo !== null) {
    return _cachedInfo
  }

  const platform = getPlatformType()
  let sdkType = 'javascript'

  switch (platform) {
    case 'wx': {
      const subType = getMiniProgramSubType()
      switch (subType) {
        case 'toutiao':
          sdkType = 'toutiao'
          break
        case 'qq':
          sdkType = 'qqApp'
          break
        case 'wechat':
        default:
          sdkType = 'wechatApp'
          break
      }
      break
    }
    case 'my':
      sdkType = 'alipay'
      break
    case 'hap':
      sdkType = 'quickApp'
      break
    case 'h5':
      sdkType = 'web'
      break
    case 'nodejs':
      sdkType = 'nodejs'
      break
    default:
      sdkType = 'javascript'
      break
  }

  _cachedInfo = {
    type: platform,
    sdkType,
    request: getPlatformRequest(),
  }

  return _cachedInfo
}

/**
 * Reset cached dispatcher state (useful for testing).
 */
export function resetDispatcher(): void {
  _cachedRequest = null
  _cachedInfo = null
}
