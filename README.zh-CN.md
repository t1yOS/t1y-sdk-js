# t1yOS SDK for JavaScript/TypeScript

[English](./README.md)

[t1yOS](https://www.t1y.net) Serverless 平台 JavaScript/TypeScript SDK — 云数据库、元数据和云函数客户端。

## 平台支持

| 平台                     | 支持 | 传输 API        | 说明                       |
| ------------------------ | ---- | --------------- | -------------------------- |
| Web / Vue / React / HTML | ✅   | `fetch`         | 现代浏览器                 |
| Node.js                  | ✅   | `fetch` (18+)   | 使用原生 `fetch` API       |
| React Native             | ✅   | `fetch`         | 使用原生 `fetch` API       |
| 微信小程序               | ✅   | `wx.request`    | 自动检测                   |
| QQ 小程序                | ✅   | `qq.request`    | 自动检测（微信小程序系列） |
| 头条小程序               | ✅   | `tt.request`    | 自动检测（微信小程序系列） |
| 抖音小程序               | ✅   | `tt.request`    | 自动检测（微信小程序系列） |
| 支付宝小程序             | ✅   | `my.request`    | 自动检测                   |
| 快应用                   | ✅   | `@system.fetch` | 构建时模块解析             |

> **注意：** SDK 会自动检测运行环境并使用对应的请求 API，无需手动配置——同一套代码在所有平台都能运行。

## 安装

### npm / pnpm / yarn

```bash
npm install t1y-sdk-js
# 或
pnpm add t1y-sdk-js
# 或
yarn add t1y-sdk-js
```

### Script 标签（浏览器）

```html
<script src="https://unpkg.com/t1y-sdk-js/dist/umd/t1y.min.js"></script>
<script>
  const client = new T1Y.T1YOS({ appId: 1001, apiKey: '...', secretKey: '...' })
</script>
```

### 小程序

**微信 / QQ / 头条 / 抖音小程序：**

1. 在小程序项目中通过 npm 安装：

   ```bash
   npm install t1y-sdk-js
   ```

2. 在开发者工具中构建 npm：
   - 微信：`工具 → 构建 npm`
   - QQ / 头条 / 抖音：在各自开发者工具中类似操作

3. 引入并使用：

   ```ts
   import { T1YOS, timeNow } from 't1y-sdk-js'

   const client = new T1YOS({
     appId: 1001,
     apiKey: '32位API-Key',
     secretKey: '32位Secret-Key',
   })

   await client.init()
   // ... 使用数据库操作
   ```

> **注意：** 小程序需要将 `baseUrl` 配置到**服务器域名白名单**中。前往小程序管理后台 → 开发 → 服务器域名，添加你的 t1yOS 域名（例如 `https://myapp.t1y.net`）。

**支付宝小程序：**

操作同上——SDK 会自动检测支付宝环境并使用 `my.request` 代替 `wx.request`。在支付宝开发者控制台中配置域名白名单即可。

### 快应用

1. 通过 npm 安装：

   ```bash
   npm install t1y-sdk-js
   ```

2. 在快应用项目中引入并使用：

   ```ts
   import { T1YOS } from 't1y-sdk-js'

   const client = new T1YOS({
     appId: 1001,
     apiKey: '32位API-Key',
     secretKey: '32位Secret-Key',
   })

   await client.init()
   ```

> **注意：** 快应用的 hap-toolkit 会在构建时自动解析 `@system.fetch` 模块依赖，无需额外配置。

## 快速开始

```ts
import { T1YOS, timeNow } from 't1y-sdk-js'

// 1. 创建客户端
const client = new T1YOS({
  appId: 1001, // 必填：应用 ID（>= 1001）
  apiKey: '4fd7448cdc684431a62d8a0111dc69', // 必填：32 位 API Key
  secretKey: '17b784e359c946ffa65eebbf9ce29', // 必填：32 位 Secret Key
  // 以下参数可选（均有默认值）：
  // baseUrl: 'https://myapp.t1y.net',
  // version: 0,
  // isSafeMode: false,
  // timeFormat: 'YYYY-MM-DD HH:mm:ss',
  // offset: 0,
})

// 2. 初始化（与服务器同步时间偏移和安全模式）
await client.init()

// 3. 开始使用数据库！
await client.db.collection('users').insertOne({
  name: '张三',
  age: 25,
  active: true,
  customTimeAt: timeNow.Now(),
})
```

## 数据库操作

### 单条操作

```ts
const db = client.db.collection('users')

// 插入一条
const { data } = await db.insertOne({ name: '张三', age: 25 })
console.log(data.objectId) // '507f1f77bcf86cd799439011'

// 通过 ObjectID 查询
const { data: findResult } = await db.findById('507f1f77bcf86cd799439011')
console.log(findResult.result) // { _id: '507f1f77...', name: '张三', ... }

// 通过 ObjectID 更新
await db.updateById('507f1f77bcf86cd799439011', { $set: { age: 26 } })

// 通过 ObjectID 删除
await db.deleteById('507f1f77bcf86cd799439011')
```

### 条件操作

```ts
// 条件查询一条
const { data } = await db.findOne({ name: '张三' })

// 条件更新一条
await db.updateOne(
  { name: '张三' }, // 查询条件
  { $set: { age: 27 } } // 更新内容
)

// 条件删除一条
await db.deleteOne({ name: '张三' })
```

### 批量操作

```ts
// 插入多条
const { data } = await db.insertMany([
  { name: '张三', age: 25 },
  { name: '李四', age: 30 },
])
console.log(data.insertedCount) // 2

// 删除多条
await db.deleteMany({ age: { $lt: 18 } })

// 更新多条
await db.updateMany({ status: 'inactive' }, { $set: { status: 'archived' } })
```

### 高级查询

```ts
// 分页查询
const { data } = await db.find(
  1, // 页码（从 1 开始）
  20, // 每页条数（最大 100）
  { createdAt: -1 }, // 排序（按创建时间倒序）
  { age: { $gte: 18 } } // 查询条件
)
console.log(data.results) // 文档数组
console.log(data.pagination) // { totalItems: 42, totalPages: 3 }

// 聚合查询
const { data } = await db.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: '$category', total: { $sum: '$amount' } } },
  { $sort: { total: -1 } },
])

// 计数
const { data: countData } = await client.db.collection('users').count({ status: 'active' })
console.log(countData.count)

// 去重查询
const { data: distinctData } = await client.db.collection('users').distinct('city')
// 带条件过滤
const { data: filteredDistinct } = await client.db
  .collection('users')
  .distinct('city', { country: 'China' })
```

### 表管理

```ts
// 获取所有表
const { data } = await client.db.getCollections()
console.log(data.results) // ['users', 'orders', 'products']

// 创建表
await client.db.collection('posts').create()

// 清空表
const { data: clearResult } = await client.db.collection('posts').clear()
console.log(clearResult.deletedCount)

// 删除表
await client.db.collection('posts').drop()
```

## 特殊类型

SDK 提供了一系列辅助函数，用于生成服务端可识别的类型标记：

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
  // ObjectID 引用
  userId: ObjectID('507f1f77bcf86cd799439011'),

  // 日期类型
  birthday: Date('2000-01-01T00:00:00Z'),
  eventTime: DateTime('2024-06-15T14:30:00Z'),
  loginAt: Timestamp(1705312200),

  // 数值类型
  active: Boolean(true),
  quantity: Integer(42),
  bigNumber: Bigint(9007199254740991),
  rating: Float(4.5),
  preciseValue: Double(3.141592653589793),

  // 结构化类型
  tags: Array(['javascript', 'typescript']),
  metadata: Map({ theme: 'dark', lang: 'zh' }),
  history: MapArray([{ action: 'login' }, { action: 'logout' }]),

  // 空值
  deletedAt: Null, // 服务端转为 nil
  middleName: None, // 服务端转为 nil

  // 服务端时间辅助
  customTimeAt: timeNow.Now(), // 服务端的 time.Now()
  unixCreatedAt: timeNow.NowUnix(), // 服务端的 time.Now().Unix()
})
```

## 元数据

```ts
// 获取全部元数据
const { data } = await client.getMeta()
console.log(data.results) // { version: 1, collections: [...], ... }

