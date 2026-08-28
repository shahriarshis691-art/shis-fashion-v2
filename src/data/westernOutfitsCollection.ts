import type { ShopProduct } from './shopData'
import { filterListingProducts } from '../utils/listingProducts'

export const WESTERN_OUTFITS_LISTING_PATH = '/women?sub=western-outfits'
export const WESTERN_OUTFIT_SIZES = ['S', 'M', 'L', 'XL'] as const

export type WesternOutfitGroup = 'tops-blouses' | 'shorts-denim' | 'bottoms-skirts'
/** Listing filter chips on `/women?sub=western-outfits`. */
export type WesternListingFilter = 'all' | 'crop-tops-blouses' | 'casual-shirts' | 'denim-shorts'

export interface WesternOutfitProduct extends ShopProduct {
  sku: string
  westernGroup: WesternOutfitGroup
  /** Storefront sub-label: Tops | Shirts | Shorts | Bottoms */
  subcategory: 'Tops' | 'Shirts' | 'Shorts' | 'Bottoms'
  tags: string[]
  inStock: boolean
}

type WesternOutfitFields = ShopProduct & {
  westernGroup?: WesternOutfitGroup
  subcategory?: WesternOutfitProduct['subcategory']
  tags?: string[]
  sku?: string
}

/** Local western catalog is empty until new assets are curated. */
export const westernOutfitsCollectionProducts: WesternOutfitProduct[] = []

export const WESTERN_LISTING_FILTER_OPTIONS: Array<{
  value: WesternListingFilter
  label: string
  countLabel?: boolean
}> = [
  { value: 'all', label: 'All', countLabel: true },
  { value: 'crop-tops-blouses', label: 'Crop Tops & Blouses' },
  { value: 'casual-shirts', label: 'Casual Shirts' },
  { value: 'denim-shorts', label: 'Denim & Shorts' },
]

export function getWesternOutfitProductBySlug(slug: string): WesternOutfitProduct | undefined {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return westernOutfitsCollectionProducts.find(
    (product) => product.slug === normalized || String(product.id) === normalized || product.sku.toLowerCase() === normalized,
  )
}

export function isWesternOutfitProduct(
  product: Pick<ShopProduct, 'name' | 'slug' | 'category'> & { tags?: string[] },
) {
  const tags = (product.tags ?? []).map((tag) => tag.trim().toLowerCase())
  if (tags.includes('western-outfits') || tags.includes('western')) {
    return true
  }

  const text = [product.name, product.slug, product.category].join(' ').toLowerCase()
  return /western[\s_-]?outfit|western-outfits|womens?[\s_-]?western/.test(text)
}

export function inferWesternOutfitGroup(product: ShopProduct): WesternOutfitGroup {
  const tagged = product as WesternOutfitFields
  if (
    tagged.westernGroup === 'tops-blouses' ||
    tagged.westernGroup === 'shorts-denim' ||
    tagged.westernGroup === 'bottoms-skirts'
  ) {
    return tagged.westernGroup
  }

  const tags = (tagged.tags ?? []).map((tag) => tag.trim().toLowerCase())
  if (tags.includes('tops-blouses')) return 'tops-blouses'
  if (tags.includes('shorts-denim')) return 'shorts-denim'
  if (tags.includes('bottoms-skirts')) return 'bottoms-skirts'

  const haystack = [product.name, product.slug, product.category, product.description, ...(tagged.tags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (/short|denim short|bermuda|cut-?off/.test(haystack)) {
    return 'shorts-denim'
  }

  if (/skirt|trouser|pant|cigarette|wide-?leg|pencil|midi skirt|flare/.test(haystack)) {
    return 'bottoms-skirts'
  }

  return 'tops-blouses'
}

function resolveSubcategory(group: WesternOutfitGroup, name: string): WesternOutfitProduct['subcategory'] {
  if (group === 'shorts-denim') return 'Shorts'
  if (group === 'bottoms-skirts') return 'Bottoms'
  if (/\bblouse\b/i.test(name)) return 'Tops'
  if (/\bshirt\b|\boxford\b|\bcamp collar\b/i.test(name)) return 'Shirts'
  return 'Tops'
}

function inferWesternSubcategory(product: ShopProduct): WesternOutfitProduct['subcategory'] {
  const tagged = product as WesternOutfitFields
  if (
    tagged.subcategory === 'Tops' ||
    tagged.subcategory === 'Shirts' ||
    tagged.subcategory === 'Shorts' ||
    tagged.subcategory === 'Bottoms'
  ) {
    return tagged.subcategory
  }

  return resolveSubcategory(inferWesternOutfitGroup(product), product.name)
}

export function matchesWesternListingFilter(product: ShopProduct, filter: WesternListingFilter) {
  if (filter === 'all') {
    return true
  }

  const subcategory = inferWesternSubcategory(product)

  if (filter === 'crop-tops-blouses') {
    return subcategory === 'Tops'
  }

  if (filter === 'casual-shirts') {
    return subcategory === 'Shirts'
  }

  if (filter === 'denim-shorts') {
    return subcategory === 'Shorts' || inferWesternOutfitGroup(product) === 'shorts-denim'
  }

  return true
}

export function mergeWesternOutfitsCatalog(liveProducts: ShopProduct[]): ShopProduct[] {
  const taken = new Set(
    liveProducts.map((product) => product.slug.trim().toLowerCase()).filter(Boolean),
  )

  const extras = westernOutfitsCollectionProducts.filter(
    (product) => !taken.has(product.slug.toLowerCase()),
  )

  return filterListingProducts(extras.length ? [...liveProducts, ...extras] : liveProducts)
}
