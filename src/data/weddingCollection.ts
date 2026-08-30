import { isSareeProduct, mergeSareeCatalog } from './sareeCollection'
import type { ShopProduct } from './shopData'
import { filterListingProducts } from '../utils/listingProducts'

export const WEDDING_LISTING_PATH = '/wedding'
export const WEDDING_LISTING_HERO = '/collections/wedding/wedding-banner.jpg'
export const WEDDING_LISTING_HERO_WIDTH = 1536
export const WEDDING_LISTING_HERO_HEIGHT = 1024
export const WEDDING_LISTING_HERO_BACKGROUND = '#8c7b6b'

function isPanjabiProduct(product: ShopProduct) {
  const extendedProduct = product as ShopProduct & { tags?: string[] }
  const category = product.category.trim().toLowerCase()
  const subCategory = (product.subCategory ?? '').trim().toLowerCase()
  const tags = (extendedProduct.tags ?? []).map((tag) => tag.trim().toLowerCase())
  const text = [product.name, product.slug, category, subCategory, tags.join(' ')].join(' ').toLowerCase()

  return (
    category === 'panjabi'
    || category === 'punjabi'
    || subCategory === 'panjabi'
    || subCategory === 'punjabi'
    || tags.includes('panjabi')
    || tags.includes('punjabi')
    || /\bpanjabis?\b|\bpunjabis?\b/.test(text)
  )
}

export function isWeddingProduct(product: ShopProduct) {
  const extendedProduct = product as ShopProduct & { tags?: string[] }
  const category = product.category.trim().toLowerCase()
  const subCategory = (product.subCategory ?? '').trim().toLowerCase()
  const tags = (extendedProduct.tags ?? []).map((tag) => tag.trim().toLowerCase())
  const text = [product.name, product.slug, category, subCategory, tags.join(' ')].join(' ').toLowerCase()

  if (category === 'wedding' || subCategory === 'wedding' || tags.includes('wedding')) {
    return true
  }

  if (/\bwedding\b|\bbridal\b|\bgroom\b|\bbride\b|\blehenga\b|\bsherwani\b/.test(text)) {
    return true
  }

  return isSareeProduct(product) || isPanjabiProduct(product)
}

export function weddingProductHref(product: ShopProduct) {
  if (isSareeProduct(product)) {
    return `/sarees/${product.slug}`
  }

  return `/product/${product.slug}`
}

export function mergeWeddingCatalog(liveProducts: ShopProduct[]): ShopProduct[] {
  const sarees = mergeSareeCatalog(liveProducts)
  const extras = liveProducts.filter((product) => isWeddingProduct(product) && !isSareeProduct(product))
  const bySlug = new Map<string, ShopProduct>()

  for (const product of [...sarees, ...extras]) {
    const slug = product.slug.trim().toLowerCase()
    if (!slug || bySlug.has(slug)) {
      continue
    }
    bySlug.set(slug, product)
  }

  return filterListingProducts(Array.from(bySlug.values()))
}
