import { FieldValue } from 'firebase-admin/firestore'
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

interface ReviewBody {
  productId?: string
  productSlug?: string
  authorName?: string
  rating?: number
  body?: string
}

const isRateLimited = createRateLimiter(5, 10 * 60_000)

function readBody(req: LooseRequest): ReviewBody {
  const raw = req.body
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ReviewBody
    } catch {
      return {}
    }
  }

  return (raw ?? {}) as ReviewBody
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (isRateLimited(getClientIp(req.headers))) {
    res.status(429).json({ error: 'Too many reviews submitted. Please wait a few minutes.' })
    return
  }

  const payload = readBody(req)
  const productId = String(payload.productId ?? '').trim()
  const productSlug = String(payload.productSlug ?? '').trim()
  const authorName = String(payload.authorName ?? '').trim()
  const rating = Math.round(Number(payload.rating ?? 0))
  const body = String(payload.body ?? '').trim()

  if (!productId || productId.length > 80) {
    res.status(400).json({ error: 'Choose a product before submitting a review.' })
    return
  }

  if (authorName.length < 2 || authorName.length > 60) {
    res.status(400).json({ error: 'Enter your name (2–60 characters).' })
    return
  }

  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Choose a rating from 1 to 5.' })
    return
  }

  if (body.length < 10 || body.length > 800) {
    res.status(400).json({ error: 'Write a short review (10–800 characters).' })
    return
  }

  const db = getFirebaseAdminDb()
  if (!db) {
    res.status(503).json({ error: 'Reviews are temporarily unavailable.' })
    return
  }

  try {
    const productSnap = await db.collection('products').doc(productId).get()
    if (!productSnap.exists || (productSnap.data() as { archived?: boolean }).archived) {
      res.status(404).json({ error: 'This product is no longer available for review.' })
      return
    }

    const ref = await db.collection('reviews').add({
      productId,
      productSlug,
      authorName,
      rating,
      body,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    })

    res.status(200).json({ reviewId: ref.id, status: 'pending' })
  } catch {
    res.status(500).json({ error: 'Unable to submit this review right now.' })
  }
}
