import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type HitRecord = { count: number; windowStart: number }

const memoryBuckets = new Map<string, HitRecord>()
const limiterCache = new Map<string, Ratelimit>()
const warnedKeys = new Set<string>()

let redisClient: Redis | null = null
let redisInitFailed = false

export function headerValue(headers: Record<string, string | string[] | undefined> | undefined, key: string) {
  const value = headers?.[key] ?? headers?.[key.toLowerCase()]
  return Array.isArray(value) ? value[0] : value ?? ''
}

export function getClientIp(headers: Record<string, string | string[] | undefined> | undefined) {
  const forwarded = headerValue(headers, 'x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown'
  }

  return headerValue(headers, 'x-real-ip') || 'unknown'
}

function env(name: string) {
  return process.env[name] ?? ''
}

export function isDistributedRateLimitConfigured() {
  return Boolean(env('UPSTASH_REDIS_REST_URL') && env('UPSTASH_REDIS_REST_TOKEN'))
}

function isProductionRuntime() {
  return process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production'
}

/** Log each distinct degradation once per isolate so warnings stay readable under load. */
function warnOnce(key: string, message: string, error?: unknown) {
  if (warnedKeys.has(key)) {
    return
  }

  warnedKeys.add(key)
  if (error === undefined) {
    console.error(message)
    return
  }

  console.error(message, error)
}

function memoryHit(key: string, maxHits: number, windowMs: number) {
  const now = Date.now()
  const current = memoryBuckets.get(key)

  if (!current || now - current.windowStart > windowMs) {
    memoryBuckets.set(key, { count: 1, windowStart: now })
    return false
  }

  current.count += 1
  memoryBuckets.set(key, current)
  return current.count > maxHits
}

function getRedis() {
  if (redisInitFailed) {
    return null
  }

  if (redisClient) {
    return redisClient
  }

  if (!isDistributedRateLimitConfigured()) {
    return null
  }

  try {
    redisClient = new Redis({
      url: env('UPSTASH_REDIS_REST_URL'),
      token: env('UPSTASH_REDIS_REST_TOKEN'),
      enableAutoPipelining: true,
    })
    return redisClient
  } catch (error) {
    redisInitFailed = true
    warnOnce('redis-init', '[rate-limit] Upstash Redis client could not be created; using per-isolate memory limits.', error)
    return null
  }
}

function toDuration(windowMs: number): `${number} ms` {
  return `${Math.max(1_000, Math.floor(windowMs))} ms`
}

function getLimiter(bucket: string, maxHits: number, windowMs: number) {
  const cacheKey = `${bucket}:${maxHits}:${windowMs}`
  const cached = limiterCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const redis = getRedis()
  if (!redis) {
    return null
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(maxHits, toDuration(windowMs)),
    prefix: `rl:${bucket}`,
    analytics: false,
    // Short-circuits repeat offenders inside the same isolate without a Redis round trip.
    ephemeralCache: new Map<string, number>(),
  })

  limiterCache.set(cacheKey, limiter)
  return limiter
}

/**
 * Sliding-window limiter shared across every Vercel isolate via Upstash Redis.
 *
 * Degrades to a per-isolate in-memory window when `UPSTASH_REDIS_REST_URL` /
 * `UPSTASH_REDIS_REST_TOKEN` are unset or Redis is unreachable, so local
 * `npm run dev` and transient Upstash outages never fail a customer request.
 * The identifier is normally the client IP, but any stable string works
 * (order id, transaction id) for per-resource limits.
 */
export function createRateLimiter(maxHits: number, windowMs = 60_000, bucket = 'api') {
  const safeBucket = bucket.replace(/[^a-z0-9:_-]/gi, '_') || 'api'

  return async function isRateLimited(identifier: string) {
    const client = (identifier || 'unknown').slice(0, 128)
    const limiter = getLimiter(safeBucket, maxHits, windowMs)

    if (limiter) {
      try {
        const { success } = await limiter.limit(client)
        return !success
      } catch (error) {
        warnOnce(
          `limit:${safeBucket}`,
          `[rate-limit] Upstash unreachable for bucket "${safeBucket}"; falling back to per-isolate memory limits.`,
          error,
        )
      }
    } else if (isProductionRuntime()) {
      warnOnce(
        'missing-env',
        '[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN unset in production — limits are per-isolate only.',
      )
    }

    return memoryHit(`rl:${safeBucket}:${client}`, maxHits, windowMs)
  }
}
