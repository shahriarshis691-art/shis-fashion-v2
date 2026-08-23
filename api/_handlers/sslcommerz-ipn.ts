import { getFirebaseAdminDb } from '../_firebaseAdmin.js'
import { classifyPrepaidStatus, validateSslcommerzByValId, verifySslcommerzIpnHash } from '../_prepaidProvider.js'
import { notifyCustomer } from '../_notifyCustomer.js'
import { amountsMatch, settlePrepaidFailed, settlePrepaidPaid, type PrepaidOrderData } from '../_prepaidSettle.js'
import { createRateLimiter, getClientIp } from '../_rateLimit.js'

export const config = {
  runtime: 'nodejs',
}

interface LooseRequest {
  method?: string
  headers?: Record<string, string | string[] | undefined>
  body?: unknown
  url?: string
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  setHeader: (name: string, value: string) => void
  send: (body: string) => void
  json: (payload: unknown) => void
}

const isRateLimited = createRateLimiter(60, 60_000, 'sslcommerz-ipn')
const isTransactionRateLimited = createRateLimiter(12, 60_000, 'sslcommerz-ipn-tran')
const EXPECTED_STORE_ID = process.env.SSLCOMMERZ_STORE_ID ?? ''

function asFields(body: unknown): Record<string, string> {
  if (typeof body === 'string') {
    const trimmed = body.trim()
    if (!trimmed) {
      return {}
    }

    if (trimmed.startsWith('{')) {
      try {
        return asFields(JSON.parse(trimmed) as Record<string, unknown>)
      } catch {
        return {}
      }
    }

    const params = new URLSearchParams(trimmed)
    const fields: Record<string, string> = {}
    params.forEach((value, key) => {
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

function sendText(res: LooseResponse, status: number, body: string) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.status(status).send(body)
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'POST') {
    sendText(res, 405, 'Method not allowed')
    return
  }

  if (await isRateLimited(getClientIp(req.headers))) {
    sendText(res, 429, 'Too many requests')
    return
  }

  const fields = asFields(req.body)
  if (!verifySslcommerzIpnHash(fields)) {
    sendText(res, 400, 'Invalid signature')
    return
  }

  const valId = fields.val_id?.trim()
  const tranId = fields.tran_id?.trim()
  if (!valId || !tranId) {
    sendText(res, 400, 'Missing val_id or tran_id')
    return
  }

  if (await isTransactionRateLimited(tranId)) {
    sendText(res, 429, 'Too many requests')
    return
  }

  const verified = await validateSslcommerzByValId(valId)
  if (!verified.ok) {
    // Only cancel on a status the gateway will never revise. A transient
    // validation error returns 5xx so SSLCommerz retries the IPN instead.
    if (classifyPrepaidStatus(verified.status, false) !== 'failed') {
      sendText(res, 503, 'Validation unavailable')
      return
    }

    const db = getFirebaseAdminDb()
    if (db && tranId) {
      const orderSnap = await db.collection('orders').doc(tranId).get()
      if (orderSnap.exists) {
        await settlePrepaidFailed({
          db,
          orderRef: orderSnap.ref,
          data: orderSnap.data() as PrepaidOrderData,
          paymentEventId: `sslcommerz:${tranId}:${valId}`,
        }).catch(() => undefined)
      }
    }
    sendText(res, 200, 'FAILED')
    return
  }

  if (EXPECTED_STORE_ID && verified.storeId && verified.storeId !== EXPECTED_STORE_ID) {
    sendText(res, 400, 'Store mismatch')
    return
  }

  if (verified.tranId && verified.tranId !== tranId) {
    sendText(res, 400, 'Transaction mismatch')
    return
  }

  const db = getFirebaseAdminDb()
  if (!db) {
    sendText(res, 503, 'Unavailable')
    return
  }

  const orderSnap = await db.collection('orders').doc(tranId).get()
  if (!orderSnap.exists) {
    sendText(res, 404, 'Order not found')
    return
  }

  const data = orderSnap.data() as PrepaidOrderData
  if (!amountsMatch(Number(data.total ?? 0), verified.amount)) {
    sendText(res, 409, 'Amount mismatch')
    return
  }

  const paymentEventId = `sslcommerz:${tranId}:${verified.valId || valId}`

  try {
    const settled = await settlePrepaidPaid({
      db,
      orderRef: orderSnap.ref,
      orderId: orderSnap.id,
      data,
      paymentEventId,
      trxId: verified.trxId,
    })

    if (settled === 'applied') {
      void notifyCustomer({
        channel: 'order-placed',
        orderId: orderSnap.id,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        paymentMethod: data.paymentMethod,
        total: data.total,
      })
    }

    sendText(res, 200, 'VALID')
  } catch {
    sendText(res, 500, 'Settlement failed')
  }
}
