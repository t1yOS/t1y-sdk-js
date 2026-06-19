/**
 * Marker type string representations that the server's GetDataTypes()
 * recognizes and converts to native MongoDB/Go types.
 *
 * These are all literal string types for documentation/typing purposes.
 * At runtime, the helper functions simply return these string values.
 */

/** ObjectID marker: ObjectID('24-char-hex') */
export type ObjectIDMarker = `ObjectID('${string}')`

/** Date marker: Date('RFC3339') */
export type DateMarker = `Date('${string}')`

/** DateTime marker: DateTime('RFC3339') */
export type DateTimeMarker = `DateTime('${string}')`

/** Timestamp marker: Timestamp('unix-seconds') */
export type TimestampMarker = `Timestamp('${string}')`

/** Boolean marker: Boolean(true) or Boolean(false) */
export type BooleanMarker = `Boolean(${string})`

/** Integer marker: Integer(N) */
export type IntegerMarker = `Integer(${number})`

/** Bigint marker: Bigint(N) */
export type BigintMarker = `Bigint(${number})`

/** Float marker: Float(N) */
export type FloatMarker = `Float(${number})`

/** Double marker: Double(N) */
export type DoubleMarker = `Double(${number})`

/** Array marker: Array(json) */
export type ArrayMarker = `Array(${string})`

/** Map marker: Map(json) */
export type MapMarker = `Map(${string})`

/** Map[] marker: Map[](json) */
export type MapArrayMarker = `Map[](${string})`

/** Null markers that the server converts to nil */
export type NullMarker =
  | 'Null'
  | 'null'
  | 'NULL'
  | 'None'
  | 'none'
  | 'NONE'
  | 'Nil'
  | 'nil'
  | 'NIL'
  | '<nil>'
  | ''

/** Undefined markers that the server converts to bson.Undefined */
export type UndefinedMarker = 'UNDEFINED' | 'Undefined'

/** Time helper markers */
export type TimeNowMarker = 'time.Now()'
export type TimeNowUnixMarker = 'time.Now().Unix()'
export type TimeNowUnixNanoMarker = 'time.Now().UnixNano()'
export type TimeNowWeekdayMarker = 'time.Now().Weekday()'
export type TimeNowWeekdayChineseMarker = 'time.Now().Weekday().Chinese()'

/**
 * Union of all possible special type marker strings.
 */
export type SpecialTypeMarker =
  | ObjectIDMarker
  | DateMarker
  | DateTimeMarker
  | TimestampMarker
  | BooleanMarker
  | IntegerMarker
  | BigintMarker
  | FloatMarker
  | DoubleMarker
  | ArrayMarker
  | MapMarker
  | MapArrayMarker
  | NullMarker
  | UndefinedMarker
  | TimeNowMarker
  | TimeNowUnixMarker
  | TimeNowUnixNanoMarker
  | TimeNowWeekdayMarker
  | TimeNowWeekdayChineseMarker
