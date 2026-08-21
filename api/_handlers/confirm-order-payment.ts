import { FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getFirebaseAdminDb } from '../_firebaseAdmin.js'
import { sendOpsWebhook } from '../_opsWebhook.js'
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
      return JSON.parse(raw) as { orderId?: string }
    } catch {
      return {}
    }
  }

  return (raw ?? {}) as { orderId?: string }
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
    res.status(503).json({ error: 'Order service is temporarily unavailable.' })
    return
  }

  try {
    const decoded = await getAuth().verifyIdToken(token)
    const email = decoded.email?.trim().toLowerCase() ?? ''
    if (!(decoded.admin === true || isConfiguredAdminEmail(email))) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const orderId = readBody(req).orderId?.trim() ?? ''
    if (!orderId) {
      res.status(400).json({ error: 'Missing order ID.' })
      return
    }

    const orderRef = db.collection('orders').doc(orderId)
    const snapshot = await orderRef.get()
    if (!snapshot.exists) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }

    const data = snapshot.data() as {
      archived?: boolean
      paymentStatus?: string
      status?: string
      paymentMethod?: string
      paymentTransactionId?: string
      customerName?: string
      customerPhone?: string
      customerEmail?: string
      total?: number
    }

    if (data.archived) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }

    if (data.paymentStatus !== 'pending_verification') {
      res.status(409).json({ error: 'Order payment is not awaiting verification.' })
      return
    }

    const nextStatus = data.status === 'new' ? 'confirmed' : data.status
    const updates = {
      paymentStatus: 'paid',
      paymentVerifiedAt: FieldValue.serverTimestamp(),
      paymentVerifiedBy: email || decoded.uid,
      ...(nextStatus && nextStatus !== data.status ? { status: nextStatus } : {}),
    }

    await orderRef.update(updates)

    void sendOpsWebhook([
      '*SHIS Wallet payment confirmed*',
      `Order ${orderId}`,
      `Method: ${data.paymentMethod ?? 'wallet'}`,
      `TrxID: ${data.paymentTransactionId ?? '—'}`,
      `Amount: ৳ ${Number(data.total ?? 0).toLocaleString('en-BD')}`,
      `Confirmed by: ${email || decoded.uid}`,
      nextStatus === 'confirmed' ? 'Order moved to Confirmed.' : '',
    ].filter(Boolean).join('\n'))

    void notifyCustomer({
      channel: 'order-placed',
      orderId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      paymentMethod: data.paymentMethod,
      total: data.total,
    })

    res.status(200).json({
      ok: true,
      order: {
        id: orderId,
        paymentStatus: 'paid',
        status: nextStatus ?? data.status,
      },
    })
  } catch {
    res.status(500).json({ error: 'Unable to confirm payment.' })
  }
}
