import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getFirebaseAdminDb } from './_firebaseAdmin.js'
import { createRateLimiter, getClientIp } from './_rateLimit.js'

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

interface ValidateCouponBody {
  action?: 'validate' | 'redeem'
  code?: string
  couponId?: string
  orderId?: string
  discountAmount?: number
}

const isValidateLimited = createRateLimiter(30)
const isRedeemLimited = createRateLimiter(10)

function isCouponCodeValid(code: string) {
  return /^[A-Z]{3,}-[A-Z0-9]{3,}$/i.test(code)
}

function isCouponExpired(expiryDate: string) {
  const parsed = new Date(expiryDate)
  return Number.isNaN(parsed.getTime()) || parsed <= new Date()
}

async function findCoupon(db: NonNullable<ReturnType<typeof getFirebaseAdminDb>>, code?: string, couponId?: string) {
  if (couponId?.trim()) {
    const couponRef = db.collection('coupons').doc(couponId.trim())
    const snapshot = await couponRef.get()
    return snapshot.exists ? snapshot : null
  }

  const normalizedCode = code?.trim().toUpperCase() ?? ''
  if (!normalizedCode) {
    return null
  }

  const couponQuery = db.collection('coupons').where('code', '==', normalizedCode).limit(1)
  const couponSnapshot = await couponQuery.get()
  return couponSnapshot.empty ? null : couponSnapshot.docs[0]
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const body = (req.body ?? {}) as ValidateCouponBody
  const action = body.action ?? 'validate'
  const clientIp = getClientIp(req.headers)

  if (action === 'validate' && isValidateLimited(clientIp)) {
    res.status(429).json({ valid: false, error: 'Too many requests.' })
    return
  }

  if (action === 'redeem' && isRedeemLimited(clientIp)) {
    res.status(429).json({ redeemed: false, error: 'Too many requests.' })
    return
  }

  const configuredDb = getFirebaseAdminDb()
  if (!configuredDb) {
    res.status(500).json({ error: 'Firebase Admin is not configured' })
    return
  }
  const db = getFirestore()

  if (action === 'validate') {
    const code = body.code?.trim().toUpperCase() ?? ''

    if (!isCouponCodeValid(code)) {
      res.status(400).json({ valid: false, error: 'Invalid coupon code format.' })
      return
    }

    const couponSnapshot = await findCoupon(db, code)
    if (!couponSnapshot) {
      res.status(404).json({ valid: false, error: 'Invalid or expired coupon code.' })
      return
    }

    const coupon = couponSnapshot.data() as {
      code: string
      discountPercent: number
      expiryDate: string
      status: 'active' | 'used' | 'disabled' | 'expired'
      usageCount: number
      maxUsage: number
    }

    if (coupon.status !== 'active') {
      res.status(409).json({ valid: false, error: 'This coupon is no longer active.' })
      return
    }

    if (isCouponExpired(coupon.expiryDate)) {
      res.status(409).json({ valid: false, error: 'This coupon has expired.' })
      return
    }

    if (coupon.usageCount >= coupon.maxUsage) {
      res.status(409).json({ valid: false, error: 'This coupon has already been used.' })
      return
    }

    res.status(200).json({
      valid: true,
      coupon: {
        id: couponSnapshot.id,
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        expiryDate: coupon.expiryDate,
        status: coupon.status,
        usageCount: coupon.usageCount,
        maxUsage: coupon.maxUsage,
      },
    })
    return
  }

  if (action === 'redeem') {
    const orderId = body.orderId?.trim() ?? ''
    const discountAmount = Number(body.discountAmount ?? 0)
    const code = body.code?.trim().toUpperCase() ?? ''
    const couponId = body.couponId?.trim() ?? ''

    if (!orderId || (!couponId && !isCouponCodeValid(code))) {
      res.status(400).json({ redeemed: false, error: 'Coupon and order details are required.' })
      return
    }

    const orderSnapshot = await db.collection('orders').doc(orderId).get()
    if (!orderSnapshot.exists) {
      res.status(404).json({ redeemed: false, error: 'Order not found.' })
      return
    }

    const couponSnapshot = await findCoupon(db, code, couponId)
    if (!couponSnapshot) {
      res.status(404).json({ redeemed: false, error: 'Invalid coupon code.' })
      return
    }

    const coupon = couponSnapshot.data() as {
      expiryDate: string
      status: 'active' | 'used' | 'disabled' | 'expired'
      usageCount: number
      maxUsage: number
      orderId?: string
      code: string
    }

    if (coupon.orderId === orderId) {
      res.status(200).json({ redeemed: true, couponCode: coupon.code, couponId: couponSnapshot.id })
      return
    }

    if (coupon.status !== 'active') {
      res.status(409).json({ redeemed: false, error: 'This coupon is no longer active.' })
      return
    }

    if (isCouponExpired(coupon.expiryDate)) {
      res.status(409).json({ redeemed: false, error: 'This coupon has expired.' })
      return
    }

    if (coupon.usageCount >= coupon.maxUsage) {
      res.status(409).json({ redeemed: false, error: 'This coupon has already been used.' })
      return
    }

    await couponSnapshot.ref.update({
      status: 'used',
      usageCount: 1,
      orderId,
      discountAmount: Number.isFinite(discountAmount) ? discountAmount : 0,
      usedAt: FieldValue.serverTimestamp(),
    })

    res.status(200).json({ redeemed: true, couponCode: coupon.code, couponId: couponSnapshot.id })
    return
  }

  res.status(400).json({ error: 'Invalid action.' })
}
