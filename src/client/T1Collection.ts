/**
 * T1Collection — Database collection class providing chainable CRUD and schema operations.
 *
 * Created via `client.db.collection('name')` — never instantiated directly.
 */

import { assertObjectID } from '../utils/validators'
import {
  isNonEmptyObject,
  isPlainObject,
  isNonEmptyArrayWithNonEmptyObjects,
} from '../utils/convert'
import { MAX_PAGE_SIZE } from '../constants'
import type { T1YOS } from './T1YOS'
import type {
  ApiResponse,
  InsertResult,
  InsertManyResult,
  DeleteResult,
  DeleteManyResult,
  UpdateResult,
  UpdateManyResult,
  FindResult,
  PaginationResult,
  AggregateResult,
} from '../types'

export class T1Collection {
  /** The parent T1YOS client */
  private client: T1YOS
  /** The collection (table) name */
  private name: string

  /**
   * @internal — Use `client.db.collection(name)` instead.
   */
  constructor(client: T1YOS, name: string) {
    this.client = client
    this.name = name
  }

  // ==================== Single Document Operations ====================

  /**
   * Insert one document into the collection.
   *
   * @param data - Document data (must be a non-empty plain object)
   * @returns Response with the inserted document's ObjectID
   *
   * @example
   * ```ts
   * const { data } = await client.db.collection('users').insertOne({
   *   name: 'Alice',
   *   age: 25,
   * })
   * console.log(data.objectId) // '507f1f77bcf86cd799439011'
   * ```
   */
  async insertOne(data: Record<string, unknown>): Promise<ApiResponse<InsertResult>> {
    if (!isNonEmptyObject(data)) {
      throw new TypeError('insertOne data must be a non-empty plain object')
    }
    return await this.client.request<InsertResult>('POST', `/v5/classes/${this.name}`, data)
  }

  /**
   * Delete one document by ObjectID.
   *
   * @param objectId - 24-character hex ObjectID string
   * @returns Response with deleted count
   *
   * @example
   * ```ts
   * await client.db.collection('users').deleteById('507f1f77bcf86cd799439011')
   * ```
   */
  async deleteById(objectId: string): Promise<ApiResponse<DeleteResult>> {
    assertObjectID(objectId)
    return await this.client.request<DeleteResult>('DELETE', `/v5/classes/${this.name}/${objectId}`)
  }

  /**
   * Update one document by ObjectID.
   *
   * @param objectId - 24-character hex ObjectID string
   * @param data - Update data (must be a non-empty plain object)
   * @returns Response with modified count
   *
   * @example
   * ```ts
   * await client.db.collection('users').updateById('507f1f77bcf86cd799439011', { name: 'Bob' })
   * ```
   */
  async updateById(
    objectId: string,
    data: Record<string, unknown>
  ): Promise<ApiResponse<UpdateResult>> {
    assertObjectID(objectId)
    if (!isNonEmptyObject(data)) {
      throw new TypeError('update data must be a non-empty plain object')
    }
    return await this.client.request<UpdateResult>(
      'PUT',
      `/v5/classes/${this.name}/${objectId}`,
      data
    )
  }

  /**
   * Find one document by ObjectID.
   *
   * @param objectId - 24-character hex ObjectID string
   * @returns Response with the found document
   *
   * @example
   * ```ts
   * const { data } = await client.db.collection('users').findById('507f1f77bcf86cd799439011')
   * console.log(data.result) // { _id: '507f1f77...', name: 'Alice', ... }
   * ```
   */
  async findById(objectId: string): Promise<ApiResponse<FindResult>> {
    assertObjectID(objectId)
    return await this.client.request<FindResult>('GET', `/v5/classes/${this.name}/${objectId}`)
  }

  // ==================== Filter-based Single Operations ====================

  /**
   * Delete one document matching the filter.
   *
   * @param filter - Query filter (must be a non-empty plain object)
   * @returns Response with deleted count
   *
   * @example
   * ```ts
   * await client.db.collection('users').deleteOne({ name: 'Alice' })
   * ```
   */
  async deleteOne(filter: Record<string, unknown>): Promise<ApiResponse<DeleteResult>> {
    if (!isNonEmptyObject(filter)) {
      throw new TypeError('deleteOne filter must be a non-empty plain object')
    }
    return await this.client.request<DeleteResult>('DELETE', `/v5/classes/${this.name}/one`, filter)
  }

