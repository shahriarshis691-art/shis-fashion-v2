import { FieldValue } from 'firebase-admin/firestore'
import type { DocumentReference, Firestore, Transaction } from 'firebase-admin/firestore'
import { productMatchesSlug } from './_catalog.js'
import { sendConversionsApiEvent } from './_metaCapi.js'
import {
  commitStockWorkingSet,
  readStockWorkingSet,
  releaseStock,
  reserveStock,
  type StockWorkingSet,
} from './_stock.js'

export interface PrepaidOrderItem {
  slug?: string
  name?: string
  quantity?: number
  size?: string
  color?: string
}

export interface PrepaidOrderData {
  stockCommitted?: boolean
  paymentStatus?: string
  status?: string
  items?: PrepaidOrderItem[]
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  paymentMethod?: string
  total?: number
  couponId?: string
  couponDiscountAmount?: number
  paymentEventId?: string
  paymentTransactionId?: string
  purchaseEventId?: string
  archived?: boolean
}

export type SettlePaidResult = 'applied' | 'already-settled'
export type SettleFailedResult = 'applied' | 'already-failed' | 'ignored-paid'

export type MatchedOrderLine = { item: PrepaidOrderItem; ref: DocumentReference | null }

const PAYMENT_EVENTS_COLLECTION = 'paymentEvents'

/**
 * Firestore document ids cannot contain `/`. Provider event ids are already
 * shaped like `bkash:<paymentId>` or `sslcommerz:<orderId>:<valId>`, so this
 * only guards against unexpected provider payloads.
 */
export function toPaymentEventDocId(paymentEventId: string) {
  const safe = paymentEventId.trim().replace(/[^A-Za-z0-9._:-]/g, '_')
  return safe.slice(0, 400) || 'unknown-event'
}

async function matchProductRefs(db: Firestore, items: PrepaidOrderItem[]): Promise<MatchedOrderLine[]> {
  const productsSnapshot = await db.collection('products').get()
  return items.map((item) => {
    const match = productsSnapshot.docs.find((doc) => {
      const product = doc.data() as { slug?: string; name?: string; archived?: boolean }
      if (product.archived) {
        return false
      }
      return productMatchesSlug(product, String(item.slug || item.name || ''))
        || String(product.name || '').trim().toLowerCase() === String(item.name || '').trim().toLowerCase()
    })
    return { item, ref: match?.ref ?? null }
  })
}

function toStockRequest(line: MatchedOrderLine) {
  return {
    ref: line.ref,
    quantity: Number(line.item.quantity ?? 0),
    size: line.item.size,
    color: line.item.color,
    label: String(line.item.name ?? '').trim(),
  }
}

async function readOrderStockWorkingSet(transaction: Transaction, matched: MatchedOrderLine[]) {
  return readStockWorkingSet(transaction, matched.map((line) => line.ref))
}

export async function matchOrderProductRefs(db: Firestore, items: PrepaidOrderItem[]) {
  return matchProductRefs(db, items)
}

export async function restoreMatchedInventory(
  transaction: Transaction,
  matched: MatchedOrderLine[],
) {
  const working = await readOrderStockWorkingSet(transaction, matched)
  for (const line of matched) {
    releaseStock(working, toStockRequest(line))
  }

  commitStockWorkingSet(transaction, working)
}

function releaseAll(working: StockWorkingSet, matched: MatchedOrderLine[]) {
  for (const line of matched) {
    releaseStock(working, toStockRequest(line))
  }
}

function reserveAll(working: StockWorkingSet, matched: MatchedOrderLine[]) {
  for (const line of matched) {
    const failure = reserveStock(working, toStockRequest(line))
    if (!failure) {
      continue
    }

    throw new Error(failure.reason === 'missing-product' ? 'MISSING_PRODUCT' : 'INSUFFICIENT_STOCK')
  }
}

