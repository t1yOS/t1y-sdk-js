/**
 * t1yOS SDK — Node.js Example
 *
 * Usage:
 *   node examples/node/example.mjs
 *
 * Requirements:
 *   Node.js >= 18.0.0
 */

import { T1YOS, ObjectID, timeNow } from '../../dist/index.mjs'

async function main() {
  // 1. Create and initialize the client
  const client = new T1YOS({
    appId: 1001,
    apiKey: 'bfb15e6061e1430799302b9284df886f',
    secretKey: '80024f51c0dd403f815d57f51075b0b2',
    // baseUrl: 'http://localhost:8082', // For local development
  })

  console.log('Initializing SDK...')
  try {
    await client.init()
    console.log('SDK initialized successfully')
  } catch (err) {
    console.warn('Init failed (server may not be running):', err.message)
  }

  const users = client.db.collection('users')

  // 2. Insert a document
  console.log('\n--- Insert ---')
  try {
    const insertRes = await users.insertOne({
      name: 'WangHua',
      email: 'wwwanghua@outlook.com',
      age: 23,
      tags: ['developer', 'tester'],
      customTimeAt: timeNow.Now(),
    })
    console.log('Inserted:', insertRes.data.objectId)
  } catch (err) {
    console.error('Insert failed:', err.message)
  }

  // 3. Find documents
  console.log('\n--- Find ---')
  try {
    const findRes = await users.find(1, 10, { createdAt: -1 }, {})
    console.log(`Found ${findRes.data.pagination.totalItems} documents`)
    console.log('Results:', JSON.stringify(findRes.data.results.slice(0, 3), null, 2))
  } catch (err) {
    console.error('Find failed:', err.message)
  }

  // 4. Aggregation
  console.log('\n--- Aggregate ---')
  try {
    const aggRes = await users.aggregate([
      { $group: { _id: null, count: { $sum: 1 }, avgAge: { $avg: '$age' } } },
    ])
    console.log('Aggregation results:', JSON.stringify(aggRes.data.results, null, 2))
  } catch (err) {
    console.error('Aggregate failed:', err.message)
  }

  // 5. Get metadata
  console.log('\n--- Meta ---')
  try {
    const metaRes = await client.getMeta()
    console.log('Metadata:', metaRes.data.results)
  } catch (err) {
    console.error('Meta failed:', err.message)
  }

  // 6. Call cloud function
  console.log('\n--- Cloud Function ---')
  try {
    const callback = await client.callFunc('/hello.jsc')
    console.log('Callback:', callback)
  } catch (err) {
    console.error('Call cloud function failed:', err.message)
  }

  console.log('\nExample complete')
}

main().catch(console.error)
