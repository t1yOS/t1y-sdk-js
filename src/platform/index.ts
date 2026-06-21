/**
 * Platform abstraction layer for the t1yOS SDK.
 *
 * Provides:
 * - Platform detection (WeChat/QQ/Alipay/Toutiao/Douyin Mini Programs, Quick App, Web, Node.js)
 * - Request adapters for each platform's HTTP API
 * - The platform-aware request dispatcher used by the HTTP module
 */

export {
  getPlatformType,
  getMiniProgramSubType,
  getMiniProgramAPI,
  resetPlatformDetection,
} from './detect'

export type { PlatformType, MiniProgramSubType } from './detect'

export { fetchRequest, wxRequest, myRequest, hapRequest } from './request'

export type {
  PlatformRequestOptions,
  PlatformResponse,
  PlatformRequestFn,
  PlatformInfo,
} from './types'

// Platform request dispatcher — selects the correct adapter at runtime
export { getPlatformRequest, getPlatformInfo } from './dispatcher'
