/**
 * Null / null-equivalent markers that the server converts to Go nil.
 *
 * The server recognizes all these variants as null:
 * 'Null', 'null', 'NULL', 'None', 'none', 'NONE', 'Nil', 'nil', 'NIL', '<nil>', ''
 */

/** Null marker — server converts to nil */
export const Null = 'Null' as const

/** None marker — server converts to nil */
export const None = 'None' as const

/** Nil marker — server converts to nil */
export const Nil = 'Nil' as const

/** empty string — server converts to nil (use '' directly) */
export const Empty = '' as const

/**
 * Undefined markers that the server converts to bson.Undefined{}.
 */
export const UNDEFINED = 'UNDEFINED' as const
export const Undefined = 'Undefined' as const