  /**
   * Update one document matching the filter.
   *
   * @param filter - Query filter to find the document
   * @param body - Update data (MongoDB update operators like $set, $inc, etc.)
   * @returns Response with modified count
   *
   * @example
   * ```ts
   * await client.db.collection('users').updateOne(
   *   { name: 'Alice' },
   *   { $set: { age: 26 } }
   * )
   * ```
   */
  async updateOne(
    filter: Record<string, unknown>,
    body: Record<string, unknown>
  ): Promise<ApiResponse<UpdateResult>> {
    if (!isNonEmptyObject(filter)) {
      throw new TypeError('updateOne filter must be a non-empty plain object')
    }
    if (!isNonEmptyObject(body)) {
      throw new TypeError('updateOne body must be a non-empty plain object')
    }
    return await this.client.request<UpdateResult>('PUT', `/v5/classes/${this.name}/one`, {
      filter,
      body,
    })
  }

  /**
   * Find one document matching the filter.
   *
   * @param filter - Query filter
   * @returns Response with the found document (or null if not found)
   *
   * @example
   * ```ts
   * const { data } = await client.db.collection('users').findOne({ name: 'Alice' })
   * ```
   */
  async findOne(filter: Record<string, unknown>): Promise<ApiResponse<FindResult>> {
    if (!isNonEmptyObject(filter)) {
      throw new TypeError('findOne filter must be a non-empty plain object')
    }
    return await this.client.request<FindResult>('POST', `/v5/classes/${this.name}/one`, filter)
  }

  // ==================== Bulk Operations ====================

  /**
   * Insert multiple documents into the collection.
   *
   * @param dataList - Array of document data (each must be a non-empty plain object)
   * @returns Response with inserted ObjectIDs and count
   *
   * @example
   * ```ts
   * const { data } = await client.db.collection('users').insertMany([
   *   { name: 'Alice', age: 25 },
   *   { name: 'Bob', age: 30 },
   * ])
   * console.log(data.insertedCount) // 2
   * ```
   */
  async insertMany(dataList: Record<string, unknown>[]): Promise<ApiResponse<InsertManyResult>> {
    if (!isNonEmptyArrayWithNonEmptyObjects(dataList)) {
      throw new TypeError(
        'insertMany dataList must be a non-empty array of non-empty plain objects'
      )
    }
    return await this.client.request<InsertManyResult>(
      'POST',
      `/v5/classes/${this.name}/many`,
      dataList
    )
  }

  /**
   * Delete multiple documents matching the filter.
   *
   * @param filter - Query filter (can be an empty object to match all)
   * @returns Response with deleted count
   *
   * @example
   * ```ts
   * const { data } = await client.db.collection('users').deleteMany({ age: { $lt: 18 } })
   * console.log(data.deletedCount) // 5
   * ```
   */
  async deleteMany(filter: Record<string, unknown>): Promise<ApiResponse<DeleteManyResult>> {
    if (!isPlainObject(filter)) {
      throw new TypeError('deleteMany filter must be a plain object')
    }
    return await this.client.request<DeleteManyResult>(
      'DELETE',
      `/v5/classes/${this.name}/many`,
      filter
    )
  }

  /**
   * Update multiple documents matching the filter.
   *
   * @param filter - Query filter to match documents
   * @param body - Update data (MongoDB update operators)
   * @returns Response with modified count
   *
   * @example
   * ```ts
   * await client.db.collection('users').updateMany(
   *   { status: 'inactive' },
   *   { $set: { status: 'archived' } }
   * )
   * ```
   */
  async updateMany(
    filter: Record<string, unknown>,
    body: Record<string, unknown>
  ): Promise<ApiResponse<UpdateManyResult>> {
    if (!isPlainObject(filter)) {
      throw new TypeError('updateMany filter must be a plain object')
    }
    if (!isNonEmptyObject(body)) {
      throw new TypeError('updateMany body must be a non-empty plain object')
    }
    return await this.client.request<UpdateManyResult>('PUT', `/v5/classes/${this.name}/many`, {
      filter,
      body,
    })
  }

  // ==================== Advanced Queries ====================

  /**
   * Paginated find query with sorting and filtering.
   *
   * @param page - Page number (1-based, default: 1)
   * @param size - Page size (1-100, default: 10)
   * @param sort - Sort specification, e.g. `{ createdAt: -1 }` for newest first
   * @param filter - Query filter
   * @returns Response with paginated results and pagination metadata
   *
   * @example
   * ```ts
   * const { data } = await client.db.collection('users').find(
   *   1,        // page
   *   20,       // size
   *   { createdAt: -1 },  // sort (newest first)
   *   { age: { $gte: 18 } }  // filter
   * )
   * console.log(data.results)        // Array of documents
   * console.log(data.pagination)     // { totalItems: 100, totalPages: 5 }
   * ```
   */
  async find(
    page: number = 1,
    size: number = 10,
    sort: Record<string, number> = { createdAt: -1 },
    filter: Record<string, unknown> = {}
  ): Promise<ApiResponse<PaginationResult>> {
    if (!Number.isInteger(page) || page < 1) {
      throw new TypeError('find page must be a positive integer')
    }
    if (!Number.isInteger(size) || size < 1) {
      throw new TypeError('find size must be a positive integer')
    }
    if (size > MAX_PAGE_SIZE) {
      size = MAX_PAGE_SIZE
    }
    if (!isNonEmptyObject(sort)) {
      throw new TypeError('find sort must be a non-empty plain object')
    }
    if (!isPlainObject(filter)) {
      throw new TypeError('find filter must be a plain object')
    }

    return await this.client.request<PaginationResult>('POST', `/v5/classes/${this.name}/find`, {
      page,
      size,
      sort,
      filter,
    })
  }

