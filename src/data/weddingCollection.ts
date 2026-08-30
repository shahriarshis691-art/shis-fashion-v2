import { isSareeProduct } from './sareeCollection'
import type { ShopProduct } from './shopData'
import { filterListingProducts } from '../utils/listingProducts'

export const WEDDING_LISTING_PATH = '/wedding'
export const WEDDING_LISTING_HERO = '/collections/wedding/wedding-banner.jpg'
export const WEDDING_LISTING_HERO_WIDTH = 1536
export const WEDDING_LISTING_HERO_HEIGHT = 1024
export const WEDDING_LISTING_HERO_BACKGROUND = '#8c7b6b'

const GENERAL_CASUAL_SLUGS = new Set([
  'half-shirt',
  'half-shirts',
  'casual-shirt',
  'casual-shirts',
  't-shirt',
  't-shirts',
  'tee',
  'oversized-tee',
  'unisex-tee',
  'baggy-denim',
  'womens-baggy',
  'kids-casual',
  'kids',
  'polo',
  'polos',
  'kurti',
  'kurtis',
])

type WeddingTaggedProduct = ShopProduct & { tags?: string[] }

function weddingIdentityFields(product: ShopProduct) {
  const tagged = product as WeddingTaggedProduct
  const category = (product.category || '').toLowerCase().trim()
  const subCategory = (product.subCategory || '').toLowerCase().trim()
  const tags = Array.isArray(tagged.tags)
    ? tagged.tags.map((tag) => tag.toLowerCase().trim()).filter(Boolean)
    : []

  return {
    category,
    subCategory,
    tags,
    name: (product.name || '').toLowerCase().trim(),
    slug: (product.slug || '').toLowerCase().trim(),
  }
}

function isGeneralCasualProduct(product: ShopProduct) {
  const { category, subCategory, tags, name, slug } = weddingIdentityFields(product)
  const tokens = [category, subCategory, ...tags]

  if (tokens.some((token) => GENERAL_CASUAL_SLUGS.has(token))) {
    return true
  }

  const identity = [category, subCategory, name, slug, ...tags].join(' ')
  return /half[\s_-]?shirts?|baggy[\s_-]?denim|oversized[\s_-]?tee|\bkids?\b|\bkurtis?\b/.test(identity)
}

/** Products whose primary catalog home is the Wedding collection. */
export function isWeddingExclusiveProduct(product: ShopProduct) {
  const { category, subCategory, tags } = weddingIdentityFields(product)
  return category === 'wedding' || subCategory === 'wedding' || tags.includes('wedding')
}

export function isWeddingProduct(product: ShopProduct) {
  if (isGeneralCasualProduct(product)) {
    return false
  }

  const { category, subCategory, tags, name, slug } = weddingIdentityFields(product)
  const isDirectWedding = category === 'wedding' || subCategory === 'wedding' || tags.includes('wedding')

  const identity = [category, subCategory, name, slug, ...tags].join(' ')
  const isBridalOrGroomItem = /\b(bridal|groom|bride|lehenga|sherwani)\b/.test(identity)
  const isNamedWedding = /\bwedding\b/.test(identity)

  return isDirectWedding || isBridalOrGroomItem || isNamedWedding
}

export function weddingProductHref(product: ShopProduct) {
  if (isSareeProduct(product) && !isWeddingExclusiveProduct(product)) {
    return `/sarees/${product.slug}`
  }

  return `/product/${product.slug}`
}

export function mergeWeddingCatalog(liveProducts: ShopProduct[]): ShopProduct[] {
  const bySlug = new Map<string, ShopProduct>()

  for (const product of liveProducts) {
    if (!isWeddingProduct(product)) {
      continue
    }

    const slug = product.slug.trim().toLowerCase()
    if (!slug || bySlug.has(slug)) {
      continue
    }

    bySlug.set(slug, product)
  }

  return filterListingProducts(Array.from(bySlug.values()))
}
