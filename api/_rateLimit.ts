type HitRecord = { count: number; windowStart: number }

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

export function createRateLimiter(maxHits: number, windowMs = 60_000) {
  const ipHits = new Map<string, HitRecord>()

  return function isRateLimited(ip: string) {
    const now = Date.now()
    const current = ipHits.get(ip)

    if (!current || now - current.windowStart > windowMs) {
      ipHits.set(ip, { count: 1, windowStart: now })
      return false
    }

    current.count += 1
    ipHits.set(ip, current)
    return current.count > maxHits
  }
}
