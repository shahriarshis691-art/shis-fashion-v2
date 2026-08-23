import { getFirebaseAdminDb } from '../_firebaseAdmin.js'
import { getExpectedSslcommerzStoreId, verifyPrepaidReturn } from '../_prepaidProvider.js'
import { notifyCustomer } from '../_notifyCustomer.js'
import { amountsMatch, settlePrepaidFailed, settlePrepaidPaid, type PrepaidOrderData } from '../_prepaidSettle.js'
import { createRateLimiter, getClientIp } from '../_rateLimit.js'

export const config = {
  runtime: 'nodejs',
}

interface LooseRequest {
  method?: string
  headers?: Record<string, string | string[] | undefined>
  query?: Record<string, string | string[] | undefined>
  body?: unknown
  url?: string
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  setHeader: (name: string, value: string) => void
  send: (body: string) => void
  json: (payload: unknown) => void
}

const SITE_URL = process.env.VITE_SITE_URL || 'https://www.shisfashion.com'
const isIpRateLimited = createRateLimiter(30, 60_000, 'prepaid-callback')
const isOrderRateLimited = createRateLimiter(10, 60_000, 'prepaid-callback-order')

/**
 * Gateways return to this endpoint in the customer's browser, so it cannot be
 * authenticated. Every state change is therefore driven by a server-to-server
 * verification call, never by the query string: a forged
 * `?status=cancel&orderId=...` request can no longer cancel someone's order.
 * Replay safety comes from the payment event ledger in `_prepaidSettle`.
 */

function collectBodyFields(body: unknown): Record<string, string> {
  if (typeof body === 'string') {
    const trimmed = body.trim()
    if (!trimmed) {
      return {}
    }

    if (trimmed.startsWith('{')) {
      try {
        return collectBodyFields(JSON.parse(trimmed) as Record<string, unknown>)
      } catch {
        return {}
      }
    }

    const fields: Record<string, string> = {}
    new URLSearchParams(trimmed).forEach((value, key) => {
      fields[key] = value
    })
    return fields
  }

  if (!body || typeof body !== 'object') {
    return {}
  }

  const fields: Record<string, string> = {}
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (value == null) {
      continue
    }
    fields[key] = Array.isArray(value) ? String(value[0] ?? '') : String(value)
  }
  return fields
}

function createParamReader(req: LooseRequest) {
  const bodyFields = collectBodyFields(req.body)
  let urlParams: URLSearchParams | null = null
  try {
    urlParams = new URL(req.url ?? '', SITE_URL).searchParams
  } catch {
    urlParams = null
  }

  return function readParam(...keys: string[]) {
    for (const key of keys) {
      const fromBody = bodyFields[key]?.trim()
      if (fromBody) {
        return fromBody
      }

      const raw = req.query?.[key]
      const fromQuery = (Array.isArray(raw) ? raw[0] ?? '' : raw ?? '').trim()
      if (fromQuery) {
        return fromQuery
      }

      const fromUrl = urlParams?.get(key)?.trim() ?? ''
      if (fromUrl) {
        return fromUrl
      }
    }

    return ''
  }
}

function redirect(res: LooseResponse, path: string) {
  res.status(302)
  res.setHeader('Location', `${SITE_URL}${path}`)
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  res.send('')
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  const method = String(req.method ?? 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'POST' && method !== 'HEAD') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (await isIpRateLimited(getClientIp(req.headers))) {
    redirect(res, '/checkout?prepaid=rate-limited')
    return
  }

  const readParam = createParamReader(req)
  const paymentId = readParam('paymentID', 'paymentId')
  const provider = readParam('provider')
  const valId = readParam('val_id', 'valId')
  const tranId = readParam('tran_id', 'tranId')
  const orderId = readParam('orderId') || tranId

  if (!paymentId && !orderId) {
    redirect(res, '/checkout?prepaid=unavailable')
    return
  }

  if (await isOrderRateLimited(paymentId || orderId)) {
    redirect(res, '/checkout?prepaid=rate-limited')
    return
  }

  const db = getFirebaseAdminDb()
  if (!db) {
    redirect(res, '/checkout?prepaid=unavailable')
    return
  }

  try {
    const verification = await verifyPrepaidReturn({ provider, paymentId, tranId: orderId, valId })

    // SSLCommerz val_id validation echoes the merchant and transaction back.
    // Mismatches mean the return does not belong to this store or this order.
    const expectedStoreId = getExpectedSslcommerzStoreId()
    if (verification.storeId && expectedStoreId && verification.storeId !== expectedStoreId) {
      redirect(res, '/checkout?prepaid=failed')
      return
    }

    if (verification.tranId && orderId && verification.tranId !== orderId) {
      redirect(res, '/checkout?prepaid=failed')
      return
    }

    const orders = db.collection('orders')
    const snapshot = paymentId
      ? await orders.where('prepaidPaymentId', '==', paymentId).limit(1).get()
      : await orders.doc(orderId).get().then((doc) => ({ empty: !doc.exists, docs: doc.exists ? [doc] : [] }))

    if (snapshot.empty) {
      redirect(res, '/checkout?prepaid=missing')
      return
    }

    const orderDoc = snapshot.docs[0]
    const data = orderDoc.data() as PrepaidOrderData
    const eventId = paymentId
      ? `bkash:${paymentId}`
      : `sslcommerz:${orderDoc.id}:${verification.valId || 'callback'}`

    if (verification.outcome === 'paid') {
      if (!amountsMatch(Number(data.total ?? 0), verification.amount)) {
        redirect(res, '/checkout?prepaid=amount-mismatch')
        return
      }

      const settled = await settlePrepaidPaid({
        db,
        orderRef: orderDoc.ref,
        orderId: orderDoc.id,
        data,
        paymentEventId: eventId,
        trxId: verification.trxId,
      })

      if (settled === 'applied') {
        void notifyCustomer({
          channel: 'order-placed',
          orderId: orderDoc.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          paymentMethod: data.paymentMethod,
          total: data.total,
        })
      }

      redirect(res, `/order-success?orderId=${encodeURIComponent(orderDoc.id)}&prepaid=1`)
      return
    }

    if (verification.outcome === 'failed') {
      const failed = await settlePrepaidFailed({
        db,
        orderRef: orderDoc.ref,
        data,
        paymentEventId: eventId,
      })

      if (failed === 'ignored-paid') {
        redirect(res, `/order-success?orderId=${encodeURIComponent(orderDoc.id)}&prepaid=1`)
        return
      }

      redirect(res, '/checkout?prepaid=cancelled')
      return
    }

    // Unverifiable outcome: leave the order untouched and let the IPN settle it.
    if (String(data.paymentStatus ?? '') === 'paid') {
      redirect(res, `/order-success?orderId=${encodeURIComponent(orderDoc.id)}&prepaid=1`)
      return
    }

    redirect(res, '/checkout?prepaid=pending')
  } catch {
    redirect(res, '/checkout?prepaid=failed')
  }
}
