import { FieldValue, getFirestore, type DocumentReference } from 'firebase-admin/firestore'
import { getFirebaseAdminDb } from '../_firebaseAdmin.js'
import { createRateLimiter, getClientIp } from '../_rateLimit.js'
import { sendOpsWebhook } from '../_opsWebhook.js'
import { getAvailableStock, getProductSlug, productMatchesSlug } from '../_catalog.js'
import { notifyCustomer } from '../_notifyCustomer.js'
import { getConfiguredPrepaidProvider, startPrepaidCheckout } from '../_prepaidProvider.js'
import { applyStockDecrement, applyStockRestore } from '../_stock.js'
import {
  isApiPrepaidPayment,
  isManualWalletPayment,
  isValidWalletTransactionId,
  normalizeWalletTransactionId,
  resolvePaymentStatus,
} from '../_payment.js'

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

interface OrderItemInput {
  name?: string
  price?: string
  quantity?: number
  size?: string
  color?: string
  slug?: string
}

interface DeliveryAddressInput {
  division?: string
  district?: string
  upazila?: string
  streetAddress?: string
  deliveryNote?: string
}

interface CreateOrderBody {
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  address?: string
  notes?: string
  items?: OrderItemInput[]
  couponCode?: string
  deliveryAddress?: DeliveryAddressInput
  paymentMethod?: string
  paymentTransactionId?: string
}

interface ProductRecord {
  name?: string
  slug?: string
  price?: string
  stock?: number
  archived?: boolean
  sizes?: string[]
  colors?: string[]
  variants?: unknown
}

interface CouponRecord {
  code?: string
  discountPercent?: number
  customerEmail?: string
  expiryDate?: string
  status?: string
  usageCount?: number
  maxUsage?: number
  orderId?: string
}

interface HomepageRecord {
  freeDeliveryThreshold?: number
}

const isRateLimited = createRateLimiter(8)
const DHAKA_DELIVERY_CHARGE = 80
const OUTSIDE_DHAKA_DELIVERY_CHARGE = 130
const DEFAULT_FREE_DELIVERY_THRESHOLD = 3000
const LOW_STOCK_THRESHOLD = 5
const VALID_DIVISIONS = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh'] as const

function parseBDT(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const numericValue = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isNaN(numericValue) ? 0 : numericValue
}

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('8801') && digits.length === 13) {
    return `0${digits.slice(3)}`
  }

  if (digits.startsWith('01') && digits.length === 11) {
    return digits
  }

  return ''
}

function isCouponExpired(expiryDate: string) {
  const parsed = new Date(expiryDate)
  return Number.isNaN(parsed.getTime()) || parsed <= new Date()
}

