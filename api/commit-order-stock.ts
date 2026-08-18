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

interface OrderItem {
  name?: string
  slug?: string
  quantity?: number
}

interface CommitStockBody {
  orderId?: string
}

const isRateLimited = createRateLimiter(30)

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  if (isRateLimited(getClientIp(req.headers))) {
    res.status(429).json({ ok: false, error: 'Too many requests.' })
    return
  }

  const db = getFirebaseAdminDb()
  if (!db) {
    res.status(500).json({ ok: false, error: 'Firebase Admin is not configured' })
    return
  }

  const orderId = String((req.body as CommitStockBody | undefined)?.orderId ?? '').trim()
  if (!orderId) {
    res.status(400).json({ ok: false, error: 'Order id is required.' })
    return
  }

  const orderRef = db.collection('orders').doc(orderId)
  const orderSnapshot = await orderRef.get()
  if (!orderSnapshot.exists) {
    res.status(404).json({ ok: false, error: 'Order not found.' })
    return
  }

  const orderData = orderSnapshot.data() as { stockCommitted?: boolean; items?: OrderItem[] }
  if (orderData.stockCommitted) {
    res.status(200).json({ ok: true, skipped: true })
    return
  }

  const items = Array.isArray(orderData.items) ? orderData.items : []
  const productsSnapshot = await db.collection('products').get()
  const products = productsSnapshot.docs.filter((doc) => !(doc.data() as { archived?: boolean }).archived)

  const adjustments = items.flatMap((item) => {
    const quantity = Math.max(0, Number(item.quantity ?? 0))
    if (!quantity) {
      return []
    }

    const itemSlug = slugify(item.slug ?? item.name ?? '')
    const itemName = (item.name ?? '').trim().toLowerCase()
    const match = products.find((doc) => {
      const productName = String((doc.data() as { name?: string }).name ?? '').trim()
      return slugify(productName) === itemSlug || productName.toLowerCase() === itemName
    })

    return match ? [{ id: match.id, quantity }] : []
  })

  await db.runTransaction(async (transaction) => {
    const freshOrder = await transaction.get(orderRef)
    if (!freshOrder.exists || (freshOrder.data() as { stockCommitted?: boolean } | undefined)?.stockCommitted) {
      return
    }

    const productRefs = adjustments.map((entry) => db.collection('products').doc(entry.id))
    const productSnaps = []
    for (const productRef of productRefs) {
      productSnaps.push(await transaction.get(productRef))
    }

    productSnaps.forEach((snap, index) => {
      if (!snap.exists) {
        return
      }

      const quantity = adjustments[index]?.quantity ?? 0
      const stock = Number((snap.data() as { stock?: number } | undefined)?.stock ?? 0)
      transaction.update(productRefs[index], { stock: Math.max(0, stock - quantity) })
    })

    transaction.update(orderRef, { stockCommitted: true })
  })

  res.status(200).json({ ok: true })
}
