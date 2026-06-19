/**
 * Create a Date marker string. The server converts this to a Go time.Time.
 *
 * @param dateStr - ISO 8601 / RFC 3339 date string
 * @returns Date marker, e.g. `Date('2024-01-15T10:30:00Z')`
 */
export function Date_(dateStr: string): `Date('${string}')` {
  return `Date('${dateStr}')`
}

/**
 * Create a DateTime marker string. Same as Date on the server side.
 *
 * @param dateStr - ISO 8601 / RFC 3339 date string
 * @returns DateTime marker, e.g. `DateTime('2024-01-15T10:30:00Z')`
 */
export function DateTime(dateStr: string): `DateTime('${string}')` {
  return `DateTime('${dateStr}')`
}

/**
 * Create a Timestamp marker string. The server converts this to a Unix timestamp.
 *
 * @param unix - Unix timestamp (seconds) as number or string
 * @returns Timestamp marker, e.g. `Timestamp('1705312200')`
 */
export function Timestamp(unix: number | string): `Timestamp('${string}')` {
  return `Timestamp('${String(unix)}')`
}
