import { getFirestore } from 'firebase-admin/firestore'
import { getFirebaseAdminDb } from '../_firebaseAdmin.js'
import { createRateLimiter, getClientIp } from '../_rateLimit.js'

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
  email?: string
  couponId?: string
  orderId?: string
  discountAmount?: number
}

const isValidateLimited = createRateLimiter(30, 60_000, 'validate-coupon')

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

  if (action === 'redeem') {
    res.status(401).json({ redeemed: false, error: 'Unauthorized' })
    return
  }

  if (action === 'validate' && await isValidateLimited(clientIp)) {
    res.status(429).json({ valid: false, error: 'Too many requests.' })
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
      customerEmail?: string
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

    const boundEmail = String(coupon.customerEmail ?? '').trim().toLowerCase()
    const providedEmail = String(body.email ?? '').trim().toLowerCase()
    if (boundEmail) {
      if (!providedEmail) {
        res.status(409).json({ valid: false, error: 'Enter the email this coupon was issued to.', emailRequired: true })
        return
      }

      if (boundEmail !== providedEmail) {
        res.status(409).json({ valid: false, error: 'This coupon is not valid for this email.' })
        return
      }
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

  res.status(400).json({ error: 'Invalid action.' })
}
