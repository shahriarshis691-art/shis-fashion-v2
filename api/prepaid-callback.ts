import { getFirebaseAdminDb } from './_firebaseAdmin.js'
import { completePrepaidCheckout } from './_prepaidProvider.js'
import { notifyCustomer } from './_notifyCustomer.js'
import { getAvailableStock, productMatchesSlug } from './_catalog.js'
import { FieldValue } from 'firebase-admin/firestore'

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

export default async function handler(req: LooseRequest, res: LooseResponse) {
  const paymentId = readParam(req, 'paymentID') || readParam(req, 'paymentId')
  const provider = readParam(req, 'provider')
  const tranId = readParam(req, 'tran_id') || readParam(req, 'tranId')
  const status = readParam(req, 'status')
  const orderId = readParam(req, 'orderId') || tranId

  if (status.toLowerCase() === 'cancel' || status.toLowerCase() === 'failure' || status.toLowerCase() === 'failed') {
    redirect(res, '/checkout?prepaid=cancelled')
    return
  }

  const db = getFirebaseAdminDb()
  if (!db || (!paymentId && !orderId)) {
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
    const data = orderDoc.data() as {
      stockCommitted?: boolean
      items?: Array<{ slug?: string; name?: string; quantity?: number; size?: string; color?: string }>
      customerName?: string
      customerPhone?: string
      customerEmail?: string
      paymentMethod?: string
      total?: number
      couponId?: string
      couponDiscountAmount?: number
    }

    if (!result.ok) {
      await orderDoc.ref.update({
        paymentStatus: 'failed',
        status: 'cancelled',
      })
      redirect(res, '/checkout?prepaid=failed')
      return
    }

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
          const product = (snap.data() ?? {}) as { stock?: number; variants?: unknown }
          const available = getAvailableStock(product, String(item.size ?? ''), String(item.color ?? ''))
          if (available.stock < qty) {
            throw new Error('INSUFFICIENT_STOCK')
          }

          if (available.variantIndex >= 0) {
            const nextVariants = available.variants.map((entry, index) => (
              index === available.variantIndex ? { ...entry, stock: entry.stock - qty } : entry
            ))
            const total = nextVariants.reduce((sum, entry) => sum + entry.stock, 0)
            transaction.update(match.ref, { variants: nextVariants, stock: total })
          } else {
            transaction.update(match.ref, { stock: Math.max(0, available.stock - qty) })
          }
        }

        transaction.update(orderDoc.ref, {
          paymentStatus: 'paid',
          stockCommitted: true,
          prepaidCompletedAt: FieldValue.serverTimestamp(),
        })

        if (data.couponId) {
          transaction.update(db.collection('coupons').doc(data.couponId), {
            status: 'used',
            usageCount: 1,
            orderId: orderDoc.id,
            discountAmount: Number(data.couponDiscountAmount ?? 0),
            usedAt: FieldValue.serverTimestamp(),
          })
        }
      })
    } else {
      await orderDoc.ref.update({
        paymentStatus: 'paid',
        prepaidCompletedAt: FieldValue.serverTimestamp(),
      })
    }

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