export async function settlePrepaidPaid(input: {
  db: Firestore
  orderRef: DocumentReference
  orderId: string
  data: PrepaidOrderData
  paymentEventId: string
  trxId?: string
}): Promise<SettlePaidResult> {
  const { db, orderRef, orderId, paymentEventId } = input
  const matched = await matchProductRefs(db, input.data.items ?? [])
  const eventRef = db.collection(PAYMENT_EVENTS_COLLECTION).doc(toPaymentEventDocId(paymentEventId))

  return db.runTransaction(async (transaction) => {
    // All reads must happen before any write inside a Firestore transaction.
    const snap = await transaction.get(orderRef)
    if (!snap.exists) {
      throw new Error('ORDER_MISSING')
    }

    const live = snap.data() as PrepaidOrderData
    if (live.archived) {
      throw new Error('ORDER_ARCHIVED')
    }

    const eventSnap = await transaction.get(eventRef)
    if (eventSnap.exists) {
      return 'already-settled' as const
    }

    if (String(live.paymentStatus ?? '') === 'paid') {
      return 'already-settled' as const
    }

    const couponId = String(live.couponId ?? '').trim()
    const couponRef = couponId ? db.collection('coupons').doc(couponId) : null
    const couponSnap = couponRef ? await transaction.get(couponRef) : null
    const working = !live.stockCommitted
      ? await readOrderStockWorkingSet(transaction, matched)
      : (new Map() as StockWorkingSet)

    if (!live.stockCommitted) {
      reserveAll(working, matched)
    }

    commitStockWorkingSet(transaction, working)

    transaction.create(eventRef, {
      orderId,
      outcome: 'paid',
      paymentEventId,
      ...(input.trxId ? { trxId: input.trxId } : {}),
      createdAt: FieldValue.serverTimestamp(),
    })

    transaction.update(orderRef, {
      paymentStatus: 'paid',
      status: live.status === 'cancelled' ? 'new' : (live.status ?? 'new'),
      stockCommitted: true,
      paymentEventId,
      prepaidCompletedAt: FieldValue.serverTimestamp(),
      ...(input.trxId ? { paymentTransactionId: input.trxId } : {}),
    })

    if (couponRef && couponSnap?.exists) {
      const coupon = couponSnap.data() as { status?: string; orderId?: string; usageCount?: number; maxUsage?: number }
      if (coupon.orderId === orderId) {
        return 'applied' as const
      }

      const usageCount = Number(coupon.usageCount ?? 0)
      const maxUsage = Math.max(1, Number(coupon.maxUsage ?? 1) || 1)
      if (String(coupon.status ?? '') === 'active' && usageCount < maxUsage) {
        const nextUsage = usageCount + 1
        transaction.update(couponRef, {
          status: nextUsage >= maxUsage ? 'used' : 'active',
          usageCount: nextUsage,
          orderId,
          discountAmount: Number(live.couponDiscountAmount ?? 0),
          usedAt: FieldValue.serverTimestamp(),
        })
      }
    }

    return 'applied' as const
  }).then((result) => {
    if (result === 'applied') {
      const purchaseContentIds = (input.data.items ?? [])
        .map((item) => String(item.slug ?? '').trim())
        .filter(Boolean)
      const settledPurchaseEventId = String(input.data.purchaseEventId ?? '').trim() || `purchase-${orderId}`

      void sendConversionsApiEvent({
        eventName: 'Purchase',
        eventId: settledPurchaseEventId,
        eventSourceUrl: 'https://www.shisfashion.com/order-success',
        customData: {
          value: Number(input.data.total ?? 0),
          currency: 'BDT',
          content_type: 'product',
          content_ids: purchaseContentIds,
          content_name: purchaseContentIds.length === 1
            ? input.data.items?.[0]?.name
            : `${purchaseContentIds.length} items`,
          order_id: orderId,
          num_items: (input.data.items ?? []).reduce((sum, item) => sum + Number(item.quantity ?? 0), 0),
        },
        userData: {
          email: input.data.customerEmail,
          phone: input.data.customerPhone,
          firstName: String(input.data.customerName ?? '').split(' ')[0],
          country: 'bd',
        },
      }).catch(() => undefined)
    }

    return result
  })
}

export async function settlePrepaidFailed(input: {
  db: Firestore
  orderRef: DocumentReference
  data: PrepaidOrderData
  paymentEventId: string
}): Promise<SettleFailedResult> {
  const { db, orderRef, paymentEventId } = input
  const matched = await matchProductRefs(db, input.data.items ?? [])
  const eventRef = db.collection(PAYMENT_EVENTS_COLLECTION).doc(toPaymentEventDocId(paymentEventId))

  return db.runTransaction(async (transaction) => {
    const snap = await transaction.get(orderRef)
    if (!snap.exists) {
      throw new Error('ORDER_MISSING')
    }

    const live = snap.data() as PrepaidOrderData
    if (live.archived) {
      throw new Error('ORDER_ARCHIVED')
    }

    if (String(live.paymentStatus ?? '') === 'paid') {
      return 'ignored-paid' as const
    }

    const eventSnap = await transaction.get(eventRef)
    if (eventSnap.exists) {
      return 'already-failed' as const
    }

    if (String(live.paymentStatus ?? '') === 'failed' && live.status === 'cancelled' && !live.stockCommitted) {
      return 'already-failed' as const
    }

    const working = live.stockCommitted
      ? await readOrderStockWorkingSet(transaction, matched)
      : (new Map() as StockWorkingSet)

    if (live.stockCommitted) {
      releaseAll(working, matched)
    }

    commitStockWorkingSet(transaction, working)

    transaction.create(eventRef, {
      orderId: orderRef.id,
      outcome: 'failed',
      paymentEventId,
      createdAt: FieldValue.serverTimestamp(),
    })

    transaction.update(orderRef, {
      paymentStatus: 'failed',
      status: 'cancelled',
      stockCommitted: false,
      paymentEventId,
      prepaidFailedAt: FieldValue.serverTimestamp(),
    })

    return 'applied' as const
  })
}

export function amountsMatch(expected: number, received: number) {
  if (!Number.isFinite(expected) || !Number.isFinite(received)) {
    return false
  }

  return Math.abs(expected - received) <= 0.5
}
