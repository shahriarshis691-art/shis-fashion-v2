import { FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getFirebaseAdminDb } from '../_firebaseAdmin.js'
import { matchOrderProductRefs, restoreMatchedInventory } from '../_prepaidSettle.js'
import {
  canTransitionOrderStatus,
  isOrderStatus,
  shouldRestockOnStatus,
  type OrderStatus,
} from '../_orderStatus.js'

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
      return JSON.parse(raw) as { orderId?: string; status?: string; trackingNumber?: string }
    } catch {
      return {}
    }
  }

  return (raw ?? {}) as { orderId?: string; status?: string; trackingNumber?: string }
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

    const body = readBody(req)
    const orderId = String(body.orderId ?? '').trim()
    const nextStatus = String(body.status ?? '').trim()
    if (!orderId || !isOrderStatus(nextStatus)) {
      res.status(400).json({ error: 'Missing order ID or invalid status.' })
      return
    }

    const orderRef = db.collection('orders').doc(orderId)
    const preview = await orderRef.get()
    if (!preview.exists) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }

    const previewData = preview.data() as {
      archived?: boolean
      items?: Array<{ slug?: string; name?: string; quantity?: number; size?: string; color?: string }>
    }

    if (previewData.archived) {
      res.status(404).json({ error: 'Order not found.' })
      return
    }

    const mightRestock = shouldRestockOnStatus(nextStatus)
    const matched = mightRestock
      ? await matchOrderProductRefs(db, previewData.items ?? [])
      : []

    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(orderRef)
      if (!snapshot.exists) {
        throw new Error('ORDER_MISSING')
      }

      const live = snapshot.data() as {
        archived?: boolean
        status?: string
        trackingNumber?: string
        stockCommitted?: boolean
        stockRestored?: boolean
        items?: Array<{ slug?: string; name?: string; quantity?: number; size?: string; color?: string }>
        customerName?: string
        customerPhone?: string
        customerEmail?: string
        paymentMethod?: string
        paymentStatus?: string
        total?: number
      }

      if (live.archived) {
        throw new Error('ORDER_ARCHIVED')
      }

      const currentStatus = isOrderStatus(String(live.status ?? '')) ? live.status as OrderStatus : 'new'
      if (!canTransitionOrderStatus(currentStatus, nextStatus)) {
        throw new Error('INVALID_TRANSITION')
      }

      const trackingNumber = typeof body.trackingNumber === 'string' ? body.trackingNumber.trim() : (live.trackingNumber ?? '')
      const restock = currentStatus !== nextStatus
        && shouldRestockOnStatus(nextStatus)
        && Boolean(live.stockCommitted)
        && !live.stockRestored

      if (restock) {
        await restoreMatchedInventory(transaction, matched)
      }

      const updates: Record<string, unknown> = {
        status: nextStatus,
        trackingNumber,
        statusUpdatedAt: FieldValue.serverTimestamp(),
        statusUpdatedBy: email || decoded.uid,
      }

      if (nextStatus === 'in_courier') {
        updates.inCourierAt = FieldValue.serverTimestamp()
      }

      if (nextStatus === 'delivered') {
        updates.deliveredAt = FieldValue.serverTimestamp()
      }

      if (nextStatus === 'cancelled') {
        updates.cancelledAt = FieldValue.serverTimestamp()
      }

      if (nextStatus === 'returned') {
        updates.returnedAt = FieldValue.serverTimestamp()
      }

      if (restock) {
        updates.stockRestored = true
        updates.stockCommitted = false
        updates.stockRestoredAt = FieldValue.serverTimestamp()
        updates.stockRestoredReason = nextStatus
      }

      if (currentStatus === nextStatus) {
        transaction.update(orderRef, {
          trackingNumber,
          statusUpdatedAt: FieldValue.serverTimestamp(),
        })
      } else {
        transaction.update(orderRef, updates)
      }

      return {
        status: nextStatus,
        trackingNumber,
        stockCommitted: restock ? false : live.stockCommitted,
        stockRestored: restock ? true : live.stockRestored,
        customerName: live.customerName,
        customerPhone: live.customerPhone,
        customerEmail: live.customerEmail,
        paymentMethod: live.paymentMethod,
        paymentStatus: live.paymentStatus,
        total: live.total,
      }
    })

    res.status(200).json({
      ok: true,
      order: {
        id: orderId,
        ...result,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'INVALID_TRANSITION') {
      res.status(409).json({ error: 'Invalid order transition.', code: 'order/invalid-status-transition' })
      return
    }

    if (message === 'ORDER_MISSING' || message === 'ORDER_ARCHIVED') {
      res.status(404).json({ error: 'Order not found.' })
      return
    }

    res.status(503).json({ error: 'Unable to update order status right now.' })
  }
}
