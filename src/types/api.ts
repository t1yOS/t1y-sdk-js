/**
 * Standard API response wrapper returned by the t1yOS server.
 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** Response from insertOne */
export interface InsertResult {
  objectId: string
}

/** Response from insertMany */
export interface InsertManyResult {
  objectIds: string[]
  insertedCount: number
}

/** Response from deleteOne / deleteOneByObjectId */
export interface DeleteResult {
  deletedCount: number
}

/** Response from deleteMany */
export interface DeleteManyResult {
  deletedCount: number
}

/** Response from updateOne / updateOneByObjectId */
export interface UpdateResult {
  modifiedCount: number
}

/** Response from updateMany */
export interface UpdateManyResult {
  modifiedCount: number
}

/** Response from findOne / findOneByObjectId / findOneByFilter */
export interface FindResult {
  result: Record<string, unknown>
}

/** Pagination metadata */
export interface Pagination {
  totalItems: number
  totalPages: number
}

/** Response from find (paginated query) */
export interface PaginationResult {
  results: Record<string, unknown>[]
  page: number
  size: number
  pagination: Pagination
}

/** Response from aggregate */
export interface AggregateResult {
  results: Record<string, unknown>[]
}

/** Init response from GET /init/:appId */
export interface InitResult {
  unix: number
  is_safe_mode: boolean
}
