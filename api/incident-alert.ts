interface LooseRequest {
  method?: string
  headers?: Record<string, string | string[] | undefined>
  body?: unknown
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  json: (payload: unknown) => void
}

interface AlertPayload {
  source?: string
  message?: string
  fatal?: boolean
  path?: string
  userAgent?: string
}

function readEnv(name: string) {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
  return env[name] ?? ''
}

function headerValue(headers: LooseRequest['headers'], key: string) {
  const value = headers?.[key] ?? headers?.[key.toLowerCase()]
  return Array.isArray(value) ? value[0] : value ?? ''
}

function sanitize(value: unknown, maxLength: number) {
  return String(value ?? '').trim().slice(0, maxLength)
}

function getClientIp(req: LooseRequest) {
  const forwarded = headerValue(req.headers, 'x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown'
  }

  return headerValue(req.headers, 'x-real-ip') || 'unknown'
}

const ipHits = new Map<string, { count: number; windowStart: number }>()

function isRateLimited(ip: string) {
  const now = Date.now()
  const windowMs = 60_000
  const maxHits = 20
  const current = ipHits.get(ip)

  if (!current || now - current.windowStart > windowMs) {
    ipHits.set(ip, { count: 1, windowStart: now })
    return false
  }

  current.count += 1
  if (current.count > maxHits) {
    return true
  }

  ipHits.set(ip, current)
  return false
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const webhookUrl = readEnv('INCIDENT_ALERT_WEBHOOK_URL')
  if (!webhookUrl) {
    res.status(202).json({ ok: true, skipped: true })
    return
  }

  const origin = headerValue(req.headers, 'origin')
  const host = headerValue(req.headers, 'host')

  if (origin && host && !origin.includes(host)) {
    res.status(403).json({ ok: false, error: 'Forbidden' })
    return
  }

  const ip = getClientIp(req)
  if (isRateLimited(ip)) {
    res.status(429).json({ ok: false, error: 'Too many requests' })
    return
  }

  const payload = (req.body ?? {}) as AlertPayload

  const source = sanitize(payload.source, 80) || 'client'
  const message = sanitize(payload.message, 2000) || 'Unknown incident'
  const path = sanitize(payload.path, 280)
  const userAgent = sanitize(payload.userAgent, 280)
  const fatal = Boolean(payload.fatal)

  const text = [
    `*SHIS Incident Alert* (${fatal ? 'FATAL' : 'WARN'})`,
    `Source: ${source}`,
    `Path: ${path || '-'}`,
    `UA: ${userAgent || '-'}`,
    `Message: ${message}`,
  ].join('\n')

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    const details = await response.text()
    res.status(502).json({ ok: false, error: `Webhook failed: ${details.slice(0, 300)}` })
    return
  }

  res.status(200).json({ ok: true })
}
