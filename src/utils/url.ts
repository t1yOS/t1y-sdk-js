/**
 * URL utilities — manual string manipulation (no `new URL()` or `URLSearchParams`).
 *
 * This avoids dependencies on the `URL` constructor which is not available
 * in WeChat Mini Program and other non-browser environments.
 */

/**
 * Strip trailing slashes from a base URL.
 */
export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

/**
 * Build a query string from a key-value object.
 * Skips undefined and null values.
 * String values are added directly; others are JSON-stringified.
 *
 * Returns the query string (including leading `?`) or empty string if no params.
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const parts: string[] = []
  for (const key of Object.keys(params)) {
    const value = params[key]
    if (value === undefined || value === null) continue
    const encodedKey = encodeURIComponent(key)
    const encodedValue = encodeURIComponent(
      typeof value === 'string' ? value : JSON.stringify(value)
    )
    parts.push(`${encodedKey}=${encodedValue}`)
  }
  return parts.length > 0 ? `?${parts.join('&')}` : ''
}

/**
 * Extract the path + query string from a full URL.
 * e.g., "https://myapp.t1y.net/v5/classes/users?name=Alice" → "/v5/classes/users?name=Alice"
 */
export function getPathAndQuery(fullUrl: string): string {
  // Find the third slash (after protocol://)
  const protocolEnd = fullUrl.indexOf('://')
  if (protocolEnd === -1) {
    // No protocol, assume the URL is already a path
    return fullUrl
  }
  const pathStart = fullUrl.indexOf('/', protocolEnd + 3)
  if (pathStart === -1) {
    return '/'
  }
  return fullUrl.substring(pathStart)
}
