import { FieldValue } from 'firebase-admin/firestore'
import type { DocumentReference, Firestore, Transaction } from 'firebase-admin/firestore'
import { getAvailableStock, productMatchesSlug } from './_catalog.js'

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
  archived?: boolean
}

export type SettlePaidResult = 'applied' | 'already-settled'
export type SettleFailedResult = 'applied' | 'already-failed' | 'ignored-paid'

interface WorkingProduct {
  ref: DocumentReference
  variants: ReturnType<typeof getAvailableStock>['variants']
  stock: number
}

function toQty(value: unknown) {
  return Math.max(0, Math.floor(Number(value ?? 0)))
}

function productStockTotal(product: WorkingProduct) {
  if (product.variants.length) {
    return product.variants.reduce((sum, variant) => sum + variant.stock, 0)
  }

  return Math.max(0, product.stock)
}

async function matchProductRefs(db: Firestore, items: PrepaidOrderItem[]) {
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

async function readWorkingProducts(
  transaction: Transaction,
  matched: Array<{ item: PrepaidOrderItem; ref: DocumentReference | null }>,
  requireAll: boolean,
) {
  const working = new Map<string, WorkingProduct>()

  for (const entry of matched) {
    if (!entry.ref) {
      if (requireAll) {
        throw new Error('MISSING_PRODUCT')
      }
      continue
    }

    if (working.has(entry.ref.path)) {
      continue
    }

    const productSnap = await transaction.get(entry.ref)
    const product = (productSnap.data() ?? {}) as { stock?: unknown; variants?: unknown }
    const available = getAvailableStock(product, '', '')
    const stock = available.variants.length
      ? available.variants.reduce((sum, variant) => sum + variant.stock, 0)
      : Math.max(0, Number(product.stock ?? 0) || 0)

    working.set(entry.ref.path, {
      ref: entry.ref,
      variants: available.variants.map((variant) => ({ ...variant })),
      stock,
    })
  }

  return working
}

function applyLineToWorking(product: WorkingProduct, item: PrepaidOrderItem, mode: 'decrement' | 'restore') {
  const qty = toQty(item.quantity)
  if (qty <= 0) {
    return
  }

  const available = getAvailableStock(
    { stock: product.stock, variants: product.variants },
    String(item.size ?? ''),
    String(item.color ?? ''),
  )

  if (mode === 'decrement') {
    if (available.stock < qty) {
      throw new Error('INSUFFICIENT_STOCK')
    }

    if (available.variantIndex >= 0) {
      product.variants = product.variants.map((variant, index) => (
        index === available.variantIndex
          ? { ...variant, stock: Math.max(0, variant.stock - qty) }
          : variant
      ))
      product.stock = productStockTotal(product)
      return
    }

    product.stock = Math.max(0, product.stock - qty)
    return
  }

  if (available.variantIndex >= 0) {
    product.variants = product.variants.map((variant, index) => (
      index === available.variantIndex
        ? { ...variant, stock: variant.stock + qty }
        : variant
    ))
    product.stock = productStockTotal(product)
    return
  }

  product.stock += qty
}

function writeWorkingProducts(transaction: Transaction, working: Map<string, WorkingProduct>) {
  for (const product of working.values()) {
    transaction.update(product.ref, {
      variants: product.variants,
      stock: productStockTotal(product),
    })
  }
}

export async function matchOrderProductRefs(db: Firestore, items: PrepaidOrderItem[]) {
  return matchProductRefs(db, items)
}

export async function restoreMatchedInventory(
  transaction: Transaction,
  matched: Array<{ item: PrepaidOrderItem; ref: DocumentReference | null }>,
) {
  const working = await readWorkingProducts(transaction, matched, false)
  for (const entry of matched) {
    if (!entry.ref) {
      continue
    }

    const product = working.get(entry.ref.path)
    if (!product) {
      continue
    }

    applyLineToWorking(product, entry.item, 'restore')
  }

  writeWorkingProducts(transaction, working)
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
      return 'already-settled' as const
    }

    const couponId = String(live.couponId ?? '').trim()
    const couponRef = couponId ? db.collection('coupons').doc(couponId) : null
    const couponSnap = couponRef ? await transaction.get(couponRef) : null
    const working = !live.stockCommitted
      ? await readWorkingProducts(transaction, matched, true)
      : new Map<string, WorkingProduct>()

    if (!live.stockCommitted) {
      for (const entry of matched) {
        if (!entry.ref) {
          throw new Error('MISSING_PRODUCT')
        }
        const product = working.get(entry.ref.path)
        if (!product) {
          throw new Error('MISSING_PRODUCT')
        }
        applyLineToWorking(product, entry.item, 'decrement')
      }
    }

    writeWorkingProducts(transaction, working)

    transaction.update(orderRef, {
      paymentStatus: 'paid',
      status: live.status === 'cancelled' ? 'new' : (live.status ?? 'new'),
      stockCommitted: true,
      paymentEventId,
      prepaidCompletedAt: FieldValue.serverTimestamp(),
      ...(input.trxId ? { paymentTransactionId: input.trxId } : {}),
    })

    if (couponRef && couponSnap?.exists) {
      const coupon = couponSnap.data() as { status?: string; orderId?: string }
      const alreadyBound = coupon.orderId === orderId
      const stolen = coupon.status === 'used' && Boolean(coupon.orderId) && coupon.orderId !== orderId
      if (!stolen || alreadyBound) {
        transaction.update(couponRef, {
          status: 'used',
          usageCount: 1,
          orderId,
          discountAmount: Number(live.couponDiscountAmount ?? 0),
          usedAt: FieldValue.serverTimestamp(),
        })
      }
    }

    return 'applied' as const
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

    if (String(live.paymentStatus ?? '') === 'failed' && live.status === 'cancelled' && !live.stockCommitted) {
      return 'already-failed' as const
    }

    const working = live.stockCommitted
      ? await readWorkingProducts(transaction, matched, false)
      : new Map<string, WorkingProduct>()

    if (live.stockCommitted) {
      for (const entry of matched) {
        if (!entry.ref) {
          continue
        }
        const product = working.get(entry.ref.path)
        if (!product) {
          continue
        }
        applyLineToWorking(product, entry.item, 'restore')
      }
    }

    writeWorkingProducts(transaction, working)

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
