import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { getFirestore, doc, getDoc, query, collection, where, limit, getDocs, updateDoc, serverTimestamp } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

if (!getApps().length) {
  initializeApp()
}

const db = getFirestore()

export const validateCoupon = onCall(async (request) => {
  const { code, email } = request.data as { code?: string; email?: string } ?? {}

  if (!code || typeof code !== 'string') {
    throw new HttpsError('invalid-argument', 'Coupon code is required.')
  }

  if (!email || typeof email !== 'string') {
    throw new HttpsError('invalid-argument', 'Customer email is required.')
  }

  const trimmedCode = code.trim().toUpperCase()
  const trimmedEmail = email.trim().toLowerCase()

  if (!/^[A-Z]{3,}-\w{3,}$/.test(trimmedCode)) {
    throw new HttpsError('invalid-argument', 'Invalid coupon code format.')
  }

  const q = query(collection(db, 'coupons'), where('code', '==', trimmedCode), limit(1))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    throw new HttpsError('not-found', 'Invalid or expired coupon code.')
  }

  const couponDoc = snapshot.docs[0]
  const coupon = couponDoc.data() as {
    code: string
    discountPercent: number
    customerEmail: string
    status: string
    expiryDate: string
    usageCount: number
    maxUsage: number
    id?: string
  }

  if (coupon.status !== 'active') {
    throw new HttpsError('failed-precondition', 'This coupon is no longer active.')
  }

  const expiryDate = new Date(coupon.expiryDate)
  if (expiryDate <= new Date()) {
    throw new HttpsError('failed-precondition', 'This coupon has expired.')
  }

  if (coupon.usageCount >= coupon.maxUsage) {
    throw new HttpsError('failed-precondition', 'This coupon has already been used.')
  }

  if (coupon.customerEmail !== trimmedEmail) {
    throw new HttpsError('permission-denied', 'This coupon is not valid for this email.')
  }

  const discountAmount = Math.round(100 * coupon.discountPercent) / 100

  return {
    valid: true,
    coupon: {
      id: couponDoc.id,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      customerEmail: coupon.customerEmail,
      status: coupon.status,
      expiryDate: coupon.expiryDate,
      usageCount: coupon.usageCount,
      maxUsage: coupon.maxUsage,
    },
    discountAmount,
  }
})

export const redeemCoupon = onCall(async (request) => {
  const { code, email, orderId } = request.data as { code?: string; email?: string; orderId?: string } ?? {}

  if (!code || !email || !orderId) {
    throw new HttpsError('invalid-argument', 'Code, email, and order ID are required.')
  }

  const trimmedCode = code.trim().toUpperCase()
  const trimmedEmail = email.trim().toLowerCase()

  const q = query(collection(db, 'coupons'), where('code', '==', trimmedCode), limit(1))
  const snapshot = await getDocs(q)

  if (snapshot.empty) {
    throw new HttpsError('not-found', 'Invalid coupon code.')
  }

  const couponRef = doc(db, 'coupons', snapshot.docs[0].id)
  const coupon = (await getDoc(couponRef)).data() as {
    status: string
    expiryDate: string
    usageCount: number
    maxUsage: number
    customerEmail: string
  }

  if (coupon.status !== 'active') {
    throw new HttpsError('failed-precondition', 'This coupon is no longer active.')
  }

  if (new Date(coupon.expiryDate) <= new Date()) {
    throw new HttpsError('failed-precondition', 'This coupon has expired.')
  }

  if (coupon.usageCount >= coupon.maxUsage) {
    throw new HttpsError('failed-precondition', 'This coupon has already been used.')
  }

  if (coupon.customerEmail !== trimmedEmail) {
    throw new HttpsError('permission-denied', 'This coupon is not valid for this email.')
  }

  await updateDoc(couponRef, {
    status: 'used',
    usageCount: 1,
    orderId,
    usedAt: serverTimestamp(),
  })

  return { redeemed: true, couponCode: trimmedCode }
})