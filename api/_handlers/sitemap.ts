import { getFirebaseAdminDb } from '../_firebaseAdmin.js'
import { getProductSlug } from '../_catalog.js'

export const config = {
  runtime: 'nodejs',
}

interface LooseRequest {
  method?: string
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  setHeader: (name: string, value: string) => void
  send: (body: string) => void
  json: (payload: unknown) => void
}

const SITE_URL = 'https://www.shisfashion.com'

const STATIC_PATHS = [
  '/',
  '/shop',
  '/women',
  '/men',
  '/kids',
  '/sarees',
  '/shop/new-arrivals',
  '/about',
  '/contact',
  '/brands',
  '/founder',
  '/sale',
  '/privacy',
  '/terms',
  '/track-order',
]

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function xmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function buildSitemapXml(paths: string[]) {
  const uniqueUrls = [...new Set(paths)]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map((path) => `  <url><loc>${xmlEscape(`${SITE_URL}${path}`)}</loc></url>`).join('\n')}
</urlset>
`
}

function sendSitemap(res: LooseResponse, paths: string[]) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(buildSitemapXml(paths))
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T) {
  return new Promise<T>((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      () => {
        clearTimeout(timer)
        resolve(fallback)
      },
    )
  })
}

async function collectProductPaths(): Promise<string[]> {
  const db = getFirebaseAdminDb()
  if (!db) {
    return []
  }

  const snapshot = await db.collection('products').select('name', 'slug', 'category', 'archived').get()
  const paths: string[] = []

  snapshot.docs.forEach((doc) => {
    const data = doc.data() as { name?: string; slug?: string; category?: string; archived?: boolean }
    if (data.archived) {
      return
    }

    const slug = getProductSlug(data)
    const category = slugify(String(data.category ?? 'shop')) || 'shop'
    if (!slug) {
      return
    }

    paths.push(`/shop/${category}/${slug}`)
  })

  return paths
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const urls = [...STATIC_PATHS]

  try {
    const productPaths = await withTimeout(collectProductPaths(), 4000, [])
    urls.push(...productPaths)
  } catch {
    // Serve static routes when catalog lookup fails.
  }

  try {
    sendSitemap(res, urls)
  } catch {
    sendSitemap(res, STATIC_PATHS)
  }
}
