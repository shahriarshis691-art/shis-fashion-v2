type HitRecord = { count: number; windowStart: number }

const memoryBuckets = new Map<string, HitRecord>()

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

async function redisHit(key: string, maxHits: number, windowMs: number) {
  const base = env('UPSTASH_REDIS_REST_URL').replace(/\/+$/, '')
  const token = env('UPSTASH_REDIS_REST_TOKEN')
  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000))

  const response = await fetch(`${base}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', key],
      ['EXPIRE', key, String(ttlSeconds), 'NX'],
    ]),
  })

  if (!response.ok) {
    throw new Error(`upstash-http-${response.status}`)
  }

  const payload = await response.json() as Array<{ result?: unknown; error?: string }>
  if (!Array.isArray(payload) || payload[0]?.error) {
    throw new Error(payload[0]?.error || 'upstash-pipeline-failed')
  }

  const count = Number(payload[0]?.result)
  if (!Number.isFinite(count)) {
    throw new Error('upstash-incr-invalid')
  }

  return count > maxHits
}

/**
 * Distributed limiter via Upstash Redis REST (INCR + EXPIRE NX).
 * Falls back to process memory when KV env is unset or Redis errors,
 * so local `npm run dev` keeps working.
 */
export function createRateLimiter(maxHits: number, windowMs = 60_000, bucket = 'api') {
  const safeBucket = bucket.replace(/[^a-z0-9:_-]/gi, '_') || 'api'

  return async function isRateLimited(ip: string) {
    const client = (ip || 'unknown').slice(0, 128)
    const key = `rl:${safeBucket}:${client}`

    if (isDistributedRateLimitConfigured()) {
      try {
        return await redisHit(key, maxHits, windowMs)
      } catch (error) {
        console.error('[rate-limit] Upstash failed, using in-memory fallback', error)
      }
    } else if (process.env.VERCEL_ENV === 'production') {
      console.error('[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN unset in production')
    }

    return memoryHit(key, maxHits, windowMs)
  }
}
