/**
 * Create an Array marker. The server converts this to a Go slice.
 *
 * @param arr - Array to serialize as JSON
 */
export function Array_(arr: unknown[]): `Array(${string})` {
  return `Array(${JSON.stringify(arr)})`
}

/**
 * Create a Map marker. The server converts this to a map[string]interface{}.
 *
 * @param obj - Object to serialize as JSON
 */
export function Map_(obj: Record<string, unknown>): `Map(${string})` {
  return `Map(${JSON.stringify(obj)})`
}

/**
 * Create a Map[] marker. The server converts this to []map[string]interface{}.
 *
 * @param arr - Array of objects to serialize as JSON
 */
export function MapArray(arr: Record<string, unknown>[]): `Map[](${string})` {
  return `Map[](${JSON.stringify(arr)})`
}
