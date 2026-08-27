/**
 * Vercel Edge middleware must be a single self-contained module.
 * Do not import sibling `.ts` files (e.g. `./middleware.routes.ts`) — the Edge
 * bundler rejects them. Path classification is inlined here; the Node API
 * copy lives in `api/_storefrontRoutes.ts`.
 */

type StorefrontPathClass =
  | { kind: 'static'; ok: true }
  | { kind: 'listing'; slug: string; ok: boolean }
  | { kind: 'product'; slug: string }
  | { kind: 'collection'; slug: string }
  | { kind: 'brand'; slug: string }
  | { kind: 'unknown'; ok: false }

const STATIC_PATHS = new Set([
  '/',
  '/shop',
  '/women',
  '/men',
  '/men/half-shirts',
  '/collections/oversized-tee',
  '/oversized-tee',
  '/kids',
  '/sarees',
  '/saree',
  '/shop/new-arrivals',
  '/new-arrivals',
  '/best-sellers',
  '/shop/best-sellers',
  '/cart',
  '/checkout',
  '/order-success',
  '/about',
  '/contact',
  '/brands',
  '/founder',
  '/sale',
  '/privacy',
  '/terms',
  '/track-order',
])

const KNOWN_LISTING_SLUGS = new Set([
  'new-arrivals',
  'best-sellers',
  'women',
  'womens',
  'men',
  'mens',
  'kids',
  'kid',
  'saree',
  'sarees',
  'shirts',
  'mens-shirt',
  'half-shirt',
  'half-shirts',
  'polos',
  'panjabi',
  'oversized-tee',
  'unisex-tee',
  'unisex-oversized-t-shirts',
  't-shirts',
  'denim',
  'pants',
  'jackets',
  'kurti',
  'tops',
  'dresses',
  'women-dresses',
  'womens-dresses',
  'women-shirt',
  'women-shirts',
  'womens-shirt',
  'womens-shirts',
  'western-outfits',
  'tunic',
  'western',
  'sari',
  'saris',
  'womens-saree',
  'women-saree',
  'womens-sarees',
  'kidswear',
  'kids-wear',
  'children',
  'child',
  'baby',
  'babies',
  'toddler',
  'mini',
])

const INVITE_COOKIE = 'shis_soft_launch_invite_ok'
const VISITOR_COOKIE = 'shis_soft_launch_visitor'
const PAID_TRAFFIC_COOKIE = 'shis_paid_traffic'
const CAMPAIGN_QUERY_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid', 'ttclid', 'msclkid']

function normalizePath(pathname: string) {
  const clean = pathname.split('?')[0]?.split('#')[0] ?? '/'
  if (!clean.startsWith('/')) {
    return `/${clean}`
  }

  return clean === '/' ? '/' : clean.replace(/\/+$/, '') || '/'
}

function isKnownListingSlug(slug: string) {
  return KNOWN_LISTING_SLUGS.has(slug.trim().toLowerCase())
}

function classifyStorefrontPath(pathname: string): StorefrontPathClass {
  const normalized = normalizePath(pathname)

  if (normalized.startsWith('/admin') || normalized.startsWith('/shis-admin')) {
    return { kind: 'static', ok: true }
  }

  if (STATIC_PATHS.has(normalized)) {
    return { kind: 'static', ok: true }
  }

  const segments = normalized.split('/').filter(Boolean)

  if (segments[0] === 'shop' && segments.length === 2) {
    const slug = segments[1] ?? ''
    return { kind: 'listing', slug, ok: isKnownListingSlug(slug) }
  }

  if (segments[0] === 'shop' && segments.length === 3) {
    return { kind: 'product', slug: segments[2] ?? '' }
  }

  if (segments[0] === 'product' && segments.length === 2) {
    return { kind: 'product', slug: segments[1] ?? '' }
  }

  if (segments[0] === 'collections' && segments.length === 2) {
    return { kind: 'collection', slug: segments[1] ?? '' }
  }

  if (segments[0] === 'collections' && segments.length === 3) {
    return { kind: 'product', slug: segments[2] ?? '' }
  }

  if (segments[0] === 'brands' && segments.length === 2) {
    return { kind: 'brand', slug: segments[1] ?? '' }
  }

  return { kind: 'unknown', ok: false }
}

