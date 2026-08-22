import { createRateLimiter, getClientIp } from '../_rateLimit.js'
import { isMetaCapiConfigured, sendConversionsApiEvent, type MetaCapiEventName } from '../_metaCapi.js'

interface LooseRequest {
  method?: string
  headers?: Record<string, string | string[] | undefined>
  body?: unknown
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  json: (payload: unknown) => void
}

interface MetaCapiBody {
  eventName?: string
  eventId?: string
  eventTime?: number
  eventSourceUrl?: string
  customData?: Record<string, unknown>
  userData?: {
    email?: string
    phone?: string
    firstName?: string
    city?: string
    country?: string
    fbp?: string
    fbc?: string
  }
}

const ALLOWED_EVENTS = new Set<MetaCapiEventName>([
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'Purchase',
])

const isRateLimited = createRateLimiter(60, 60_000, 'meta-capi')

function headerValue(headers: LooseRequest['headers'], key: string) {
  const value = headers?.[key] ?? headers?.[key.toLowerCase()]
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function sanitize(value: unknown, maxLength: number) {
  let next = ''
  for (const char of String(value ?? '')) {
    const code = char.charCodeAt(0)
    if (code >= 32 && char !== '<' && char !== '>') {
      next += char
    }
  }

  return next.trim().slice(0, maxLength)
}

function sanitizeCustomData(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  const allowedKeys = new Set([
    'content_name',
    'content_ids',
    'content_type',
    'value',
    'currency',
    'brand',
    'search_string',
    'num_items',
    'order_id',
  ])

  const next: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!allowedKeys.has(key)) {
      continue
    }

    if (key === 'content_ids' && Array.isArray(entry)) {
      next[key] = entry.map((item) => sanitize(item, 80)).filter(Boolean).slice(0, 50)
      continue
    }

    if (key === 'value') {
      const numeric = Number(entry)
      if (Number.isFinite(numeric)) {
        next[key] = numeric
      }
      continue
    }

    if (typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean') {
      next[key] = typeof entry === 'string' ? sanitize(entry, 180) : entry
    }
  }

  return next
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  if (!isMetaCapiConfigured()) {
    res.status(202).json({ ok: true, skipped: true })
    return
  }

  const origin = headerValue(req.headers, 'origin')
  const host = headerValue(req.headers, 'host')
  if (origin && host && !origin.includes(host)) {
    res.status(403).json({ ok: false, error: 'Forbidden' })
    return
  }

  if (await isRateLimited(getClientIp(req.headers))) {
    res.status(429).json({ ok: false, error: 'Too many requests' })
    return
  }

  const body = (req.body ?? {}) as MetaCapiBody
  const eventName = sanitize(body.eventName, 40)
  const eventId = sanitize(body.eventId, 80)
  if (!ALLOWED_EVENTS.has(eventName as MetaCapiEventName) || !eventId) {
    res.status(400).json({ ok: false, error: 'Invalid event' })
    return
  }

  const eventTime = Number(body.eventTime)
  const result = await sendConversionsApiEvent({
    eventName: eventName as MetaCapiEventName,
    eventId,
    eventTime: Number.isFinite(eventTime) ? eventTime : undefined,
    eventSourceUrl: sanitize(body.eventSourceUrl, 400),
    customData: sanitizeCustomData(body.customData),
    userData: {
      email: sanitize(body.userData?.email, 120),
      phone: sanitize(body.userData?.phone, 32),
      firstName: sanitize(body.userData?.firstName, 80),
      city: sanitize(body.userData?.city, 80),
      country: sanitize(body.userData?.country, 8) || 'bd',
      fbp: sanitize(body.userData?.fbp, 120),
      fbc: sanitize(body.userData?.fbc, 200),
      clientIpAddress: getClientIp(req.headers),
      clientUserAgent: headerValue(req.headers, 'user-agent').slice(0, 280),
    },
  })

  res.status(result.ok ? 200 : 502).json({ ok: result.ok, skipped: result.skipped ?? false })
}
