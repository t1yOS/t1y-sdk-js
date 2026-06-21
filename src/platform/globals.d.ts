/**
 * Type declarations for mini program global APIs.
 *
 * These globals are only available inside their respective platform runtimes.
 * They are declared here so TypeScript doesn't error when we reference them.
 */

/** WeChat Mini Program global API */
declare const wx: {
  request: (opts: Record<string, unknown>) => { abort: () => void }
  setStorageSync: (key: string, value: unknown) => void
  getStorageSync: (key: string) => unknown
  removeStorageSync: (key: string) => void
  clearStorageSync: () => void
  getRandomValues?: (arr: Uint8Array) => Uint8Array
  connectSocket?: (opts: Record<string, unknown>) => unknown
  [key: string]: unknown
}

/** QQ Mini Program global API (extends WeChat API) */
declare const qq: {
  request: (opts: Record<string, unknown>) => { abort: () => void }
  [key: string]: unknown
}

/** Toutiao/Douyin Mini Program global API (extends WeChat API) */
declare const tt: {
  request: (opts: Record<string, unknown>) => { abort: () => void }
  [key: string]: unknown
}

/** Alipay Mini Program global API */
declare const my: {
  request: (opts: Record<string, unknown>) => { abort: () => void }
  [key: string]: unknown
}
