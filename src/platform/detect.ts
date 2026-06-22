/**
 * Platform detection module.
 *
 * Detects the current runtime environment and returns a platform type identifier.
 * This enables the SDK to use the correct network request API for each platform:
 *
 * | Platform              | Type     | Request API        | Global Object     |
 * |-----------------------|----------|--------------------|-------------------|
 * | WeChat Mini Program   | `wx`     | `wx.request`       | `wx`              |
 * | QQ Mini Program       | `wx`     | `qq.request`       | `qq`              |
 * | Toutiao/Douyin Mini   | `wx`     | `tt.request`       | `tt`              |
 * | Alipay Mini Program   | `my`     | `my.request`       | `my`              |
 * | Quick App             | `hap`    | `@system.fetch`    | —                 |
 * | React Native          | `rn`     | `fetch`            | `navigator`       |
 * | Web / Vue / React     | `h5`     | `fetch`            | `window`          |
 * | Node.js               | `nodejs` | `fetch` (18+)      | `process`         |
 */

/** Platform type identifiers */
export type PlatformType = 'wx' | 'my' | 'hap' | 'rn' | 'h5' | 'nodejs' | 'unknown'

/** Mini program sub-type within the `wx` platform family */
export type MiniProgramSubType = 'wechat' | 'qq' | 'toutiao' | 'unknown'

/** Cached platform detection result */
let _platformType: PlatformType | null = null
let _miniProgramSubType: MiniProgramSubType | null = null

/**
 * Detect the current platform type.
 *
 * Detection order (from most specific to least):
 * 1. WeChat/QQ/Toutiao/Douyin Mini Programs — global `wx`/`qq`/`tt` object
 * 2. Alipay Mini Program — global `my` object
 * 3. Quick App — no `window`, no `wx`, but has `@system.fetch` via `require`
 * 4. React Native — `navigator.product === 'ReactNative'`, no `document`
 * 5. Web / H5 — global `window` and `document`
 * 6. Node.js — global `process` without `window`
 *
 * @returns The detected platform type
 */
export function getPlatformType(): PlatformType {
  if (_platformType !== null) {
    return _platformType
  }

  // Use `typeof` checks to avoid ReferenceError in strict environments

  // Check for Mini Programs (WeChat, QQ, Toutiao, Douyin)
  // All of these expose a global `wx`-like API object
  if (typeof wx !== 'undefined' && typeof (wx as Record<string, unknown>).request === 'function') {
    _platformType = 'wx'
    return _platformType
  }

  // Check for Alipay Mini Program
  if (typeof my !== 'undefined' && typeof (my as Record<string, unknown>).request === 'function') {
    _platformType = 'my'
    return _platformType
  }

  // Check for Quick App
  // Quick App has no `window` or `document` but also no `wx`
  // Detection: check if it's not a browser and has `global` (Quick App's global scope)
  if (
    typeof window === 'undefined' &&
    typeof document === 'undefined' &&
    typeof global !== 'undefined' &&
    typeof (global as Record<string, unknown>).require === 'function'
  ) {
    // Further distinguish: Quick App has @system packages available via require
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      if (typeof require !== 'undefined' && typeof require('@system.fetch') !== 'undefined') {
        _platformType = 'hap'
        return _platformType
      }
    } catch {
      // @system.fetch not available — not Quick App
    }
  }

  // Check for React Native
  // React Native sets navigator.product === 'ReactNative' as a runtime identifier.
  // This check runs before the Web/H5 check because RN may polyfill `window`
  // (but not `document`) in some configurations (e.g. Hermes).
  if (
    typeof navigator !== 'undefined' &&
    typeof (navigator as unknown as Record<string, unknown>).product === 'string' &&
    (navigator as unknown as Record<string, unknown>).product === 'ReactNative'
  ) {
    _platformType = 'rn'
    return _platformType
  }

  // Check for Web / H5 (browser environment)
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    _platformType = 'h5'
    return _platformType
  }

  // Check for Node.js
  if (
    typeof process !== 'undefined' &&
    typeof (process as unknown as Record<string, unknown>).versions !== 'undefined' &&
    typeof ((process as unknown as Record<string, unknown>).versions as Record<string, unknown>)
      ?.node !== 'undefined'
  ) {
    _platformType = 'nodejs'
    return _platformType
  }

  _platformType = 'unknown'
  return _platformType
}

/**
 * Detect the mini program sub-type (only meaningful when platform is `wx`).
 *
 * | Sub-type   | Global Object | Notes                                  |
 * |------------|---------------|----------------------------------------|
 * | `toutiao`  | `tt`          | Toutiao/Douyin Mini Program            |
 * | `qq`       | `qq`          | QQ Mini Program                        |
 * | `wechat`   | `wx`          | WeChat Mini Program (default for `wx`) |
 *
 * @returns The detected mini program sub-type
 */
export function getMiniProgramSubType(): MiniProgramSubType {
  if (_miniProgramSubType !== null) {
    return _miniProgramSubType
  }

  // Only relevant for `wx` platform
  if (getPlatformType() !== 'wx') {
    _miniProgramSubType = 'unknown'
    return _miniProgramSubType
  }

  // Toutiao/Douyin exposes `tt` alongside `wx`
  if (typeof tt !== 'undefined' && typeof (tt as Record<string, unknown>).request === 'function') {
    _miniProgramSubType = 'toutiao'
    return _miniProgramSubType
  }

  // QQ Mini Program exposes `qq` alongside `wx`
  if (typeof qq !== 'undefined' && typeof (qq as Record<string, unknown>).request === 'function') {
    _miniProgramSubType = 'qq'
    return _miniProgramSubType
  }

  // Default to WeChat
  _miniProgramSubType = 'wechat'
  return _miniProgramSubType
}

/**
 * Get the global API object for mini programs.
 *
 * Returns the appropriate global object based on the detected platform:
 * - WeChat: `wx`
 * - QQ: `qq`
 * - Toutiao/Douyin: `tt`
 *
 * @returns The mini program global API object, or `null` if not in a mini program
 */
export function getMiniProgramAPI(): Record<string, unknown> | null {
  const platform = getPlatformType()

  if (platform === 'my') {
    return my as unknown as Record<string, unknown>
  }

  if (platform !== 'wx') {
    return null
  }

  const subType = getMiniProgramSubType()

  switch (subType) {
    case 'toutiao':
      return tt as unknown as Record<string, unknown>
    case 'qq':
      return qq as unknown as Record<string, unknown>
    case 'wechat':
    default:
      return wx as unknown as Record<string, unknown>
  }
}

/**
 * Reset cached platform detection (useful for testing).
 */
export function resetPlatformDetection(): void {
  _platformType = null
  _miniProgramSubType = null
}
