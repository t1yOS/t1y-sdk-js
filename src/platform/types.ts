/**
 * Platform-agnostic request/response types for the adapter layer.
 *
 * Each platform adapter converts its native HTTP API into this common shape,
 * so the core HTTP module can remain platform-agnostic.
 */

/** Standardized request options passed to platform adapters */
export interface PlatformRequestOptions {
  /** Full URL (including query string) */
  url: string
  /** HTTP method (GET, POST, PUT, DELETE) */
  method: string
  /** Request headers as key-value pairs */
  headers: Record<string, string>
  /** Raw request body string (already encrypted if safe mode), undefined for GET */
  body?: string
  /** AbortSignal for request cancellation / timeout */
  signal?: AbortSignal
  /** Request timeout in milliseconds */
  timeout?: number
}

/** Standardized response returned by platform adapters */
export interface PlatformResponse {
  /** HTTP status code */
  status: number
  /** HTTP status text */
  statusText: string
  /** Response headers (at minimum, content-type) */
  headers: Record<string, string>
  /** Raw response body as text */
  body: string
}

/** Platform request function signature */
export type PlatformRequestFn = (options: PlatformRequestOptions) => Promise<PlatformResponse>

/** Platform info for SDK type headers */
export interface PlatformInfo {
  /** Platform type */
  type: string
  /** SDK type string sent in X-T1Y-SDK-Type header */
  sdkType: string
  /** Request function for this platform */
  request: PlatformRequestFn
}
