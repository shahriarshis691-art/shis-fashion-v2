import { formatBDT } from '../utils/currency'
import type { ShopProduct } from './shopData'

export const OVERSIZED_TEE_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const
export const OVERSIZED_TEE_FIT = 'Oversized Boxy Fit'
export const OVERSIZED_TEE_COVER = '/hero/kids/timeless-oversize-hero.source.png'
export const OVERSIZED_TEE_LISTING_PATH = '/collections/oversized-tee'

export type OversizedTeeAudience = 'Men' | 'Women' | 'Unisex'
export type OversizedTeeAudienceFilter = 'all' | OversizedTeeAudience

export interface OversizedTeeProduct extends ShopProduct {
  audience: OversizedTeeAudience
  fit: typeof OVERSIZED_TEE_FIT
  tags: string[]
}

function createOversizedTee(
  index: number,
  slug: string,
  name: string,
  price: number,
  audience: OversizedTeeAudience,
  colors: string[],
  description: string,
  options: {
    featured?: boolean
    newArrival?: boolean
    stock?: number
  } = {},
): OversizedTeeProduct {
  const tags = audience === 'Unisex' ? ['Unisex', 'All Adults'] : [audience, 'All Adults']

  return {
    id: `oversized-tee-${index}`,
    slug,
    name,
    price: formatBDT(price),
    category: 'oversized-tee',
    brand: 'SHIS Fashion',
    image: OVERSIZED_TEE_COVER,
    galleryImages: [OVERSIZED_TEE_COVER],
    description: `${description} ${OVERSIZED_TEE_FIT}. Sizes ${OVERSIZED_TEE_SIZES.join(', ')}.`,
    sizes: [...OVERSIZED_TEE_SIZES],
    colors,
    stock: options.stock ?? 18,
    featured: options.featured ?? false,
    newArrival: options.newArrival ?? true,
    audience,
    fit: OVERSIZED_TEE_FIT,
    tags,
  }
}

export const oversizedTeeCollectionProducts: OversizedTeeProduct[] = [
  createOversizedTee(
    1,
    'venom-graphic-oversized-tee',
    'Venom Graphic Oversized Tee',
    1250,
    'Unisex',
    ['Black'],
    'Black heavyweight cotton with a silver graphic print and a dropped shoulder for everyday impact.',
    { featured: true, newArrival: true, stock: 16 },
  ),
  createOversizedTee(
    2,
    'acid-wash-vintage-oversized-tee',
    'Acid Wash Vintage Oversized Tee',
    1150,
    'Men',
    ['Charcoal', 'Black'],
    'Vintage-wash oversized tee with a lived-in hand-feel and a relaxed boxy drape.',
    { featured: true, stock: 14 },
  ),
  createOversizedTee(
    3,
    'minimalist-heavyweight-tee',
    'Minimalist Heavyweight Tee',
    980,
    'Unisex',
    ['Black'],
    'Clean heavyweight staple with a quiet graphic and a roomy everyday silhouette.',
    { featured: true, stock: 20 },
  ),
  createOversizedTee(
    4,
    'tiger-crest-oversized-tee',
    'Tiger Crest Oversized Tee',
    1190,
    'Unisex',
    ['Black'],
    'Statement tiger-crest graphic on dense black cotton, cut for unisex layering.',
    { newArrival: true, stock: 15 },
  ),
  createOversizedTee(
    5,
    'studio-boxy-oversized-tee',
    'Studio Boxy Oversized Tee',
    890,
    'Men',
    ['Black'],
    'Everyday studio tee with a straight boxy body and a slightly extended sleeve.',
    { stock: 22 },
  ),
  createOversizedTee(
    6,
    'soft-drape-oversized-tee',
    'Soft Drape Oversized Tee',
    950,
    'Women',
    ['Black'],
    'Softer drape oversized tee with a longer back hem for considered everyday wear.',
    { featured: true, stock: 17 },
  ),
  createOversizedTee(
    7,
    'heavy-cotton-core-tee',
    'Heavy Cotton Core Tee',
    1050,
    'Unisex',
    ['Black'],
    'Dense cotton core tee with a graphic chest print and an easy oversized hang.',
    { stock: 19 },
  ),
  createOversizedTee(
    8,
    'relaxed-adults-oversized-tee',
    'Relaxed Adults Oversized Tee',
    850,
    'Women',
    ['Black'],
    'Approachable oversized tee for all adults, cut with a dropped shoulder and clean neckline.',
    { newArrival: true, stock: 21 },
  ),
]

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
  const taken = new Set(
    liveProducts.map((product) => product.slug.trim().toLowerCase()).filter(Boolean),
  )

  const extras = oversizedTeeCollectionProducts.filter((product) => !taken.has(product.slug.toLowerCase()))
  return extras.length ? [...liveProducts, ...extras] : liveProducts
}
