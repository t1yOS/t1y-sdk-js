import { DEFAULT_TIME_FORMAT } from '../constants'

/**
 * Format a UTC date string to local time using the given format template.
 *
 * Format tokens:
 *   YYYY - 4-digit year
 *   MM   - 2-digit month (01-12)
 *   DD   - 2-digit day (01-31)
 *   HH   - 2-digit hour (00-23)
 *   mm   - 2-digit minute (00-59)
 *   ss   - 2-digit second (00-59)
 */
function formatLocalTime(utcString: string, format: string): string {
  const date = new Date(utcString)
  if (isNaN(date.getTime())) return utcString

  const pad = (n: number) => String(n).padStart(2, '0')

  return format
    .replace('YYYY', String(date.getFullYear()))
    .replace('MM', pad(date.getMonth() + 1))
    .replace('DD', pad(date.getDate()))
    .replace('HH', pad(date.getHours()))
    .replace('mm', pad(date.getMinutes()))
    .replace('ss', pad(date.getSeconds()))
}

/**
 * Recursively convert all `createdAt` and `updatedAt` fields in a data structure
 * from UTC strings to local time formatted strings.
 *
 * Returns a new object/array; does not mutate the original.
 */
export function formatTimestampsToLocal(
  data: unknown,
  format: string = DEFAULT_TIME_FORMAT
): unknown {
  function traverse(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map(traverse)
    }
    if (value && typeof value === 'object') {
      const result: Record<string, unknown> = {}
      for (const key in value as Record<string, unknown>) {
        if (!Object.prototype.hasOwnProperty.call(value, key)) continue

        if (key === 'createdAt' || key === 'updatedAt') {
          result[key] = formatLocalTime((value as Record<string, unknown>)[key] as string, format)
        } else {
          result[key] = traverse((value as Record<string, unknown>)[key])
        }
      }
      return result
    }
    return value
  }

  return traverse(data)
}
