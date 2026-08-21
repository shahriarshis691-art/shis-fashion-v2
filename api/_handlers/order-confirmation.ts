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

interface ConfirmationBody {
  orderId?: string
}

const isRateLimited = createRateLimiter(12, 10 * 60_000, 'order-confirmation')
const MAX_AGE_MS = 48 * 60 * 60 * 1000

function readBody(req: LooseRequest): ConfirmationBody {
  const raw = req.body
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ConfirmationBody
    } catch {
      return {}
    }
  }

  return (raw ?? {}) as ConfirmationBody
}

function serializeCreatedAt(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  return new Date().toISOString()
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

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (await isRateLimited(getClientIp(req.headers))) {
    res.status(429).json({ error: 'Too many requests. Please wait a moment.' })
    return
  }

  const orderId = readBody(req).orderId?.trim() ?? ''
  if (!orderId || orderId.length < 8 || orderId.length > 64 || !/^[A-Za-z0-9_-]+$/.test(orderId)) {
    res.status(400).json({ error: 'Invalid order reference.' })
    return
  }

  const db = getFirebaseAdminDb()
  if (!db) {
    res.status(503).json({ error: 'Order confirmation is temporarily unavailable.' })
    return
  }

  try {
    const snapshot = await db.collection('orders').doc(orderId).get()
    if (!snapshot.exists) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }

    const data = snapshot.data() as {
      archived?: boolean
      paymentStatus?: string
      customerName?: string
      customerPhone?: string
      address?: string
      paymentMethod?: string
      paymentTransactionId?: string
      deliveryCharge?: unknown
      total?: unknown
      createdAt?: unknown
      items?: Array<{ name?: string; price?: string; quantity?: number; size?: string; color?: string; slug?: string }>
      couponDiscountAmount?: number
    }

    if (data.archived) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }

    const createdAt = serializeCreatedAt(data.createdAt)
    const ageMs = Date.now() - new Date(createdAt).getTime()
    if (Number.isFinite(ageMs) && ageMs > MAX_AGE_MS) {
      res.status(404).json({ error: 'Order confirmation expired. Use track order with your phone number.' })
      return
    }

    const paymentStatus = String(data.paymentStatus ?? '')
    const allowed = paymentStatus === 'paid' || paymentStatus === 'pending_verification' || paymentStatus === 'unpaid' || paymentStatus === 'pending'
    if (!allowed) {
      res.status(404).json({ error: 'Order confirmation unavailable.' })
      return
    }

    const items = (data.items ?? []).map((item, index) => ({
      id: `${item.slug || item.name || 'item'}-${index}`,
      name: item.name ?? 'Item',
      image: '',
      price: item.price ?? '৳ 0',
      quantity: item.quantity ?? 1,
      size: item.size ?? '',
      color: item.color ?? '',
    }))

    const grandTotal = toMoney(data.total)
    const deliveryCharge = toMoney(data.deliveryCharge)
    const discount = Number(data.couponDiscountAmount ?? 0)
    const subtotal = Math.max(0, grandTotal - deliveryCharge + discount)

    res.status(200).json({
      order: {
        orderId: snapshot.id,
        customerName: data.customerName ?? '',
        customerPhone: data.customerPhone ?? '',
        address: data.address ?? '',
        paymentMethod: data.paymentMethod ?? 'Cash on Delivery',
        paymentTransactionId: data.paymentTransactionId ?? '',
        paymentStatus,
        deliveryCharge,
        subtotal,
        grandTotal,
        createdAt,
        items,
      },
    })
  } catch {
    res.status(500).json({ error: 'Unable to load order confirmation.' })
  }
}
