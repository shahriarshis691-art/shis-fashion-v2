import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { getFirebaseAdminDb } from '../_firebaseAdmin.js'
import { getProductSlug, normalizeVariants, productMatchesSlug, slugify } from '../_catalog.js'

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

interface ProductRecord {
  name?: string
  slug?: string
  description?: string
  category?: string
  brand?: string
  price?: string
  comparePrice?: string
  stock?: number
  sizes?: unknown
  colors?: unknown
  variants?: unknown
  images?: unknown
  image?: unknown
  featuredImage?: unknown
  archived?: boolean
}

const SITE_URL = 'https://www.shisfashion.com'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`
const DEFAULT_DESCRIPTION = 'Shop premium fashion essentials from SHIS Fashion Bangladesh.'

function headerValue(headers: Record<string, string | string[] | undefined> | undefined, key: string) {
  const value = headers?.[key] ?? headers?.[key.toLowerCase()]
  return Array.isArray(value) ? value[0] : value ?? ''
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
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

function absoluteUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return DEFAULT_OG_IMAGE
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `${SITE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`
}

function collectImages(data: ProductRecord) {
  const images: string[] = []
  const push = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) {
      const url = absoluteUrl(value)
      if (!images.includes(url)) {
        images.push(url)
      }
    }
  }

  push(data.featuredImage)
  push(data.image)
  if (Array.isArray(data.images)) {
    data.images.forEach(push)
  }

  return images.length ? images : [DEFAULT_OG_IMAGE]
}

function toStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => String(entry ?? '').trim())
    .filter((entry) => entry && entry !== 'Default')
}

function numericPrice(value: unknown) {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^\d.]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Crawlers execute little to no JavaScript on first fetch, so the SPA shell is
 * effectively an empty page for indexing. This renders the same product facts
 * as the client PDP into static HTML plus JSON-LD.
 */
function renderProductPage(input: {
  name: string
  description: string
  url: string
  images: string[]
  price: number
  comparePrice: number
  brand: string
  categoryLabel: string
  categorySlug: string
  slug: string
  sizes: string[]
  colors: string[]
  inStock: boolean
}) {
  const availability = input.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
  const title = `${input.name} | SHIS Fashion Bangladesh`
  const categoryUrl = `${SITE_URL}/shop/${input.categorySlug}`

  const productSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    image: input.images,
    url: input.url,
    sku: input.slug,
    brand: { '@type': 'Brand', name: input.brand },
    category: input.categoryLabel,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BDT',
      price: input.price,
      availability,
      url: input.url,
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'SHIS Fashion' },
    },
  }

  const options = [
    ...input.sizes.map((size) => ({ '@type': 'PropertyValue', name: 'Size', value: size })),
    ...input.colors.map((color) => ({ '@type': 'PropertyValue', name: 'Colour', value: color })),
  ]

  if (options.length) {
    productSchema.additionalProperty = options
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
      { '@type': 'ListItem', position: 3, name: input.categoryLabel, item: categoryUrl },
      { '@type': 'ListItem', position: 4, name: input.name, item: input.url },
    ],
  }

  const schemaJson = JSON.stringify([productSchema, breadcrumbSchema]).replace(/</g, '\\u003c')
  const priceLabel = `BDT ${input.price.toLocaleString('en-US')}`

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(input.description)}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href="${escapeHtml(input.url)}" />
  <meta property="og:type" content="product" />
  <meta property="og:site_name" content="SHIS Fashion" />
  <meta property="og:locale" content="en_BD" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(input.description)}" />
  <meta property="og:url" content="${escapeHtml(input.url)}" />
  <meta property="og:image" content="${escapeHtml(input.images[0] ?? DEFAULT_OG_IMAGE)}" />
  <meta property="product:price:amount" content="${input.price}" />
  <meta property="product:price:currency" content="BDT" />
  <meta property="product:availability" content="${input.inStock ? 'in stock' : 'out of stock'}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(input.description)}" />
  <meta name="twitter:image" content="${escapeHtml(input.images[0] ?? DEFAULT_OG_IMAGE)}" />
  <script type="application/ld+json">${schemaJson}</script>
</head>
<body>
  <header>
    <a href="${SITE_URL}/">SHIS Fashion Bangladesh</a>
  </header>
  <nav aria-label="Breadcrumb">
    <ol>
      <li><a href="${SITE_URL}/">Home</a></li>
      <li><a href="${SITE_URL}/shop">Shop</a></li>
      <li><a href="${escapeHtml(categoryUrl)}">${escapeHtml(input.categoryLabel)}</a></li>
      <li><a href="${escapeHtml(input.url)}" aria-current="page">${escapeHtml(input.name)}</a></li>
    </ol>
  </nav>
  <main>
    <article>
      <h1>${escapeHtml(input.name)}</h1>
      <img src="${escapeHtml(input.images[0] ?? DEFAULT_OG_IMAGE)}" alt="${escapeHtml(input.name)}" width="1200" height="1500" />
      <p>${escapeHtml(input.description)}</p>
      <dl>
        <dt>Price</dt>
        <dd>${escapeHtml(priceLabel)}</dd>
        ${input.comparePrice > input.price ? `<dt>Original price</dt>
        <dd>BDT ${escapeHtml(input.comparePrice.toLocaleString('en-US'))}</dd>` : ''}
        <dt>Brand</dt>
        <dd>${escapeHtml(input.brand)}</dd>
        <dt>Category</dt>
        <dd>${escapeHtml(input.categoryLabel)}</dd>
        <dt>Availability</dt>
        <dd>${input.inStock ? 'In stock' : 'Out of stock'}</dd>
        ${input.sizes.length ? `<dt>Sizes</dt>
        <dd>${escapeHtml(input.sizes.join(', '))}</dd>` : ''}
        ${input.colors.length ? `<dt>Colours</dt>
        <dd>${escapeHtml(input.colors.join(', '))}</dd>` : ''}
      </dl>
      <p>Cash on delivery available across Bangladesh.</p>
      <p><a href="${escapeHtml(input.url)}">View ${escapeHtml(input.name)} on SHIS Fashion</a></p>
    </article>
    <section>
      <h2>Continue shopping</h2>
      <ul>
        <li><a href="${SITE_URL}/shop">All products</a></li>
        <li><a href="${escapeHtml(categoryUrl)}">More in ${escapeHtml(input.categoryLabel)}</a></li>
        <li><a href="${SITE_URL}/shop/new-arrivals">New arrivals</a></li>
      </ul>
    </section>
  </main>
</body>
</html>`
}

function renderNotFoundPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Page not found | SHIS Fashion Bangladesh</title>
  <meta name="description" content="This SHIS Fashion product is unavailable. Continue shopping the latest collection." />
  <meta name="robots" content="noindex,nofollow" />
</head>
<body>
  <main>
    <h1>This product is unavailable</h1>
    <p>The page you requested is no longer part of the SHIS Fashion catalogue.</p>
    <ul>
      <li><a href="${SITE_URL}/shop">Shop all products</a></li>
      <li><a href="${SITE_URL}/shop/new-arrivals">New arrivals</a></li>
      <li><a href="${SITE_URL}/">SHIS Fashion home</a></li>
    </ul>
  </main>
</body>
</html>`
}

function sendHtml(
  req: LooseRequest,
  res: LooseResponse,
  status: number,
  body: string,
  options: { cacheControl: string; noindex?: boolean; retryAfter?: number },
) {
  res.status(status)
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', options.cacheControl)
  // Responses differ for crawlers vs browsers, so caches must key on the UA.
  res.setHeader('Vary', 'User-Agent')

  if (options.noindex) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  }

  if (options.retryAfter) {
    res.setHeader('Retry-After', String(options.retryAfter))
  }

  res.send(String(req.method ?? 'GET').toUpperCase() === 'HEAD' ? '' : body)
}

/** Prefers the indexed slug field; falls back to a scan for legacy products. */
async function findProduct(slug: string, category: string) {
  const db = getFirebaseAdminDb()
  if (!db) {
    return { db: null, doc: null }
  }

  const matches = (doc: QueryDocumentSnapshot) => {
    const data = doc.data() as ProductRecord
    if (data.archived) {
      return false
    }

    if (!productMatchesSlug(data, slug)) {
      return false
    }

    return !category || slugify(String(data.category ?? 'shop')) === category
  }

  const indexed = await db.collection('products').where('slug', '==', slug).limit(5).get()
  const indexedMatch = indexed.docs.find(matches)
  if (indexedMatch) {
    return { db, doc: indexedMatch }
  }

  // Legacy products derive their slug from `name`, so they need a scan.
  const all = await db.collection('products').get()
  return { db, doc: all.docs.find(matches) ?? null }
}

export default async function handler(req: LooseRequest, res: LooseResponse) {
  const method = String(req.method ?? 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const parsed = parseProductPath(readPath(req))
  if (!parsed?.slug) {
    sendHtml(req, res, 404, renderNotFoundPage(), { cacheControl: 'public, max-age=60', noindex: true })
    return
  }

  try {
    const { db, doc } = await findProduct(parsed.slug, parsed.category)

    if (!db) {
      // Infrastructure problem, not a missing page: never let this be indexed
      // and never answer 404, which would drop a live product from the index.
      sendHtml(req, res, 503, renderNotFoundPage(), {
        cacheControl: 'no-store',
        noindex: true,
        retryAfter: 120,
      })
      return
    }

    if (!doc) {
      sendHtml(req, res, 404, renderNotFoundPage(), { cacheControl: 'public, max-age=60', noindex: true })
      return
    }

    const data = doc.data() as ProductRecord
    const name = String(data.name ?? '').trim() || 'SHIS Fashion'
    const description = (String(data.description ?? '').trim() || DEFAULT_DESCRIPTION).slice(0, 300)
    const categorySlug = slugify(String(data.category ?? 'shop')) || 'shop'
    const categoryLabel = String(data.category ?? 'Fashion').trim() || 'Fashion'
    const slug = getProductSlug(data)
    const variants = normalizeVariants(data.variants)
    const variantStock = variants.reduce((sum, variant) => sum + variant.stock, 0)
    const inStock = variants.length
      ? variantStock > 0
      : Math.max(0, Number(data.stock) || 0) > 0

    const sizes = variants.length
      ? [...new Set(variants.filter((variant) => variant.stock > 0).map((variant) => variant.size))]
      : toStringList(data.sizes)
    const colors = variants.length
      ? [...new Set(variants.filter((variant) => variant.stock > 0).map((variant) => variant.color))]
      : toStringList(data.colors)

    const body = renderProductPage({
      name,
      description,
      url: `${SITE_URL}/shop/${categorySlug}/${slug}`,
      images: collectImages(data),
      price: numericPrice(data.price),
      comparePrice: numericPrice(data.comparePrice),
      brand: String(data.brand ?? 'SHIS Fashion').trim() || 'SHIS Fashion',
      categoryLabel,
      categorySlug,
      slug,
      sizes,
      colors,
      inStock,
    })

    sendHtml(req, res, 200, body, {
      cacheControl: 'public, s-maxage=300, stale-while-revalidate=86400',
    })
  } catch {
    sendHtml(req, res, 503, renderNotFoundPage(), {
      cacheControl: 'no-store',
      noindex: true,
      retryAfter: 120,
    })
  }
}
