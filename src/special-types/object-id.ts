import { OBJECT_ID_PATTERN } from '../constants'

/**
 * Create an ObjectID marker string that the server will convert to a MongoDB ObjectID.
 *
 * @param id - 24-character hexadecimal string
 * @returns ObjectID marker string, e.g. `ObjectID('507f1f77bcf86cd799439011')`
 *
 * @example
 * ```ts
 * import { ObjectID } from 't1y-sdk-js'
 *
 * await db.collection('users').find(ObjectID('507f1f77bcf86cd799439011'))
 * ```
 */
export function ObjectID(id: string): `ObjectID('${string}')` {
  if (!OBJECT_ID_PATTERN.test(id)) {
    throw new Error(`Invalid ObjectID: "${id}" (must be 24 hex characters)`)
  }
  return `ObjectID('${id}')`
}
