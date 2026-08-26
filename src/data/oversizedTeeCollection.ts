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
export type OversizedTeeStyle = 'Graphic' | 'Solid'
export type OversizedTeeAudienceFilter = 'all' | OversizedTeeAudience
export type OversizedTeeListingFilter = 'all' | OversizedTeeAudience | OversizedTeeStyle

export interface OversizedTeeProduct extends ShopProduct {
  audience: OversizedTeeAudience
  fit: typeof OVERSIZED_TEE_FIT
  tags: string[]
}

type OversizedTeeProductFields = ShopProduct & {
  audience?: string
  gender?: string
  tags?: string[]
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

export function isOversizedTeeProduct(product: Pick<ShopProduct, 'name' | 'slug' | 'category'> & { tags?: string[] }) {
  const tagged = product as { tags?: string[] }
  const tags = (tagged.tags ?? []).map((tag) => tag.trim().toLowerCase())
  if (tags.includes('oversized-tee') || tags.includes('unisex-oversized-t-shirts')) {
    const kidTagged = tags.some((tag) => /\bkids?\b|\bchildren\b|\bboy\b|\bgirl\b/.test(tag))
    if (!kidTagged) {
      return true
    }
  }

  const text = [product.name, product.slug, product.category].join(' ').toLowerCase()
  if (/\bkids?\b|\bchildren\b|\bboy\b|\bgirl\b/.test(text)) {
    return false
  }

  return /oversized[\s_-]?tee|oversize[\s_-]?tee|unisex[\s_-]?tee|unisex[\s_-]?oversized/.test(text)
}

function productSearchHaystack(product: ShopProduct) {
  const tagged = product as OversizedTeeProductFields
  return [
    product.name,
    product.slug,
    product.category,
    product.description,
    tagged.gender,
    tagged.audience,
    ...(tagged.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function inferOversizedTeeAudience(product: ShopProduct): OversizedTeeAudience {
  const tagged = product as OversizedTeeProductFields
  const explicitAudience = tagged.audience?.trim()
  if (explicitAudience === 'Men' || explicitAudience === 'Women' || explicitAudience === 'Unisex') {
    return explicitAudience
  }

  const gender = (tagged.gender ?? '').trim().toLowerCase()
  if (gender === 'unisex') {
    return 'Unisex'
  }
  if (gender === 'women' || gender === 'woman' || gender === 'female' || gender === "women's" || gender === 'womens') {
    return 'Women'
  }
  if (gender === 'men' || gender === 'man' || gender === 'male' || gender === "men's" || gender === 'mens') {
    return 'Men'
  }

  const haystack = productSearchHaystack(product)
  const category = product.category.trim().toLowerCase()

  if (
    category === 'unisex' ||
    category === 'unisex-tee' ||
    category === 'unisex-oversized-t-shirts' ||
    /\bunisex\b/.test(haystack)
  ) {
    return 'Unisex'
  }

  if (/\bwomen\b|\bwomens\b|\bladies\b|\bfemale\b/.test(haystack)) {
    return 'Women'
  }

  if (/\bmen\b|\bmens\b|\bmale\b/.test(haystack)) {
    return 'Men'
  }

  // Generic oversized/unisex tee catalog defaults to Unisex (dedicated-page only).
  return 'Unisex'
}

export function inferOversizedTeeStyle(product: ShopProduct): OversizedTeeStyle {
  const haystack = productSearchHaystack(product)
  if (/graphic|print|printed|artwork|crest|venom|tiger|vintage print/.test(haystack)) {
    return 'Graphic'
  }
  return 'Solid'
}

/** Generic unisex oversized tees belong only on `/collections/oversized-tee`. */
export function isGenericUnisexOversizedTee(product: ShopProduct) {
  return isOversizedTeeProduct(product) && inferOversizedTeeAudience(product) === 'Unisex'
}

/**
 * Women segment listing: keep only dedicated women-cut oversized tees.
 * Unisex / generic oversized tees are excluded.
 */
export function shouldExcludeOversizedTeeFromWomenListing(product: ShopProduct) {
  if (!isOversizedTeeProduct(product)) {
    return false
  }
  return inferOversizedTeeAudience(product) !== 'Women'
}

/**
 * Men segment listing: keep only dedicated men-cut oversized tees.
 * Generic unisex oversized tees are excluded.
 */
export function shouldExcludeOversizedTeeFromMenListing(product: ShopProduct) {
  if (!isOversizedTeeProduct(product)) {
    return false
  }
  return inferOversizedTeeAudience(product) !== 'Men'
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

export function matchesOversizedTeeListingFilter(
  product: ShopProduct,
  filter: OversizedTeeListingFilter,
) {
  if (filter === 'all') {
    return true
  }

  if (filter === 'Unisex' || filter === 'Men' || filter === 'Women') {
    return inferOversizedTeeAudience(product) === filter
  }

  return inferOversizedTeeStyle(product) === filter
}

export function mergeOversizedTeeCatalog(liveProducts: ShopProduct[]): ShopProduct[] {
  const realLive = liveProducts.filter((product) => !isPlaceholderOversizedTeeProduct(product))
  const taken = new Set(
    realLive.map((product) => product.slug.trim().toLowerCase()).filter(Boolean),
  )

  const extras = oversizedTeeCollectionProducts.filter((product) => !taken.has(product.slug.toLowerCase()))
  return extras.length ? [...realLive, ...extras] : realLive
}
