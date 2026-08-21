import { getFirebaseAdminDb } from '../_firebaseAdmin.js'
import { getProductSlug, productMatchesSlug } from '../_catalog.js'

export const config = {
  runtime: 'nodejs',
}

interface LooseRequest {
  method?: string
  headers?: Record<string, string | string[] | undefined>
  query?: Record<string, string | string[] | undefined>
  url?: string
}

interface LooseResponse {
  status: (code: number) => LooseResponse
  setHeader: (name: string, value: string) => void
  send: (body: string) => void
  json: (payload: unknown) => void
}

const SITE_URL = 'https://www.shisfashion.com'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

function headerValue(headers: Record<string, string | string[] | undefined> | undefined, key: string) {
  const value = headers?.[key] ?? headers?.[key.toLowerCase()]
  return Array.isArray(value) ? value[0] : value ?? ''
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

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
    const url = new URL(req.url ?? '', SITE_URL)
    const pathParam = url.searchParams.get('path')?.trim() ?? ''
    if (pathParam.startsWith('/')) {
      return pathParam.split('?')[0] ?? pathParam
    }
  } catch {
    // Fall through to forwarded URI.
  }

  const forwarded = headerValue(req.headers, 'x-forwarded-uri') || headerValue(req.headers, 'x-invoke-path')
  if (forwarded.startsWith('/')) {
    return forwarded.split('?')[0] ?? forwarded
  }

  return ''
}

function parseProductPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] === 'shop' && segments.length === 3) {
    return { category: slugify(segments[1] ?? ''), slug: slugify(segments[2] ?? '') }
  }

  if (segments[0] === 'product' && segments.length === 2) {
    return { category: '', slug: slugify(segments[1] ?? '') }
  }

  return null
}

function firstImage(data: { images?: unknown; image?: unknown; featuredImage?: unknown }) {
  if (Array.isArray(data.images)) {
    const match = data.images.find((entry) => typeof entry === 'string' && entry.trim())
    if (typeof match === 'string') {
      return match.trim()
    }
  }

  if (typeof data.image === 'string' && data.image.trim()) {
    return data.image.trim()
  }

  if (typeof data.featuredImage === 'string' && data.featuredImage.trim()) {
    return data.featuredImage.trim()
  }

  return DEFAULT_OG_IMAGE
}

function htmlPage(options: {
  title: string
  description: string
  url: string
  image: string
  name?: string
  price?: number
  currency?: string
  availability?: 'InStock' | 'OutOfStock'
  brand?: string
  category?: string
}) {
  const title = escapeHtml(options.title)
  const description = escapeHtml(options.description)
  const url = escapeHtml(options.url)
  const image = escapeHtml(options.image)
  const name = escapeHtml(options.name || options.title)
  const brand = escapeHtml(options.brand || 'SHIS Fashion')
  const category = escapeHtml(options.category || 'Fashion')
  const availability = options.availability === 'OutOfStock' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock'
  const price = Number.isFinite(options.price) ? options.price : 0
  const currency = options.currency || 'BDT'
  const availabilityLabel = options.availability === 'OutOfStock' ? 'Out of stock' : 'In stock'
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: options.name || options.title,
    description: options.description,
    image: options.image,
    url: options.url,
    brand: { '@type': 'Brand', name: options.brand || 'SHIS Fashion' },
    category: options.category || 'Fashion',
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price,
      availability,
      url: options.url,
      itemCondition: 'https://schema.org/NewCondition',
    },
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="SHIS Fashion" />
  <meta property="og:locale" content="en_BD" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${image}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
</head>
<body>
  <main>
    <p>SHIS Fashion Bangladesh</p>
    <h1>${name}</h1>
    <p>${description}</p>
    <p>Brand: ${brand}</p>
    <p>Category: ${category}</p>
    <p>Price: ${currency} ${price}</p>
    <p>Availability: ${availabilityLabel}</p>
    <p><a href="${url}">View this product on SHIS Fashion</a></p>
  </main>
</body>
</html>`
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  if (req.method && req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const parsed = parseProductPath(readPath(req))
  const fallback = htmlPage({
    title: 'SHIS Fashion Bangladesh',
    description: 'Shop premium fashion essentials from SHIS Fashion Bangladesh.',
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
  })

  if (!parsed?.slug) {
    res.status(404)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=60')
    res.send(fallback)
    return
  }

  const db = getFirebaseAdminDb()
  if (!db) {
    res.status(503)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.send(fallback)
    return
  }

  try {
    const snapshot = await db.collection('products').get()
    const matched = snapshot.docs.find((doc) => {
      const data = doc.data() as { name?: string; slug?: string; category?: string; archived?: boolean }
      if (data.archived) {
        return false
      }

      if (!productMatchesSlug(data, parsed.slug)) {
        return false
      }

      if (!parsed.category) {
        return true
      }

      return slugify(String(data.category ?? 'shop')) === parsed.category
    })

    if (!matched) {
      res.status(404)
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=60')
      res.send(fallback)
      return
    }

    const data = matched.data() as {
      name?: string
      slug?: string
      description?: string
      category?: string
      brand?: string
      price?: string
      stock?: number
      variants?: Array<{ stock?: number }>
      images?: unknown
      image?: unknown
      featuredImage?: unknown
    }
    const name = String(data.name ?? 'SHIS Fashion').trim() || 'SHIS Fashion'
    const description = String(data.description ?? 'Shop premium fashion essentials from SHIS Fashion Bangladesh.').trim()
      || 'Shop premium fashion essentials from SHIS Fashion Bangladesh.'
    const category = slugify(String(data.category ?? 'shop')) || 'shop'
    const slug = getProductSlug(data)
    const url = `${SITE_URL}/shop/${category}/${slug}`
    const numericPrice = Number.parseFloat(String(data.price ?? '').replace(/[^\d.]/g, '')) || 0
    const variantStock = Array.isArray(data.variants)
      ? data.variants.reduce((sum, entry) => sum + Math.max(0, Number(entry.stock) || 0), 0)
      : 0
    const stock = variantStock > 0 ? variantStock : Math.max(0, Number(data.stock) || 0)

    res.status(200)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400')
    res.send(htmlPage({
      title: `${name} | SHIS Fashion Bangladesh`,
      description: description.slice(0, 300),
      url,
      image: firstImage(data),
      name,
      price: numericPrice,
      currency: 'BDT',
      availability: stock > 0 ? 'InStock' : 'OutOfStock',
      brand: String(data.brand ?? 'SHIS Fashion').trim() || 'SHIS Fashion',
      category: String(data.category ?? 'Fashion'),
    }))
  } catch {
    res.status(500)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.send(fallback)
  }
}
