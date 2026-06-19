/**
 * Strip trailing slashes from a base URL.
 */
export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}

/**
 * Append query parameters from a params object to a URL.
 * Skips undefined and null values.
 * String values are added directly; others are JSON-stringified.
 */
export function appendQueryParams(url: URL, params: Record<string, unknown>): void {
  for (const key of Object.keys(params)) {
    const value = params[key]
    if (value === undefined || value === null) continue
    url.searchParams.set(key, typeof value === 'string' ? value : JSON.stringify(value))
  }
}
