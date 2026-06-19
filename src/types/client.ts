/**
 * Configuration for initializing the t1yOS client.
 */
export interface T1YOSConfig {
  /** Base URL of the t1yOS platform. Default: 'https://myapp.t1y.net' */
  baseUrl?: string
  /** Application ID. Required, must be an integer >= 1001 */
  appId: number
  /** API Key. Required, must be exactly 32 characters */
  apiKey: string
  /** Secret Key. Required, must be exactly 32 characters */
  secretKey: string
  /** Application version. Default: 0 */
  version?: number
  /** Whether to enable safe mode (AES-256-GCM encryption). Default: false */
  isSafeMode?: boolean
  /** Time format for createdAt/updatedAt fields. Default: 'YYYY-MM-DD HH:mm:ss' */
  timeFormat?: string
  /** Time offset in seconds between client and server. Default: 0 */
  offset?: number
}

/**
 * Internal configuration with all optional fields resolved to defaults.
 */
export interface T1YOSInternalConfig {
  baseUrl: string
  appId: number
  apiKey: string
  secretKey: string
  version: number
  isSafeMode: boolean
  timeFormat: string
  offset: number
}

/** HTTP methods supported by the SDK */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