function readCookie(cookieHeader: string, key: string) {
  const parts = cookieHeader.split(';').map((part) => part.trim())
  for (const part of parts) {
    if (!part) {
      continue
    }

    const [name, ...rest] = part.split('=')
    if (name === key) {
      return decodeURIComponent(rest.join('='))
    }
  }

  return ''
}

function hashToBucket(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash % 100
}

function randomVisitorId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function isSearchOrSocialCrawler(userAgent: string) {
  return /(googlebot|google-inspectiontool|googleother|adsbot-google|bingbot|bingpreview|slurp|duckduckbot|baiduspider|yandex(bot|images)|applebot|facebookexternalhit|facebot|twitterbot|whatsapp|telegrambot|slackbot|linkedinbot|pinterest|discordbot|semrushbot|ahrefsbot|dotbot)/i.test(userAgent)
}

function isProductSharePath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] === 'shop' && segments.length === 3) {
    return true
  }

  if (segments[0] === 'product' && segments.length === 2) {
    return true
  }

  return false
}

function isBypassedPath(pathname: string) {
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return true
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/shis-admin')) {
    return true
  }

  if (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/brands/') ||
    pathname === '/favicon.svg' ||
    pathname === '/index.html' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.xml') ||
    pathname.endsWith('.txt')
  ) {
    return true
  }

  return false
}

function getMode() {
  const raw = String(process.env.SOFT_LAUNCH_MODE ?? 'off').trim().toLowerCase()
  if (raw === 'percentage' || raw === 'invite-only') {
    return raw
  }

  return 'off'
}

function getPercent() {
  const raw = Number(process.env.SOFT_LAUNCH_PERCENT ?? 30)
  if (Number.isNaN(raw)) {
    return 30
  }

  return Math.min(100, Math.max(0, Math.floor(raw)))
}

function getInviteCodes() {
  return String(process.env.SOFT_LAUNCH_INVITE_CODES ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

function hasPaidTrafficSignals(url: URL, cookieHeader: string) {
  if (readCookie(cookieHeader, PAID_TRAFFIC_COOKIE) === '1') {
    return true
  }

  return CAMPAIGN_QUERY_KEYS.some((key) => Boolean(url.searchParams.get(key)?.trim()))
}

/**
 * Serves the prerendered PDP to crawlers. The upstream status is preserved so
 * Googlebot sees 200 for live products and 404 for retired slugs. Returns
 * `null` when prerendering is unavailable so the request falls through to the
 * normal SPA response instead of failing.
 */
async function renderForCrawler(url: URL, userAgent: string, method: string) {
  const dest = new URL('/api/product-share', url.origin)
  dest.searchParams.set('path', url.pathname)

  try {
    const upstream = await fetch(dest, {
      headers: {
        'user-agent': userAgent,
        accept: 'text/html',
      },
    })

    if (upstream.status >= 500) {
      return null
    }

    const headers = new Headers(upstream.headers)
    // `fetch` already decoded the body; stale framing headers would corrupt it.
    headers.delete('content-encoding')
    headers.delete('content-length')
    headers.set('vary', 'User-Agent')

    return new Response(method === 'HEAD' ? null : upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    })
  } catch {
    return null
  }
}

async function spaNotFoundResponse(request: Request) {
  try {
    const indexRes = await fetch(new URL('/index.html', request.url))
    return new Response(indexRes.body, {
      status: 404,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-robots-tag': 'noindex, nofollow',
        'cache-control': 'no-store',
      },
    })
  } catch {
    return new Response('Not found', {
      status: 404,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'x-robots-tag': 'noindex, nofollow',
        'cache-control': 'no-store',
      },
    })
  }
}

