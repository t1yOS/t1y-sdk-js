/**
 * Recursively convert JavaScript Date objects and timestamp numbers
 * into the marker string format that the server's GetDataTypes() recognizes.
 *
 * - Date objects → `Date('ISO-8601')`
 * - Numbers >= 10 digits → `Timestamp('unix')`
 * - Already-marker strings (starting with recognized prefixes) are passed through
 */
export function convertDateTypes(value: unknown): unknown {
  if (value instanceof Date) {
    return `Date('${value.toISOString()}')`
  }

  if (typeof value === 'number') {
    const str = String(value)
    // 10+ digit integer → Timestamp
    if (/^\d{10,}$/.test(str)) {
      return `Timestamp('${str}')`
    }
    return value
  }

  if (Array.isArray(value)) {
    return value.map((v) => convertDateTypes(v))
  }

  if (value && typeof value === 'object') {
    const obj: Record<string, unknown> = {}
    for (const key in value as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        obj[key] = convertDateTypes((value as Record<string, unknown>)[key])
      }
    }
    return obj
  }

  return value
}

/**
 * Check if a value is a non-null, non-array object with at least one key.
 */
export function isNonEmptyObject(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0
  )
}

/**
 * Check if a value is a plain object (non-null, non-array).
 */
export function isPlainObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Check if a value is a non-empty array where every element is a non-empty object.
 */
export function isNonEmptyArrayWithNonEmptyObjects(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) {
    return false
  }
  return value.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      !Array.isArray(item) &&
      Object.keys(item).length > 0
  )
}
