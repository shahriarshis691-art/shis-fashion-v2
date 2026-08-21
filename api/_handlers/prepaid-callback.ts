import { getFirebaseAdminDb } from '../_firebaseAdmin.js'
import { completePrepaidCheckout } from '../_prepaidProvider.js'
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
  url?: string
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  setHeader: (name: string, value: string) => void
  send: (body: string) => void
  json: (payload: unknown) => void
}

const SITE_URL = process.env.VITE_SITE_URL || 'https://www.shisfashion.com'
const isRateLimited = createRateLimiter(30, 60_000, 'prepaid-callback')

function queryValue(req: LooseRequest, key: string) {
  const raw = req.query?.[key]
  return Array.isArray(raw) ? raw[0] ?? '' : raw ?? ''
}

function readParam(req: LooseRequest, key: string) {
  const fromQuery = queryValue(req, key).trim()
  if (fromQuery) {
    return fromQuery
  }

  try {
    const url = new URL(req.url ?? '', SITE_URL)
    return url.searchParams.get(key)?.trim() ?? ''
  } catch {
    return ''
  }
}

function redirect(res: LooseResponse, path: string) {
  res.status(302)
  res.setHeader('Location', `${SITE_URL}${path}`)
  res.send('')
}

function hintedFailure(status: string) {
  const normalized = status.toLowerCase()
  return normalized === 'cancel' || normalized === 'cancelled' || normalized === 'failure' || normalized === 'failed'
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (await isRateLimited(getClientIp(req.headers))) {
    redirect(res, '/checkout?prepaid=rate-limited')
    return
  }

  const paymentId = readParam(req, 'paymentID') || readParam(req, 'paymentId')
  const provider = readParam(req, 'provider')
  const tranId = readParam(req, 'tran_id') || readParam(req, 'tranId')
  const orderId = readParam(req, 'orderId') || tranId
  const queryStatus = readParam(req, 'status')

  const db = getFirebaseAdminDb()
  if (!db) {
    redirect(res, '/checkout?prepaid=unavailable')
    return
  }

  if (!paymentId && !orderId) {
    redirect(res, '/checkout?prepaid=unavailable')
    return
  }

  try {
    const result = await completePrepaidCheckout({ provider, paymentId, tranId: orderId })
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
      : `sslcommerz:${orderDoc.id}:${'valId' in result && result.valId ? result.valId : 'callback'}`
    const trxId = 'trxId' in result && typeof result.trxId === 'string' ? result.trxId : undefined
    const paidAmount = 'amount' in result && typeof result.amount === 'number' ? result.amount : Number.NaN

    if (result.ok) {
      if (Number.isFinite(paidAmount) && !amountsMatch(Number(data.total ?? 0), paidAmount)) {
        redirect(res, '/checkout?prepaid=amount-mismatch')
        return
      }

      const settled = await settlePrepaidPaid({
        db,
        orderRef: orderDoc.ref,
        orderId: orderDoc.id,
        data,
        paymentEventId: eventId,
        trxId,
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

    if (hintedFailure(queryStatus) || String(result.status).toLowerCase() !== 'unknown') {
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

    redirect(res, '/checkout?prepaid=pending')
  } catch {
    redirect(res, '/checkout?prepaid=failed')
  }
}