async function resolveCatalogStatus(request: Request, pathname: string) {
  const classified = classifyStorefrontPath(pathname)
  if (classified.kind === 'static') {
    return true
  }

  if (classified.kind === 'listing') {
    return classified.ok
  }

  if (classified.kind === 'unknown') {
    return false
  }

  try {
    const dest = new URL('/api/catalog-exists', request.url)
    dest.searchParams.set('path', pathname)
    const response = await fetch(dest, {
      headers: {
        accept: 'application/json',
      },
    })
    if (!response.ok) {
      return true
    }

    const payload = await response.json() as { exists?: boolean }
    return payload.exists !== false
  } catch {
    return true
  }
}

function blockedResponse(mode: string) {
  const body = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Soft Launch Access</title>
  <meta name="robots" content="noindex, nofollow" />
  <style>
    body { font-family: Arial, sans-serif; margin: 0; background: #f6f4ee; color: #151515; }
    main { min-height: 100vh; display: grid; place-items: center; padding: 24px; }
    section { max-width: 680px; background: #fff; border: 1px solid #ddd; border-radius: 16px; padding: 28px; text-align: center; }
    h1 { margin: 12px 0; font-size: 30px; }
    p { line-height: 1.6; margin: 10px 0; }
    a { color: #111; font-weight: 600; }
    .eyebrow { letter-spacing: 0.18em; text-transform: uppercase; font-size: 12px; color: #555; }
  </style>
</head>
<body>
  <main>
    <section>
      <p class="eyebrow">SHIS Fashion Soft Launch</p>
      <h1>Limited access is active</h1>
      <p>This storefront is currently running in ${mode} mode for launch stabilization.</p>
      <p>If you are part of the campaign, please use your invite link or check back later.</p>
      <p><a href="https://wa.me/8801887848304" target="_blank" rel="noreferrer">Request access on WhatsApp</a></p>
    </section>
  </main>
</body>
</html>`

  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-robots-tag': 'noindex, nofollow',
      'cache-control': 'no-store',
    },
  })
}

export default async function middleware(request: Request) {
  const url = new URL(request.url)
  const userAgent = request.headers.get('user-agent') ?? ''
  if (isSearchOrSocialCrawler(userAgent) && isProductSharePath(url.pathname)) {
    const prerendered = await renderForCrawler(url, userAgent, request.method)
    if (prerendered) {
      return prerendered
    }
  }

  if (!isBypassedPath(url.pathname)) {
    const catalogExists = await resolveCatalogStatus(request, url.pathname)
    if (!catalogExists) {
      return spaNotFoundResponse(request)
    }
  }

  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    return
  }

  const mode = getMode()
  if (mode === 'off') {
    return
  }

  if (process.env.VERCEL_ENV === 'production') {
    console.warn(`[middleware] Soft launch active in production: ${mode}`)
  }

  if (isBypassedPath(url.pathname)) {
    return
  }

  const cookieHeader = request.headers.get('cookie') ?? ''

  if (hasPaidTrafficSignals(url, cookieHeader)) {
    return
  }

  if (mode === 'invite-only') {
    const inviteCookie = readCookie(cookieHeader, INVITE_COOKIE)
    if (inviteCookie === '1') {
      return
    }

    const codes = getInviteCodes()
    const inviteCode = url.searchParams.get('invite')?.trim().toLowerCase() ?? ''
    if (inviteCode && codes.includes(inviteCode)) {
      const redirectUrl = new URL(request.url)
      redirectUrl.searchParams.delete('invite')

      return new Response(null, {
        status: 307,
        headers: {
          location: redirectUrl.toString(),
          'set-cookie': `${INVITE_COOKIE}=1; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`,
          'cache-control': 'no-store',
        },
      })
    }

    return blockedResponse(mode)
  }

  const existingVisitorId = readCookie(cookieHeader, VISITOR_COOKIE)
  const visitorId = existingVisitorId || randomVisitorId()
  const bucket = hashToBucket(visitorId)

  if (bucket >= getPercent()) {
    return blockedResponse(mode)
  }

  if (!existingVisitorId) {
    const response = new Response(null, {
      status: 307,
      headers: {
        location: request.url,
        'set-cookie': `${VISITOR_COOKIE}=${encodeURIComponent(visitorId)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`,
        'cache-control': 'no-store',
      },
    })

    return response
  }
}
