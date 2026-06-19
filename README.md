# t1yOS SDK for JavaScript/TypeScript

[中文文档](./README.zh-CN.md)

[t1yOS](https://www.t1y.net) Serverless Platform JavaScript/TypeScript SDK — cloud database, metadata, and cloud functions client.

## Installation

### npm / pnpm / yarn

```bash
npm install t1y-sdk-js
# or
pnpm add t1y-sdk-js
# or
yarn add t1y-sdk-js
```

### Script Tag (Browser)

```html
<script src="https://unpkg.com/t1y-sdk-js/dist/umd/t1y.min.js"></script>
<script>
  const client = new T1Y.T1YOS({ appId: 1001, apiKey: '...', secretKey: '...' })
</script>
```

## Quick Start

```ts
import { T1YOS, timeNow } from 't1y-sdk-js'

// 1. Create client
const client = new T1YOS({
  appId: 1001, // Required: your application ID (>= 1001)
  apiKey: '4fd7448cdc684431a62d8a0111dc69', // Required: 32-character API Key
  secretKey: '17b784e359c946ffa65eebbf9ce29', // Required: 32-character Secret Key
  // Optional with defaults:
  // baseUrl: 'https://myapp.t1y.net',
  // version: 0,
  // isSafeMode: false,
  // timeFormat: 'YYYY-MM-DD HH:mm:ss',
  // offset: 0,
})

// 2. Initialize (syncs time offset and safe mode with server)
await client.init()

// 3. Use the database!
await client.db.collection('users').insertOne({
  name: 'Alice',
  age: 25,
  active: true,
  customTimeAt: timeNow.Now(),
})
```

## Database Operations

### Single Document

```ts
const db = client.db.collection('users')

// Insert one
const { data } = await db.insertOne({ name: 'Alice', age: 25 })
console.log(data.objectId) // '507f1f77bcf86cd799439011'

// Find by ObjectID
const { data: findResult } = await db.findById('507f1f77bcf86cd799439011')
console.log(findResult.result) // { _id: '507f1f77...', name: 'Alice', ... }

// Update by ObjectID
await db.updateById('507f1f77bcf86cd799439011', { age: 26 })

// Delete by ObjectID
await db.deleteById('507f1f77bcf86cd799439011')
```

### Filter-based Operations

```ts
// Find one by filter
const { data } = await db.findOne({ name: 'Alice' })

// Update one by filter
await db.updateOne(
  { name: 'Alice' }, // filter
  { $set: { age: 27 } } // update body
)

// Delete one by filter
await db.deleteOne({ name: 'Alice' })
```

### Bulk Operations

```ts
// Insert many
const { data } = await db.insertMany([
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 },
])
console.log(data.insertedCount) // 2

// Delete many
await db.deleteMany({ age: { $lt: 18 } })

// Update many
await db.updateMany({ status: 'inactive' }, { $set: { status: 'archived' } })
```

### Advanced Queries

```ts
// Paginated find
const { data } = await db.find(
  1, // page (1-based)
  20, // page size (max 100)
  { createdAt: -1 }, // sort (newest first)
  { age: { $gte: 18 } } // filter
)
console.log(data.results) // Array of documents
console.log(data.pagination) // { totalItems: 42, totalPages: 3 }

// Aggregation pipeline
const { data } = await db.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: '$category', total: { $sum: '$amount' } } },
  { $sort: { total: -1 } },
])

// Count
const { data: countData } = await client.db.collection('users').count({ status: 'active' })
console.log(countData.count)

// Distinct values
const { data: distinctData } = await client.db.collection('users').distinct('city')
// With filter
const { data: filteredDistinct } = await client.db
  .collection('users')
  .distinct('city', { country: 'China' })
```

### Schema Management

```ts
// Get all collections
const { data } = await client.db.getCollections()
console.log(data.results) // ['users', 'orders', 'products']

// Create a collection
await client.db.collection('posts').create()

// Clear a collection
const { data: clearResult } = await client.db.collection('posts').clear()
console.log(clearResult.deletedCount)

// Drop a collection
await client.db.collection('posts').drop()
```

## Special Types

The SDK provides helper functions that produce server-recognized type markers:

```ts
import {
  ObjectID,
  Date,
  DateTime,
  Timestamp,
  Boolean,
  Integer,
  Bigint,
  Float,
  Double,
  Array,
  Map,
  MapArray,
  Null,
  None,
  Nil,
  timeNow,
} from 't1y-sdk-js'

await db.insertOne({
  // ObjectID reference
  userId: ObjectID('507f1f77bcf86cd799439011'),

  // Date types
  birthday: Date('2000-01-01T00:00:00Z'),
  eventTime: DateTime('2024-06-15T14:30:00Z'),
  loginAt: Timestamp(1705312200),

  // Numeric types
  active: Boolean(true),
  quantity: Integer(42),
  bigNumber: Bigint(9007199254740991),
  rating: Float(4.5),
  preciseValue: Double(3.141592653589793),

  // Structured types
  tags: Array(['javascript', 'typescript']),
  metadata: Map({ theme: 'dark', lang: 'en' }),
  history: MapArray([{ action: 'login' }, { action: 'logout' }]),

  // Null values
  deletedAt: Null, // server converts to nil
  middleName: None, // server converts to nil

  // Server-time helpers
  customTimeAt: timeNow.Now(), // server's time.Now()
  unixCreatedAt: timeNow.NowUnix(), // server's time.Now().Unix()
})
```

## Metadata

```ts
// Get all metadata
const { data } = await client.getMeta()
console.log(data.results) // { version: 1, collections: [...], ... }

// Get specific field
const { data: versionData } = await client.getMeta('version')
console.log(versionData.result) // 1

// Check for updates
const hasUpdate = await client.checkUpdate()
```

## Cloud Functions

```ts
// Call a .jsc cloud function
const { data } = await client.callFunc('hello', { name: 'World' })

// With safe mode enabled for this specific call
const { data: safeData } = await client.callFunc('secureFunc', params, true)
```

## Security

### Authentication Headers

Every request includes:

- `X-T1Y-Application-ID` — Your application ID
- `X-T1Y-API-Key` — Your 32-character API key
- `X-T1Y-Safe-Timestamp` — Unix timestamp (UTC + time offset from init)
- `X-T1Y-Safe-Sign` — HMAC-SHA256 signature (64 hex chars)

### Signature Algorithm

```
message = METHOD + "\n" + URL_PATH + "\n" + SHA256(body) + "\n" + appId + "\n" + timestamp
signature = HMAC-SHA256(secretKey, message)
```

### Safe Mode (AES-256-GCM)

When safe mode is enabled (via `isSafeMode: true` or auto-detected from init), request bodies are encrypted with AES-256-GCM using your SecretKey, and server responses are decrypted automatically.

## API Reference

### T1YOS

| Method                                        | Description                                        |
| --------------------------------------------- | -------------------------------------------------- |
| `new T1YOS(config)`                           | Create client (validates appId, apiKey, secretKey) |
| `init()`                                      | Sync time offset and safe mode with server         |
| `db.collection(name)`                         | Get a collection instance (chainable)              |
| `db.toObjectID(id)`                           | Create ObjectID marker string                      |
| `db.getCollections()`                         | List all collections                               |
| `getMeta(field?)`                             | Get application metadata                           |
| `checkUpdate()`                               | Check if newer version exists                      |
| `callFunc(name, params?, safeMode?)`          | Call a cloud function                              |
| `request(method, path, params?, encryption?)` | Raw authenticated request                          |

### T1Collection

| Method                           | HTTP   | Endpoint                            |
| -------------------------------- | ------ | ----------------------------------- |
| `insertOne(data)`                | POST   | `/v5/classes/:name`                 |
| `deleteById(objectId)`           | DELETE | `/v5/classes/:name/:objectId`       |
| `updateById(objectId, data)`     | PUT    | `/v5/classes/:name/:objectId`       |
| `findById(objectId)`             | GET    | `/v5/classes/:name/:objectId`       |
| `deleteOne(filter)`              | DELETE | `/v5/classes/:name/one`             |
| `updateOne(filter, body)`        | PUT    | `/v5/classes/:name/one`             |
| `findOne(filter)`                | POST   | `/v5/classes/:name/one`             |
| `insertMany(dataList)`           | POST   | `/v5/classes/:name/many`            |
| `deleteMany(filter)`             | DELETE | `/v5/classes/:name/many`            |
| `updateMany(filter, body)`       | PUT    | `/v5/classes/:name/many`            |
| `find(page, size, sort, filter)` | POST   | `/v5/classes/:name/find`            |
| `aggregate(pipeline)`            | POST   | `/v5/classes/:name/aggregate`       |
| `count(filter?)`                 | POST   | `/v5/classes/:name/count`           |
| `distinct(fieldName, filter?)`   | POST   | `/v5/classes/:name/distinct/:field` |
| `create()`                       | POST   | `/v5/schemas/:name`                 |
| `clear()`                        | PUT    | `/v5/schemas/:name`                 |
| `drop()`                         | DELETE | `/v5/schemas/:name`                 |

T1YOS `db` object also provides:

| Method                | HTTP | Endpoint      |
| --------------------- | ---- | ------------- |
| `db.getCollections()` | GET  | `/v5/schemas` |

## License

MIT

Copyright (c) 2024 华易云联（杭州）网络科技有限责任公司
