import type { ShopProduct } from './shopData'

export const OVERSIZED_TEE_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const
export const OVERSIZED_TEE_FIT = 'Oversized Boxy Fit'
export const OVERSIZED_TEE_LISTING_PATH = '/collections/oversized-tee'

const PLACEHOLDER_OVERSIZED_TEE_IMAGE = 'timeless-oversize-hero'
const REMOVED_MOCK_SLUGS = new Set([
  'venom-graphic-oversized-tee',
  'acid-wash-vintage-oversized-tee',
  'minimalist-heavyweight-tee',
  'tiger-crest-oversized-tee',
  'studio-boxy-oversized-tee',
  'soft-drape-oversized-tee',
  'heavy-cotton-core-tee',
  'relaxed-adults-oversized-tee',
])

export type OversizedTeeAudience = 'Men' | 'Women' | 'Unisex'
export type OversizedTeeAudienceFilter = 'all' | OversizedTeeAudience

export interface OversizedTeeProduct extends ShopProduct {
  audience: OversizedTeeAudience
  fit: typeof OVERSIZED_TEE_FIT
  tags: string[]
}

/** Local mock catalog is empty until real oversized-tee assets are added. */
export const oversizedTeeCollectionProducts: OversizedTeeProduct[] = []

export function isPlaceholderOversizedTeeProduct(product: Pick<ShopProduct, 'slug' | 'image' | 'galleryImages'>) {
  if (REMOVED_MOCK_SLUGS.has(product.slug.trim().toLowerCase())) {
    return true
  }

  const urls = [product.image, ...(product.galleryImages ?? [])].join(' ').toLowerCase()
  return urls.includes(PLACEHOLDER_OVERSIZED_TEE_IMAGE)
}

export function getOversizedTeeProductBySlug(slug: string): OversizedTeeProduct | undefined {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return oversizedTeeCollectionProducts.find(
    (product) => product.slug === normalized || String(product.id) === normalized,
  )
}

export function isOversizedTeeProduct(product: Pick<ShopProduct, 'name' | 'slug' | 'category'>) {
  const text = [product.name, product.slug, product.category].join(' ').toLowerCase()
  if (/\bkids?\b|\bchildren\b|\bboy\b|\bgirl\b/.test(text)) {
    return false
  }

  return /oversized[\s_-]?tee|oversize[\s_-]?tee|unisex[\s_-]?tee/.test(text)
}

export function inferOversizedTeeAudience(product: ShopProduct): OversizedTeeAudience {
  const tagged = product as ShopProduct & { audience?: string; tags?: string[] }
  const explicit = tagged.audience?.trim()
  if (explicit === 'Men' || explicit === 'Women' || explicit === 'Unisex') {
    return explicit
  }

  const haystack = [product.name, product.category, product.description, ...(tagged.tags ?? [])]
    .join(' ')
    .toLowerCase()

  if (/\bwomen\b|\bwomens\b|\bladies\b/.test(haystack)) {
    return 'Women'
  }

  if (/\bmen\b|\bmens\b/.test(haystack) && !/\bunisex\b/.test(haystack)) {
    return 'Men'
  }

  return 'Unisex'
}

export function matchesOversizedTeeAudience(
  product: ShopProduct,
  filter: OversizedTeeAudienceFilter,
) {
  if (filter === 'all') {
    return true
  }

  return inferOversizedTeeAudience(product) === filter
}

export function mergeOversizedTeeCatalog(liveProducts: ShopProduct[]): ShopProduct[] {
  const realLive = liveProducts.filter((product) => !isPlaceholderOversizedTeeProduct(product))
  const taken = new Set(
    realLive.map((product) => product.slug.trim().toLowerCase()).filter(Boolean),
  )

  const extras = oversizedTeeCollectionProducts.filter((product) => !taken.has(product.slug.toLowerCase()))
  return extras.length ? [...realLive, ...extras] : realLive
}
