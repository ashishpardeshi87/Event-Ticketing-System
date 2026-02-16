/**
 * Redis client - connects only if REDIS_URL is set (e.g. on Render with Redis addon).
 * If not set, cache is a no-op and app works without Redis.
 */
let client = null
let isAvailable = false
let connectPromise = null

const DEFAULT_TTL_SEC = 60 // 1 minute for list/detail caches

export async function getRedisClient() {
  if (client && isAvailable) return { client, isAvailable }
  if (!process.env.REDIS_URL) return { client: null, isAvailable: false }
  if (connectPromise) return connectPromise
  connectPromise = (async () => {
    try {
      const { createClient } = await import('redis')
      const c = createClient({ url: process.env.REDIS_URL })
      c.on('error', (err) => console.warn('[Redis]', err.message))
      await c.connect()
      client = c
      isAvailable = true
      console.log('✅ Redis connected')
      return { client, isAvailable }
    } catch (err) {
      console.warn('[Redis] Connection failed:', err.message)
      connectPromise = null
      return { client: null, isAvailable: false }
    }
  })()
  return connectPromise
}

export async function cacheGet(key) {
  const { client: c, isAvailable: ok } = await getRedisClient()
  if (!ok || !c) return null
  try {
    const val = await c.get(key)
    return val ? JSON.parse(val) : null
  } catch {
    return null
  }
}

export async function cacheSet(key, value, ttlSec = DEFAULT_TTL_SEC) {
  const { client: c, isAvailable: ok } = await getRedisClient()
  if (!ok || !c) return
  try {
    await c.setEx(key, ttlSec, JSON.stringify(value))
  } catch (err) {
    console.warn('[Redis] set failed:', err.message)
  }
}

export async function cacheDel(keyOrPattern) {
  const { client: c, isAvailable: ok } = await getRedisClient()
  if (!ok || !c) return
  try {
    if (keyOrPattern.includes('*')) {
      const keys = await c.keys(keyOrPattern)
      if (keys.length) await c.del(keys)
    } else {
      await c.del(keyOrPattern)
    }
  } catch (err) {
    console.warn('[Redis] del failed:', err.message)
  }
}

export function isRedisAvailable() {
  return isAvailable
}
