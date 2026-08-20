import { getFirebaseAdminDb } from './_firebaseAdmin.js'

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

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const urls = [...STATIC_PATHS]
  const db = getFirebaseAdminDb()

  if (db) {
    try {
      const snapshot = await db.collection('products').get()
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as { name?: string; category?: string; archived?: boolean }
        if (data.archived) {
          return
        }

        const slug = slugify(String(data.name ?? ''))
        const category = slugify(String(data.category ?? 'shop')) || 'shop'
        if (!slug) {
          return
        }

        urls.push(`/shop/${category}/${slug}`)
      })
    } catch {
      // Serve static routes when catalog lookup fails.
    }
  }

  const uniqueUrls = [...new Set(urls)]
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map((path) => `  <url><loc>${xmlEscape(`${SITE_URL}${path}`)}</loc></url>`).join('\n')}
</urlset>
`

  res.status(200)
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.send(body)
}
