import { getFirebaseAdminDb } from '../_firebaseAdmin.js'
import { createRateLimiter, getClientIp } from '../_rateLimit.js'

export const config = {
  runtime: 'nodejs',
}

interface LooseRequest {
  method?: string
  headers?: Record<string, string | string[] | undefined>
  body?: unknown
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  json: (payload: unknown) => void
}

interface LookupBody {
  orderId?: string
  phone?: string
}

const isRateLimited = createRateLimiter(5, 10 * 60_000)
const GENERIC_MISS = 'We could not find an order with that ID and phone number.'

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('8801') && digits.length === 13) {
    return `0${digits.slice(3)}`
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return digits
  }
  return null
}

function readBody(req: LooseRequest): LookupBody {
  const raw = req.body
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as LookupBody
    } catch {
      return {}
    }
  }

  return (raw ?? {}) as LookupBody
}

function toMoney(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ''))
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function serializeCreatedAt(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString()
    } catch {
      return ''
    }
  }

  return ''
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const ip = getClientIp(req.headers)
  if (isRateLimited(ip)) {
    res.status(429).json({ error: 'Too many lookup attempts. Please wait a few minutes or chat on WhatsApp.' })
    return
  }

  const body = readBody(req)
  const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''
  const phone = typeof body.phone === 'string' ? normalizePhone(body.phone) : null

  if (!orderId || orderId.length < 8 || orderId.length > 64 || !/^[A-Za-z0-9_-]+$/.test(orderId)) {
    res.status(400).json({ error: 'Enter a valid order ID from your confirmation.' })
    return
  }

  if (!phone) {
    res.status(400).json({ error: 'Enter the Bangladesh phone number used at checkout (01XXXXXXXXX).' })
    return
  }

  const db = getFirebaseAdminDb()
  if (!db) {
    res.status(503).json({ error: 'Order lookup is temporarily unavailable. Please try WhatsApp support.' })
    return
  }

  try {
    const snapshot = await db.collection('orders').doc(orderId).get()
    if (!snapshot.exists) {
      res.status(404).json({ error: GENERIC_MISS })
      return
    }

    const data = snapshot.data() as {
      customerPhone?: string
      customerName?: string
      status?: string
      trackingNumber?: string
      paymentMethod?: string
      total?: unknown
      deliveryCharge?: unknown
      createdAt?: unknown
      items?: Array<{ name?: string; quantity?: number; size?: string; color?: string }>
      deliveryAddress?: { division?: string; district?: string }
      archived?: boolean
    }

    if (data.archived) {
      res.status(404).json({ error: GENERIC_MISS })
      return
    }

    const storedPhone = normalizePhone(data.customerPhone ?? '')
    if (!storedPhone || storedPhone !== phone) {
      res.status(404).json({ error: GENERIC_MISS })
      return
    }

    res.status(200).json({
      order: {
        orderId: snapshot.id,
        status: data.status ?? 'new',
        trackingNumber: data.trackingNumber ?? '',
        paymentMethod: data.paymentMethod ?? 'Cash on Delivery',
        customerName: data.customerName ?? '',
        area: [data.deliveryAddress?.district, data.deliveryAddress?.division].filter(Boolean).join(', '),
        total: toMoney(data.total),
        deliveryCharge: toMoney(data.deliveryCharge),
        createdAt: serializeCreatedAt(data.createdAt),
        items: (data.items ?? []).map((item) => ({
          name: item.name ?? 'Item',
          quantity: item.quantity ?? 1,
          size: item.size ?? '',
          color: item.color ?? '',
        })),
      },
    })
  } catch {
    res.status(500).json({ error: 'Unable to look up this order right now. Please try again.' })
  }
}
