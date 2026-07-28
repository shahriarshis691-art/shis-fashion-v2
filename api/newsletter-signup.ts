import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getFirebaseAdminDb } from './_firebaseAdmin'

export const config = {
  runtime: 'nodejs',
}

interface LooseRequest {
  method?: string
  body?: unknown
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  json: (payload: unknown) => void
}

interface NewsletterSignupBody {
  email?: string
}

const COUPON_PREFIX = 'SHIS-'
const COUPON_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const COUPON_CODE_LENGTH = 6
const COUPON_DEFAULT_PERCENT = 5
const COUPON_MAX_USAGE = 1
const COUPON_EXPIRY_DAYS = 30

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function generateCouponCode() {
  let code = ''
  for (let index = 0; index < COUPON_CODE_LENGTH; index += 1) {
    code += COUPON_CODE_CHARS.charAt(Math.floor(Math.random() * COUPON_CODE_CHARS.length))
  }

  return `${COUPON_PREFIX}${code}`
}

function computeCouponExpiry() {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + COUPON_EXPIRY_DAYS)
  return expiry.toISOString()
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const configuredDb = getFirebaseAdminDb()
  if (!configuredDb) {
    res.status(500).json({ error: 'Firebase Admin is not configured' })
    return
  }
  const db = getFirestore()

  const body = (req.body ?? {}) as NewsletterSignupBody
  const email = body.email?.trim().toLowerCase() ?? ''

  if (!email || !isValidEmail(email)) {
    res.status(400).json({ error: 'Invalid email address.' })
    return
  }

  const subscriberQuery = db.collection('newsletterSubscribers').where('email', '==', email).limit(1)
  const subscriberSnapshot = await subscriberQuery.get()

  if (!subscriberSnapshot.empty) {
    const subscriberDoc = subscriberSnapshot.docs[0]
    const subscriberData = subscriberDoc.data() as {
      couponUsed?: string
      couponId?: string
    }

    let couponCode = subscriberData.couponUsed?.trim() ?? ''
    let couponId = subscriberData.couponId?.trim() ?? ''

    if (!couponCode || !couponId) {
      const generatedCouponCode = generateCouponCode()
      const couponRef = db.collection('coupons').doc()
      await couponRef.set({
        code: generatedCouponCode,
        discountPercent: COUPON_DEFAULT_PERCENT,
        customerEmail: email,
        createdDate: FieldValue.serverTimestamp(),
        expiryDate: computeCouponExpiry(),
        status: 'active',
        usageCount: 0,
        maxUsage: COUPON_MAX_USAGE,
      })

      couponCode = generatedCouponCode
      couponId = couponRef.id

      await subscriberDoc.ref.update({
        couponUsed: couponCode,
        couponId,
        popupStatus: 'completed',
      })
    }

    res.status(200).json({
      subscriberId: subscriberDoc.id,
      couponCode,
      couponId,
      alreadySubscribed: true,
    })
    return
  }

  const couponCode = generateCouponCode()
  const couponRef = db.collection('coupons').doc()
  await couponRef.set({
    code: couponCode,
    discountPercent: COUPON_DEFAULT_PERCENT,
    customerEmail: email,
    createdDate: FieldValue.serverTimestamp(),
    expiryDate: computeCouponExpiry(),
    status: 'active',
    usageCount: 0,
    maxUsage: COUPON_MAX_USAGE,
  })

  const subscriberRef = db.collection('newsletterSubscribers').doc()
  await subscriberRef.set({
    email,
    signupDate: FieldValue.serverTimestamp(),
    source: 'website_popup',
    couponUsed: couponCode,
    couponId: couponRef.id,
    popupStatus: 'completed',
  })

  res.status(200).json({
    subscriberId: subscriberRef.id,
    couponCode,
    couponId: couponRef.id,
    alreadySubscribed: false,
  })
}