  /**
   * Execute a MongoDB aggregation pipeline.
   *
   * @param pipeline - Array of aggregation stages
   * @returns Response with aggregation results
   *
   * @example
   * ```ts
   * const { data } = await client.db.collection('orders').aggregate([
   *   { $match: { status: 'completed' } },
   *   { $group: { _id: '$category', total: { $sum: '$amount' } } },
   *   { $sort: { total: -1 } },
   * ])
   * ```
   */
  async aggregate(pipeline: Record<string, unknown>[]): Promise<ApiResponse<AggregateResult>> {
    if (!Array.isArray(pipeline)) {
      throw new TypeError('aggregate pipeline must be an array')
    }
    return await this.client.request<AggregateResult>(
      'POST',
      `/v5/classes/${this.name}/aggregate`,
      pipeline
    )
  }

  /**
   * Count documents matching a filter.
   *
   * Uses `POST /v5/classes/:name/count` with the filter as the request body.
   *
   * @param filter - Query filter (can be an empty object for total count)
   * @returns Response with `data.count`
   *
   * @example
   * ```ts
   * const { data } = await client.db.collection('users').count({ status: 'active' })
   * console.log(data.count) // 42
   * ```
   */
  async count(filter: Record<string, unknown> = {}): Promise<ApiResponse<{ count: number }>> {
    if (!isPlainObject(filter)) {
      throw new TypeError('count filter must be a plain object')
    }
    return await this.client.request<{ count: number }>(
      'POST',
      `/v5/classes/${this.name}/count`,
      filter
    )
  }

  /**
   * Get distinct values for a field, optionally filtered.
   *
   * Uses `POST /v5/classes/:name/distinct/:field` with the filter as the request body.
   *
   * @param fieldName - The field to get distinct values for
   * @param filter - Optional filter to narrow the documents
   * @returns Response with `data.results` containing distinct values
   *
   * @example
   * ```ts
   * const { data } = await client.db.collection('users').distinct('city')
   * console.log(data.results) // ['Beijing', 'Shanghai', ...]
   * ```
   */
  async distinct(
    fieldName: string,
    filter: Record<string, unknown> = {}
  ): Promise<ApiResponse<{ results: unknown[] }>> {
    if (typeof fieldName !== 'string' || fieldName.length === 0) {
      throw new TypeError('distinct fieldName must be a non-empty string')
    }
    if (!isPlainObject(filter)) {
      throw new TypeError('distinct filter must be a plain object')
    }
    return await this.client.request<{ results: unknown[] }>(
      'POST',
      `/v5/classes/${this.name}/distinct/${encodeURIComponent(fieldName)}`,
      filter
    )
  }

  // ==================== Schema Management ====================

  /**
   * Create this collection (table) in the application's database.
   *
   * @example
   * ```ts
   * await client.db.collection('posts').create()
   * ```
   */
  async create(): Promise<ApiResponse> {
    return await this.client.request('POST', `/v5/schemas/${encodeURIComponent(this.name)}`)
  }

  /**
   * Clear all documents from this collection without dropping it.
   *
   * @returns Response with `data.deletedCount`
   *
   * @example
   * ```ts
   * const { data } = await client.db.collection('temp').clear()
   * console.log(data.deletedCount) // 150
   * ```
   */
  async clear(): Promise<ApiResponse<{ deletedCount: number }>> {
    return await this.client.request<{ deletedCount: number }>(
      'PUT',
      `/v5/schemas/${encodeURIComponent(this.name)}`
    )
  }

  /**
   * Drop (delete) this collection entirely.
   *
   * @example
   * ```ts
   * await client.db.collection('old_collection').drop()
   * ```
   */
  async drop(): Promise<ApiResponse> {
    return await this.client.request('DELETE', `/v5/schemas/${encodeURIComponent(this.name)}`)
  }
}

export default T1Collection
