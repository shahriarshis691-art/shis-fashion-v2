import type { ShopProduct } from '../data/shopData'
import { isPlaceholderOversizedTeeProduct } from '../data/oversizedTeeCollection'
import {
  CATALOG_IMAGE_PLACEHOLDER,
  getProductImage,
  isOutdatedHardcodedMediaUrl,
  isPersistableMediaUrl,
  sanitizeCatalogAssetUrl,
} from './media'

export type ListingProductLike = Pick<ShopProduct, 'slug' | 'image' | 'galleryImages'> & {
  isPlaceholder?: boolean
  images?: string[]
  imageUrl?: string
}

const BLOCKED_IMAGE_FRAGMENTS = [
  'timeless-oversize-hero',
  'featured-men-collection',
  'category-saree-blue',
  'shis-media-tone',
  'og-image.svg',
  'og-image.png',
] as const

/** Live-catalog slugs with missing/broken assets — never render on listing grids. */
const BLOCKED_LISTING_SLUGS = new Set([
  'coffee-brown-oversized-graphic-tee',
  'cream-crimson-leaf-handloom-saree',
  'ivory-black-temple-border-handloom-saree',
  'ivory-diamond-buti-jamdani-saree',
  'ivory-sunflower-sketch-cotton-saree',
  'temple-paisley-gold-border-saree',
  'warli-motif-soft-cotton-saree',
  'white-lotus-applique-cotton-saree',
])

function collectListingImageSources(product: ListingProductLike): string[] {
  const sources = [
    product.image,
    product.imageUrl,
    ...(product.images ?? []),
    ...(product.galleryImages ?? []),
    getProductImage(product),
  ]

  return sources
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
}

export function listingProductImageCandidates(product: ListingProductLike): string[] {
  const candidates = [product.image, ...(product.galleryImages ?? []), getProductImage(product)]
    .map((item) => (typeof item === 'string' ? sanitizeCatalogAssetUrl(item.trim()) : ''))
    .filter((item) => isPersistableMediaUrl(item) && !isListingPlaceholderImage(item))

  return Array.from(new Set(candidates))
}

export function resolveListingProductImage(product: ListingProductLike): string {
  return listingProductImageCandidates(product)[0] ?? getProductImage(product)
}

export function isListingPlaceholderImage(image: string): boolean {
  const normalized = image.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  if (normalized.includes('placeholder')) {
    return true
  }

  if (normalized === CATALOG_IMAGE_PLACEHOLDER.toLowerCase()) {
    return true
  }

  if (normalized.startsWith('data:image/svg')) {
    return true
  }

  if (isOutdatedHardcodedMediaUrl(image)) {
    return true
  }

  return BLOCKED_IMAGE_FRAGMENTS.some((fragment) => normalized.includes(fragment))
}

export function hasListingRenderableImage(product: ListingProductLike): boolean {
  const slug = product.slug?.trim().toLowerCase()
  if (slug && BLOCKED_LISTING_SLUGS.has(slug)) {
    return false
  }

  if (product.isPlaceholder === true) {
    return false
  }

  if (isPlaceholderOversizedTeeProduct(product)) {
    return false
  }

  const rawSources = collectListingImageSources(product)
  const hasImageSource = rawSources.some((source) => {
    if (typeof source !== 'string') {
      return false
    }

    const trimmed = source.trim()
    if (!trimmed) {
      return false
    }

    return !isListingPlaceholderImage(trimmed)
  })

  if (!hasImageSource) {
    return false
  }

  return listingProductImageCandidates(product).length > 0
}

export function filterListingProducts<T extends ListingProductLike>(products: T[]): T[] {
  return products.filter(hasListingRenderableImage)
}
