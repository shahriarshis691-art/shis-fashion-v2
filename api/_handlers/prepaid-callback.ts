import { getFirebaseAdminDb } from '../_firebaseAdmin.js'
import { completePrepaidCheckout } from '../_prepaidProvider.js'
import { notifyCustomer } from '../_notifyCustomer.js'
import { getAvailableStock, productMatchesSlug } from '../_catalog.js'
import { applyStockDecrement, applyStockRestore } from '../_stock.js'
import { FieldValue } from 'firebase-admin/firestore'
import type { DocumentReference, Firestore } from 'firebase-admin/firestore'

export const config = {
  runtime: 'nodejs',
}

interface LooseRequest {
  method?: string
  query?: Record<string, string | string[] | undefined>
  url?: string
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  setHeader: (name: string, value: string) => void
  send: (body: string) => void
  json: (payload: unknown) => void
}

interface OrderItem {
  slug?: string
  name?: string
  quantity?: number
  size?: string
  color?: string
}

interface OrderData {
  stockCommitted?: boolean
  items?: OrderItem[]
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  paymentMethod?: string
  total?: number
  couponId?: string
  couponDiscountAmount?: number
}

const SITE_URL = process.env.VITE_SITE_URL || 'https://www.shisfashion.com'

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

async function restoreStockForOrder(
  db: Firestore,
  orderRef: DocumentReference,
  data: OrderData,
) {
  const productsSnapshot = await db.collection('products').get()
  await db.runTransaction(async (transaction) => {
    if (data.stockCommitted) {
      for (const item of data.items ?? []) {
        const qty = Math.max(0, Math.floor(Number(item.quantity ?? 0)))
        const match = productsSnapshot.docs.find((doc) => {
          const product = doc.data() as { slug?: string; name?: string; archived?: boolean }
          if (product.archived) {
            return false
          }
          return productMatchesSlug(product, String(item.slug || item.name || ''))
            || String(product.name || '').trim().toLowerCase() === String(item.name || '').trim().toLowerCase()
        })
        if (!match) {
          continue
        }

        const snap = await transaction.get(match.ref)
        const product = (snap.data() ?? {}) as { stock?: unknown; variants?: unknown }
        const available = getAvailableStock(product, String(item.size ?? ''), String(item.color ?? ''))
        applyStockRestore(transaction, {
          productRef: match.ref,
          quantity: qty,
          size: item.size,
          color: item.color,
          variantIndex: available.variantIndex,
          variants: available.variants,
          stock: available.stock,
        })
      }
    }

    transaction.update(orderRef, {
      paymentStatus: 'failed',
      status: 'cancelled',
      stockCommitted: false,
    })
  })
}

async function markPrepaidPaid(
  db: Firestore,
  orderRef: DocumentReference,
  orderId: string,
  data: OrderData,
  trxId?: string,
) {
  if (!data.stockCommitted) {
    const productsSnapshot = await db.collection('products').get()
    await db.runTransaction(async (transaction) => {
      for (const item of data.items ?? []) {
        const qty = Math.max(0, Math.floor(Number(item.quantity ?? 0)))
        const match = productsSnapshot.docs.find((doc) => {
          const product = doc.data() as { slug?: string; name?: string; archived?: boolean }
          if (product.archived) {
            return false
          }
          return productMatchesSlug(product, String(item.slug || item.name || ''))
            || String(product.name || '').trim().toLowerCase() === String(item.name || '').trim().toLowerCase()
        })
        if (!match) {
          throw new Error('MISSING_PRODUCT')
        }

        const snap = await transaction.get(match.ref)
        const product = (snap.data() ?? {}) as { stock?: unknown; variants?: unknown }
        const available = getAvailableStock(product, String(item.size ?? ''), String(item.color ?? ''))
        if (available.stock < qty) {
          throw new Error('INSUFFICIENT_STOCK')
        }

        applyStockDecrement(transaction, {
          productRef: match.ref,
          quantity: qty,
          size: item.size,
          color: item.color,
          variantIndex: available.variantIndex,
          variants: available.variants,
          stock: available.stock,
        })
      }

      transaction.update(orderRef, {
        paymentStatus: 'paid',
        stockCommitted: true,
        prepaidCompletedAt: FieldValue.serverTimestamp(),
        ...(trxId ? { paymentTransactionId: trxId } : {}),
      })

      if (data.couponId) {
        transaction.update(db.collection('coupons').doc(data.couponId), {
          status: 'used',
          usageCount: 1,
          orderId,
          discountAmount: Number(data.couponDiscountAmount ?? 0),
          usedAt: FieldValue.serverTimestamp(),
        })
      }
    })
    return
  }

  await orderRef.update({
    paymentStatus: 'paid',
    prepaidCompletedAt: FieldValue.serverTimestamp(),
    ...(trxId ? { paymentTransactionId: trxId } : {}),
  })

  if (data.couponId) {
    await db.collection('coupons').doc(data.couponId).update({
      status: 'used',
      usageCount: 1,
      orderId,
      discountAmount: Number(data.couponDiscountAmount ?? 0),
      usedAt: FieldValue.serverTimestamp(),
    })
  }
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  const paymentId = readParam(req, 'paymentID') || readParam(req, 'paymentId')
  const provider = readParam(req, 'provider')
  const tranId = readParam(req, 'tran_id') || readParam(req, 'tranId')
  const status = readParam(req, 'status')
  const orderId = readParam(req, 'orderId') || tranId
  const normalizedStatus = status.toLowerCase()

  const db = getFirebaseAdminDb()
  if (!db) {
    redirect(res, '/checkout?prepaid=unavailable')
    return
  }

  if (normalizedStatus === 'cancel' || normalizedStatus === 'failure' || normalizedStatus === 'failed') {
    try {
      const orders = db.collection('orders')
      const snapshot = paymentId
        ? await orders.where('prepaidPaymentId', '==', paymentId).limit(1).get()
        : orderId
          ? await orders.doc(orderId).get().then((doc) => ({ empty: !doc.exists, docs: doc.exists ? [doc] : [] }))
          : { empty: true, docs: [] }

      if (!snapshot.empty) {
        const orderDoc = snapshot.docs[0]
        await restoreStockForOrder(db, orderDoc.ref, orderDoc.data() as OrderData)
      }
    } catch {
      // Still send shopper back to checkout even if restore fails.
    }

    redirect(res, '/checkout?prepaid=cancelled')
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
      : orderId
        ? await orders.doc(orderId).get().then((doc) => ({ empty: !doc.exists, docs: doc.exists ? [doc] : [] }))
        : { empty: true, docs: [] }

    if (snapshot.empty) {
      redirect(res, '/checkout?prepaid=missing')
      return
    }

    const orderDoc = snapshot.docs[0]
    const data = orderDoc.data() as OrderData

    if (!result.ok) {
      await restoreStockForOrder(db, orderDoc.ref, data)
      redirect(res, '/checkout?prepaid=failed')
      return
    }

    const trxId = 'trxId' in result && typeof result.trxId === 'string' ? result.trxId : undefined
    await markPrepaidPaid(db, orderDoc.ref, orderDoc.id, data, trxId)

    void notifyCustomer({
      channel: 'order-placed',
      orderId: orderDoc.id,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      paymentMethod: data.paymentMethod,
      total: data.total,
    })

    redirect(res, `/order-success?orderId=${encodeURIComponent(orderDoc.id)}&prepaid=1`)
  } catch {
    redirect(res, '/checkout?prepaid=failed')
  }
}