function getBaseDeliveryCharge(division: string) {
  return division === 'Dhaka' ? DHAKA_DELIVERY_CHARGE : OUTSIDE_DHAKA_DELIVERY_CHARGE
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (isRateLimited(getClientIp(req.headers))) {
    res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' })
    return
  }

  const configuredDb = getFirebaseAdminDb()
  if (!configuredDb) {
    res.status(500).json({ error: 'Order service is not configured.' })
    return
  }
  const db = getFirestore()

  const body = (req.body ?? {}) as CreateOrderBody
  const customerName = String(body.customerName ?? '').trim()
  const customerPhone = normalizePhone(String(body.customerPhone ?? ''))
  const customerEmail = String(body.customerEmail ?? '').trim().toLowerCase()
  const streetAddress = String(body.deliveryAddress?.streetAddress ?? '').trim()
  const division = String(body.deliveryAddress?.division ?? '').trim()
  const district = String(body.deliveryAddress?.district ?? '').trim()
  const upazila = String(body.deliveryAddress?.upazila ?? '').trim()
  const deliveryNote = String(body.deliveryAddress?.deliveryNote ?? body.notes ?? '').trim()
  const composedAddress = String(body.address ?? '').trim()
    || [streetAddress, upazila, district, division].filter(Boolean).join(', ')
  const items = Array.isArray(body.items) ? body.items : []
  const couponCode = String(body.couponCode ?? '').trim().toUpperCase()
  const requestedPayment = String(body.paymentMethod ?? 'Cash on Delivery').trim()
  const isManualWallet = isManualWalletPayment(requestedPayment)
  const isApiPrepaid = isApiPrepaidPayment(requestedPayment)
  const paymentTransactionId = normalizeWalletTransactionId(String(body.paymentTransactionId ?? ''))

  if (customerName.length < 2 || customerName.length > 100) {
    res.status(400).json({ error: 'Please enter a valid full name.' })
    return
  }

  if (!/^01[0-9]{9}$/.test(customerPhone)) {
    res.status(400).json({ error: 'Please enter a valid Bangladesh phone number (01XXXXXXXXX).' })
    return
  }

  if (composedAddress.length < 5 || composedAddress.length > 500) {
    res.status(400).json({ error: 'Please enter your full address.' })
    return
  }

  if (!VALID_DIVISIONS.includes(division as (typeof VALID_DIVISIONS)[number]) || !district || !upazila || streetAddress.length < 5) {
    res.status(400).json({ error: 'Please complete your delivery address.' })
    return
  }

  if (!items.length || items.length > 20) {
    res.status(400).json({ error: 'Your bag must contain between 1 and 20 products.' })
    return
  }

  if (isApiPrepaid && !getConfiguredPrepaidProvider()) {
    res.status(503).json({ error: 'Online payment is not configured. Please choose Cash on Delivery or Send Money.', skipped: true })
    return
  }

  if (isManualWallet) {
    if (!isValidWalletTransactionId(paymentTransactionId)) {
      res.status(400).json({ error: 'Enter the Transaction ID (TrxID) from your bKash or Nagad app.' })
      return
    }

    const duplicateTrx = await db.collection('orders')
      .where('paymentTransactionId', '==', paymentTransactionId)
      .limit(1)
      .get()

    if (!duplicateTrx.empty) {
      res.status(409).json({ error: 'This Transaction ID was already used on another order. Check the ID or contact support.' })
      return
    }
  }

  const productsSnapshot = await db.collection('products').get()
  const liveProducts = productsSnapshot.docs.filter((doc) => !(doc.data() as ProductRecord).archived)

  const matchedItems = items.map((item) => {
    const quantity = Math.max(0, Math.floor(Number(item.quantity ?? 0)))
    const name = String(item.name ?? '').trim()
    const itemSlug = String(item.slug ?? name).trim()
    const size = String(item.size ?? '').trim()
    const color = String(item.color ?? '').trim()
    const match = liveProducts.find((doc) => {
      const data = doc.data() as ProductRecord
      const productName = String(data.name ?? '').trim()
      return productMatchesSlug(data, itemSlug) || productName.toLowerCase() === name.toLowerCase()
    })

    return { item, quantity, name, size, color, match }
  })

  if (matchedItems.some((entry) => !entry.quantity || !entry.name || !entry.match)) {
    res.status(409).json({ error: 'One or more products are unavailable. Refresh the page and try again.' })
    return
  }

  let couponRef: DocumentReference | null = null
  if (couponCode) {
    if (!/^[A-Z]{3,}-[A-Z0-9]{3,}$/.test(couponCode)) {
      res.status(400).json({ error: 'Invalid coupon code format.' })
      return
    }

    const couponSnapshot = await db.collection('coupons').where('code', '==', couponCode).limit(1).get()
    if (couponSnapshot.empty) {
      res.status(409).json({ error: 'Invalid or expired coupon code.' })
      return
    }

    couponRef = couponSnapshot.docs[0].ref
    const coupon = couponSnapshot.docs[0].data() as CouponRecord
    const boundEmail = String(coupon.customerEmail ?? '').trim().toLowerCase()
    const usageCount = Number(coupon.usageCount ?? 0)
    const maxUsage = Number(coupon.maxUsage ?? 1)

    if (coupon.status !== 'active' || isCouponExpired(String(coupon.expiryDate ?? '')) || usageCount >= maxUsage) {
      res.status(409).json({ error: 'This coupon is no longer active.' })
      return
    }

    if (boundEmail) {
      if (!customerEmail) {
        res.status(409).json({ error: 'Enter the email this coupon was issued to.' })
        return
      }

      if (boundEmail !== customerEmail) {
        res.status(409).json({ error: 'This coupon is not valid for this email.' })
        return
      }
    }
  }

  const homepageSnapshot = await db.collection('settings').doc('homepage').get()
  const freeDeliveryThreshold = Number((homepageSnapshot.data() as HomepageRecord | undefined)?.freeDeliveryThreshold)
  const threshold = Number.isFinite(freeDeliveryThreshold) ? Math.max(0, Math.round(freeDeliveryThreshold)) : DEFAULT_FREE_DELIVERY_THRESHOLD

  try {
    const created = await db.runTransaction(async (transaction) => {
      const productRefs = matchedItems.map((entry) => entry.match!.ref)
      const productSnaps = []
      for (const productRef of productRefs) {
        productSnaps.push(await transaction.get(productRef))
      }

      const couponSnap = couponRef ? await transaction.get(couponRef) : null
      const pricedItems = productSnaps.map((snap, index) => {
        const entry = matchedItems[index]
        const data = (snap.data() ?? {}) as ProductRecord
        const sizes = Array.isArray(data.sizes) ? data.sizes.map((value) => String(value).trim()).filter(Boolean) : []
        const colors = Array.isArray(data.colors) ? data.colors.map((value) => String(value).trim()).filter(Boolean) : []
        const available = getAvailableStock(data, entry?.size ?? '', entry?.color ?? '')
        const variantsConfigured = available.variants.length > 0

        if (!snap.exists || data.archived) {
          throw new Error('INSUFFICIENT_STOCK')
        }

        if (sizes.length && entry?.size && !sizes.includes(entry.size)) {
          throw new Error('INVALID_VARIANT')
        }

        if (colors.length && entry?.color && entry.color !== 'Default' && !colors.includes(entry.color)) {
          throw new Error('INVALID_VARIANT')
        }

        if (variantsConfigured && available.variantIndex < 0) {
          throw new Error('INVALID_VARIANT')
        }

        if (available.stock < (entry?.quantity ?? 0)) {
          throw new Error('INSUFFICIENT_STOCK')
        }

        return {
          name: String(data.name ?? entry?.name ?? ''),
          price: String(data.price ?? ''),
          quantity: entry?.quantity ?? 0,
          size: entry?.size || undefined,
          color: entry?.color || undefined,
          slug: getProductSlug(data),
          unitPrice: parseBDT(data.price),
          productRef: snap.ref,
          stock: available.stock,
          variants: available.variants,
          variantIndex: available.variantIndex,
        }
      })

      const subtotal = pricedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      if (subtotal <= 0) {
        throw new Error('INVALID_TOTAL')
      }

      let discountPercent = 0
      let couponId = ''
      if (couponSnap?.exists) {
        const liveCoupon = couponSnap.data() as CouponRecord
        const usageCount = Number(liveCoupon.usageCount ?? 0)
        const maxUsage = Number(liveCoupon.maxUsage ?? 1)
        if (liveCoupon.status !== 'active' || isCouponExpired(String(liveCoupon.expiryDate ?? '')) || usageCount >= maxUsage) {
          throw new Error('COUPON_INACTIVE')
        }

        discountPercent = Math.min(100, Math.max(0, Number(liveCoupon.discountPercent ?? 0)))
        couponId = couponSnap.id
      }

      const discountAmount = discountPercent ? Math.round(subtotal * discountPercent / 100 * 100) / 100 : 0
      const deliveryCharge = threshold > 0 && subtotal >= threshold ? 0 : getBaseDeliveryCharge(division)
      const total = Math.round((subtotal + deliveryCharge - discountAmount) * 100) / 100
      if (total <= 0) {
        throw new Error('INVALID_TOTAL')
      }

      const orderRef = db.collection('orders').doc()
      const paymentStatus = resolvePaymentStatus({ isApiPrepaid, isManualWallet })
      const orderPayload = {
        customerName,
        customerPhone,
        customerEmail,
        address: composedAddress,
        deliveryAddress: {
          division,
          district,
          upazila,
          streetAddress,
          deliveryNote,
        },
        deliveryCharge,
        notes: deliveryNote,
        items: pricedItems.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          slug: item.slug,
        })),
        total,
        status: 'new',
        trackingNumber: '',
        paymentMethod: isApiPrepaid
          ? (getConfiguredPrepaidProvider() === 'sslcommerz' ? 'SSLCOMMERZ' : 'bKash')
          : requestedPayment,
        paymentStatus,
        createdAt: FieldValue.serverTimestamp(),
        stockCommitted: true,
        ...(isManualWallet ? { paymentTransactionId } : {}),
        ...(couponCode && couponId ? {
          couponCode,
          couponDiscountPercent: discountPercent,
          couponDiscountAmount: discountAmount,
          couponId,
        } : {}),
      }

      transaction.set(orderRef, orderPayload)

      pricedItems.forEach((item) => {
        applyStockDecrement(transaction, item)
      })

      if (!isApiPrepaid && couponSnap?.exists && couponRef) {
        transaction.update(couponRef, {
          status: 'used',
          usageCount: 1,
          orderId: orderRef.id,
          discountAmount,
          usedAt: FieldValue.serverTimestamp(),
        })
      }

      return {
        id: orderRef.id,
        ...orderPayload,
        createdAt: new Date().toISOString(),
        lowStockAlerts: pricedItems
          .map((item) => ({
            name: item.name,
            remaining: Math.max(0, item.stock - item.quantity),
          }))
          .filter((item) => item.remaining <= LOW_STOCK_THRESHOLD),
      }
    })

    const { lowStockAlerts = [], ...order } = created as typeof created & {
      lowStockAlerts?: Array<{ name: string; remaining: number }>
    }

    if (lowStockAlerts.length) {
      void sendOpsWebhook([
        '*SHIS Low Stock*',
        `Order ${order.id} reduced inventory.`,
        ...lowStockAlerts.map((item) => `${item.name}: ${item.remaining} left`),
      ].join('\n'))
    }

    if (isManualWallet) {
      void sendOpsWebhook([
        '*SHIS Wallet Payment — verify TrxID*',
        `Order ${order.id}`,
        `Method: ${requestedPayment}`,
        `TrxID: ${paymentTransactionId}`,
        `Amount: ৳ ${Number(order.total ?? 0).toLocaleString('en-BD')}`,
        `Phone: ${customerPhone}`,
      ].join('\n'))
    }

    if (isApiPrepaid) {
      const prepaid = await startPrepaidCheckout({
        orderId: order.id,
        amount: Number(order.total ?? 0),
        customerName,
        customerPhone,
        customerEmail,
      })

      if (!prepaid.configured || !prepaid.ok) {
        await db.runTransaction(async (transaction) => {
          const orderRef = db.collection('orders').doc(order.id)
          const orderSnap = await transaction.get(orderRef)
          const orderData = orderSnap.data() as { items?: Array<{ slug?: string; name?: string; quantity?: number; size?: string; color?: string }> } | undefined

          for (const item of orderData?.items ?? []) {
            const qty = Math.max(0, Math.floor(Number(item.quantity ?? 0)))
            const match = liveProducts.find((doc) => {
              const data = doc.data() as ProductRecord
              return productMatchesSlug(data, String(item.slug || item.name || ''))
                || String(data.name || '').trim().toLowerCase() === String(item.name || '').trim().toLowerCase()
            })
            if (!match) {
              continue
            }

            const snap = await transaction.get(match.ref)
            const product = (snap.data() ?? {}) as ProductRecord
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

          transaction.update(orderRef, {
            paymentStatus: 'failed',
            status: 'cancelled',
            stockCommitted: false,
          })
        })
        res.status(502).json({ error: prepaid.configured ? prepaid.error : 'Online payment is not configured. Please choose Cash on Delivery or Send Money.' })
        return
      }

      await db.collection('orders').doc(order.id).update({
        prepaidProvider: prepaid.provider,
        prepaidPaymentId: prepaid.paymentId,
      })

      res.status(200).json({
        order: { ...order, prepaidPaymentId: prepaid.paymentId },
        redirectUrl: prepaid.redirectUrl,
      })
      return
    }

    void notifyCustomer({
      channel: 'order-placed',
      orderId: order.id,
      customerName,
      customerPhone,
      customerEmail,
      paymentMethod: String(order.paymentMethod ?? requestedPayment),
      total: Number(order.total ?? 0),
    })

    res.status(200).json({ order })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'INSUFFICIENT_STOCK') {
      res.status(409).json({ error: 'Some items are out of stock. Update your bag and try again.' })
      return
    }

    if (message === 'INVALID_VARIANT') {
      res.status(409).json({ error: 'A selected size or color is no longer available.' })
      return
    }

    if (message === 'COUPON_INACTIVE') {
      res.status(409).json({ error: 'This coupon is no longer active.' })
      return
    }

    if (message === 'INVALID_TOTAL') {
      res.status(400).json({ error: 'Unable to calculate this order. Please try again.' })
      return
    }

    res.status(500).json({ error: 'Order submission failed. Please try again.' })
  }
}
