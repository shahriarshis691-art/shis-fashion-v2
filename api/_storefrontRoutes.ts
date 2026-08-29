export type StorefrontPathClass =
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
  '/men/panjabi',
  '/men/polos',
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
  'kurti',
  'dresses',
  'women-dresses',
  'womens-dresses',
  'women-shirt',
  'women-shirts',
  'womens-shirt',
  'womens-shirts',
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

function normalizePath(pathname: string) {
  const clean = pathname.split('?')[0]?.split('#')[0] ?? '/'
  if (!clean.startsWith('/')) {
    return `/${clean}`
  }

  return clean === '/' ? '/' : clean.replace(/\/+$/, '') || '/'
}

export function isKnownListingSlug(slug: string) {
  return KNOWN_LISTING_SLUGS.has(slug.trim().toLowerCase())
}

export function classifyStorefrontPath(pathname: string): StorefrontPathClass {
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
