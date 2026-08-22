import { getFirebaseAdminDb } from '../_firebaseAdmin.js'
import { getProductSlug, productMatchesSlug, slugify } from '../_catalog.js'
import { classifyStorefrontPath } from '../_storefrontRoutes.js'

interface LooseRequest {
  method?: string
  headers?: Record<string, string | string[] | undefined>
  query?: Record<string, string | string[] | undefined>
  url?: string
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  setHeader: (name: string, value: string) => void
  json: (payload: unknown) => void
}

const FALLBACK_COLLECTION_SLUGS = new Set(['winter', 'summer', 'everyday-wear'])
const FALLBACK_BRAND_SLUGS = new Set(['xeroxii', 'ceravo', 'rangkutir'])

function queryValue(req: LooseRequest, key: string) {
  const raw = req.query?.[key]
  return Array.isArray(raw) ? raw[0] ?? '' : raw ?? ''
}

function readPath(req: LooseRequest) {
  const fromQuery = queryValue(req, 'path').trim()
  if (fromQuery.startsWith('/')) {
    return fromQuery.split('?')[0] ?? fromQuery
  }

  try {
    const url = new URL(req.url ?? '', 'https://www.shisfashion.com')
    const pathParam = url.searchParams.get('path')?.trim() ?? ''
    if (pathParam.startsWith('/')) {
      return pathParam.split('?')[0] ?? pathParam
    }
  } catch {
    // Fall through.
  }

  return ''
}

function send(res: LooseResponse, exists: boolean, status = 200) {
  res.setHeader('Cache-Control', exists ? 'public, max-age=60' : 'public, max-age=30')
  res.status(status).json({ exists })
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const pathname = readPath(req)
  const classified = classifyStorefrontPath(pathname)

  if (classified.kind === 'static' || classified.kind === 'listing') {
    send(res, classified.ok)
    return
  }

  if (classified.kind === 'unknown') {
    send(res, false)
    return
  }

  const db = getFirebaseAdminDb()
  if (!db) {
    send(res, true)
    return
  }

  try {
    if (classified.kind === 'product') {
      const snapshot = await db.collection('products').get()
      const exists = snapshot.docs.some((doc) => {
        const data = doc.data() as { name?: string; slug?: string; archived?: boolean }
        return !data.archived && (productMatchesSlug(data, classified.slug) || getProductSlug(data) === classified.slug)
      })
      send(res, exists)
      return
    }

    if (classified.kind === 'collection') {
      if (FALLBACK_COLLECTION_SLUGS.has(classified.slug)) {
        send(res, true)
        return
      }

      const homepage = await db.collection('settings').doc('homepage').get()
      const pages = (homepage.data() as { featuredCollectionPages?: Array<{ slug?: string }> } | undefined)
        ?.featuredCollectionPages ?? []
      const exists = pages.some((entry) => slugify(String(entry.slug ?? '')) === classified.slug)
      send(res, exists)
      return
    }

    if (FALLBACK_BRAND_SLUGS.has(classified.slug)) {
      send(res, true)
      return
    }

    const brands = await db.collection('brands').get()
    const exists = brands.docs.some((doc) => {
      const data = doc.data() as { slug?: string; name?: string; archived?: boolean }
      if (data.archived) {
        return false
      }

      return slugify(String(data.slug ?? '')) === classified.slug
        || slugify(String(data.name ?? '')) === classified.slug
    })
    send(res, exists)
  } catch {
    send(res, true, 200)
  }
}
