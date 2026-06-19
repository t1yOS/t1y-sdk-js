/** Default base URL for the t1yOS platform */
export const DEFAULT_BASE_URL = 'https://myapp.t1y.net'

/** Minimum valid application ID */
export const MIN_APP_ID = 1001

/** Required length for API Key */
export const API_KEY_LENGTH = 32

/** Required length for Secret Key */
export const SECRET_KEY_LENGTH = 32

/** Default application version */
export const DEFAULT_VERSION = 0

/** Default time format for createdAt/updatedAt fields */
export const DEFAULT_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'

/** Default time offset in seconds */
export const DEFAULT_OFFSET = 0

/** Default safe mode setting */
export const DEFAULT_SAFE_MODE = false

/** Maximum time difference allowed for request timestamp (seconds) */
export const MAX_TIME_DIFF = 10

/** Request timeout in milliseconds (5 minutes) */
export const REQUEST_TIMEOUT_MS = 5 * 60 * 1000

/** Maximum page size for find queries */
export const MAX_PAGE_SIZE = 100

/** Default page size */
export const DEFAULT_PAGE_SIZE = 10

/** ObjectID hex string length */
export const OBJECT_ID_LENGTH = 24

/** ObjectID hex pattern */
export const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/

/** API version prefix */
export const API_VERSION = 'v5'
