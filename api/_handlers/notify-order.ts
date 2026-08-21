import { getAuth } from 'firebase-admin/auth'
import { getFirebaseAdminDb } from '../_firebaseAdmin.js'
import { notifyCustomer } from '../_notifyCustomer.js'

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

function getHeaderValue(headers: LooseRequest['headers'], name: string) {
  const header = headers?.[name] ?? headers?.[name.toLowerCase()]
  return Array.isArray(header) ? header[0] : header ?? ''
}

function isConfiguredAdminEmail(email: string) {
  const rawValue = process.env.VITE_ADMIN_EMAILS ?? ''
  if (!rawValue) {
    return false
  }

  return rawValue
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase())
}

function readBody(req: LooseRequest) {
  const raw = req.body
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as { orderId?: string; channel?: string }
    } catch {
      return {}
    }
  }

  return (raw ?? {}) as { orderId?: string; channel?: string }
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const authorization = getHeaderValue(req.headers, 'authorization')
  const token = authorization.startsWith('Bearer ') ? authorization.slice('Bearer '.length).trim() : ''
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const db = getFirebaseAdminDb()
  if (!db) {
    res.status(503).json({ skipped: true, reason: 'unconfigured' })
    return
  }

  try {
    const decoded = await getAuth().verifyIdToken(token)
    const email = decoded.email?.trim().toLowerCase() ?? ''
    if (!(decoded.admin === true || isConfiguredAdminEmail(email))) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const body = readBody(req)
    const orderId = String(body.orderId ?? '').trim()
    if (!orderId) {
      res.status(400).json({ error: 'Missing order ID.' })
      return
    }

    const snapshot = await db.collection('orders').doc(orderId).get()
    if (!snapshot.exists) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }

    const data = snapshot.data() as {
      customerName?: string
      customerPhone?: string
      customerEmail?: string
      paymentMethod?: string
      trackingNumber?: string
      total?: number
    }

    await notifyCustomer({
      channel: body.channel === 'order-shipped' ? 'order-shipped' : 'order-placed',
      orderId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      paymentMethod: data.paymentMethod,
      trackingNumber: data.trackingNumber,
      total: data.total,
    })

    res.status(200).json({ ok: true })
  } catch {
    res.status(503).json({ skipped: true, reason: 'notify-failed' })
  }
}