// 获取指定字段
const { data: versionData } = await client.getMeta('version')
console.log(versionData.result) // 1

// 检查更新
const hasUpdate = await client.checkUpdate()
```

## 云函数

```ts
// 调用 .jsc 云函数
const { data } = await client.callFunc('hello', { name: 'World' })

// 为此调用单独启用安全模式
const { data: safeData } = await client.callFunc('secureFunc', params, true)
```

## 安全机制

### 认证请求头

每个请求都会携带以下请求头：

- `X-T1Y-Application-ID` — 应用 ID
- `X-T1Y-API-Key` — 32 位 API Key
- `X-T1Y-Safe-Timestamp` — Unix 时间戳（UTC + 初始化时获取的时间偏移）
- `X-T1Y-Safe-Sign` — HMAC-SHA256 签名（64 位十六进制）

### 签名算法

```
message = METHOD + "\n" + URL_PATH + "\n" + SHA256(body) + "\n" + appId + "\n" + timestamp
signature = HMAC-SHA256(secretKey, message)
```

### 安全模式（AES-256-GCM）

当启用安全模式时（通过 `isSafeMode: true` 或初始化时自动检测），请求体将使用 AES-256-GCM 加密，密钥为应用的 SecretKey，服务端响应也会自动解密。

## 平台检测

SDK 暴露了检测当前运行环境的工具函数：

```ts
import { getPlatformType, getMiniProgramSubType } from 't1y-sdk-js'

