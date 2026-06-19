/**
 * Time helper markers that the server evaluates at request time.
 *
 * These are string values that, when sent to the server, are replaced
 * with the actual current time on the server side via Go's time.Now().
 */

/** Server fills in time.Now() (current UTC time) */
export const TimeNow = 'time.Now()' as const

/** Server fills in time.Now().Unix() (current Unix timestamp) */
export const TimeNowUnix = 'time.Now().Unix()' as const

/** Server fills in time.Now().UnixNano() */
export const TimeNowUnixNano = 'time.Now().UnixNano()' as const

/** Server fills in time.Now().Weekday() (e.g., time.Monday) */
export const TimeNowWeekday = 'time.Now().Weekday()' as const

/** Server fills in time.Now().Weekday().Chinese() (Chinese weekday name) */
export const TimeNowWeekdayChinese = 'time.Now().Weekday().Chinese()' as const

/**
 * Convenience object grouping all time-now helpers.
 *
 * @example
 * ```ts
 * import { timeNow } from 't1y-sdk-js'
 *
 * await db.collection('posts').insertOne({
 *   title: 'Hello',
 *   createdAt: timeNow.Now(),
 * })
 * ```
 */
export const timeNow = {
  Now: () => TimeNow,
  NowUnix: () => TimeNowUnix,
  NowUnixNano: () => TimeNowUnixNano,
  NowWeekday: () => TimeNowWeekday,
  NowWeekdayChinese: () => TimeNowWeekdayChinese,
}
