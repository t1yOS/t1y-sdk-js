# t1yOS SDK for JavaScript/TypeScript

[中文文档](./README.zh-CN.md)

[t1yOS](https://www.t1y.net) Serverless Platform JavaScript/TypeScript SDK — cloud database, metadata, and cloud functions client.

## Platform Support

| Platform                            | Supported | Transport API   | Notes                            |
| ----------------------------------- | --------- | --------------- | -------------------------------- |
| Web / Vue / React / HTML            | ✅        | `fetch`         | Modern browsers                  |
| Node.js                             | ✅        | `fetch` (18+)   | Via native `fetch` API           |
| React Native                        | ✅        | `fetch`         | Via native `fetch` API           |
| WeChat Mini Program（微信小程序）   | ✅        | `wx.request`    | Auto-detected                    |
| QQ Mini Program（QQ 小程序）        | ✅        | `qq.request`    | Auto-detected as WeChat family   |
| Toutiao Mini Program（头条小程序）  | ✅        | `tt.request`    | Auto-detected as WeChat family   |
| Douyin Mini Program（抖音小程序）   | ✅        | `tt.request`    | Auto-detected as WeChat family   |
| Alipay Mini Program（支付宝小程序） | ✅        | `my.request`    | Auto-detected                    |
| Quick App（快应用）                 | ✅        | `@system.fetch` | Via build-time module resolution |

> **Note:** The SDK automatically detects the runtime environment and uses the appropriate request API. No manual configuration is needed — the same code works across all platforms.

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

### Mini Program（小程序）

**WeChat / QQ / Toutiao / Douyin Mini Programs:**

1. Install via npm in your mini program project:

   ```bash
   npm install t1y-sdk-js
   ```

2. Build the npm package in the mini program IDE:
   - WeChat: `Tools → Build npm`
   - QQ / Toutiao / Douyin: Similar option in their respective IDEs

3. Import and use:

   ```ts
   import { T1YOS, timeNow } from 't1y-sdk-js'

   const client = new T1YOS({
     appId: 1001,
     apiKey: 'your-api-key-32-characters',
     secretKey: 'your-secret-key-32-characters',
   })

   await client.init()
   // ... use database operations
   ```

> **Note:** Mini programs require `baseUrl` to be configured in the mini program's **domain allowlist** (服务器域名白名单). Go to the mini program admin panel → Development → Server Domain, and add your t1yOS domain (e.g., `https://myapp.t1y.net`).

**Alipay Mini Program:**

Same as above — the SDK auto-detects the Alipay environment and uses `my.request` instead of `wx.request`. Configure the domain allowlist in the Alipay Developer Console.

### Quick App（快应用）

1. Install via npm:

   ```bash
   npm install t1y-sdk-js
   ```

2. Import and use in your Quick App project:

   ```ts
   import { T1YOS } from 't1y-sdk-js'

   const client = new T1YOS({
     appId: 1001,
     apiKey: 'your-api-key-32-characters',
     secretKey: 'your-secret-key-32-characters',
   })

   await client.init()
   ```

> **Note:** Quick App's hap-toolkit will automatically resolve the `@system.fetch` module dependency during build. No additional configuration is required.

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
await db.updateById('507f1f77bcf86cd799439011', { $set: { age: 26 } })

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

## Platform Detection

The SDK exposes utilities to detect the current runtime environment:

```ts
import { getPlatformType, getMiniProgramSubType } from 't1y-sdk-js'

// Returns 'h5' | 'wx' | 'my' | 'hap' | 'nodejs' | 'unknown'
const platform = getPlatformType()

// Within the 'wx' family, returns 'wechat' | 'qq' | 'toutiao' | 'unknown'
const subType = getMiniProgramSubType()

console.log(platform) // e.g., 'wx' in WeChat Mini Program
console.log(subType) // e.g., 'toutiao' in Toutiao Mini Program
```

### Crypto Availability

```ts
import { isAESGCMAvailable, isWebCryptoAvailable } from 't1y-sdk-js'

// Always returns true — pure-JS AES-256-GCM fallback is always available
console.log(isAESGCMAvailable()) // true

// Check if the faster native Web Crypto API is available
console.log(isWebCryptoAvailable()) // true in browsers/Node.js, false in mini programs
```

The SDK uses **Web Crypto API** when available (faster, hardware-accelerated in browsers/Node.js), and automatically falls back to a **pure JavaScript AES-256-GCM** implementation in environments without Web Crypto (mini programs, Quick App). This ensures safe mode encryption works on all platforms.

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

Copyright (c) 2026 华易云联（杭州）网络科技有限责任公司