// 返回 'h5' | 'wx' | 'my' | 'hap' | 'nodejs' | 'unknown'
const platform = getPlatformType()

// 在 'wx' 系列中，返回 'wechat' | 'qq' | 'toutiao' | 'unknown'
const subType = getMiniProgramSubType()

console.log(platform) // 例如在微信小程序中输出 'wx'
console.log(subType) // 例如在头条小程序中输出 'toutiao'
```

### 加密可用性检测

```ts
import { isAESGCMAvailable, isWebCryptoAvailable } from 't1y-sdk-js'

// 始终返回 true——纯 JS AES-256-GCM 降级方案始终可用
console.log(isAESGCMAvailable()) // true

// 检测是否有更快的原生 Web Crypto API（硬件加速）
console.log(isWebCryptoAvailable()) // 浏览器/Node.js 中为 true，小程序中为 false
```

SDK 优先使用 **Web Crypto API**（在浏览器/Node.js 中更快、硬件加速），在没有 Web Crypto 的环境（小程序、快应用）中自动降级为**纯 JavaScript AES-256-GCM** 实现。这确保安全模式加密在所有平台上都能正常工作。

## API 参考

### T1YOS

| 方法                                          | 说明                                        |
| --------------------------------------------- | ------------------------------------------- |
| `new T1YOS(config)`                           | 创建客户端（校验 appId、apiKey、secretKey） |
| `init()`                                      | 与服务端同步时间偏移和安全模式              |
| `db.collection(name)`                         | 获取集合操作实例（链式调用）                |
| `db.toObjectID(id)`                           | 创建 ObjectID 标记字符串                    |
| `db.getCollections()`                         | 获取所有表                                  |
| `getMeta(field?)`                             | 获取应用元数据                              |
| `checkUpdate()`                               | 检查是否存在新版本                          |
| `callFunc(name, params?, safeMode?)`          | 调用云函数                                  |
| `request(method, path, params?, encryption?)` | 原始认证请求                                |

### T1Collection

| 方法                             | HTTP   | 端点                                |
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

T1YOS `db` 对象还提供：

| 方法                  | HTTP | 端点          |
| --------------------- | ---- | ------------- |
| `db.getCollections()` | GET  | `/v5/schemas` |

## License

MIT

Copyright (c) 2026 华易云联（杭州）网络科技有限责任公司
