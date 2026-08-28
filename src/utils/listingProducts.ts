import type { ShopProduct } from '../data/shopData'
import { isPlaceholderOversizedTeeProduct } from '../data/oversizedTeeCollection'
import {
  CATALOG_IMAGE_PLACEHOLDER,
  getProductImage,
  isOutdatedHardcodedMediaUrl,
  isPersistableMediaUrl,
} from './media'

export type ListingProductLike = Pick<ShopProduct, 'slug' | 'image' | 'galleryImages'> & {
  isPlaceholder?: boolean
}

const BLOCKED_IMAGE_FRAGMENTS = [
  'timeless-oversize-hero',
  'featured-men-collection',
  'category-saree-blue',
  'shis-media-tone',
] as const

export function resolveListingProductImage(product: ListingProductLike): string {
  return getProductImage(product)
}

export function isListingPlaceholderImage(image: string): boolean {
  const normalized = image.trim().toLowerCase()
  if (!normalized) {
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
  if (product.isPlaceholder === true) {
    return false
  }

  if (isPlaceholderOversizedTeeProduct(product)) {
    return false
  }

  const image = resolveListingProductImage(product)
  if (!isPersistableMediaUrl(image)) {
    return false
  }

  return !isListingPlaceholderImage(image)
}

export function filterListingProducts<T extends ListingProductLike>(products: T[]): T[] {
  return products.filter(hasListingRenderableImage)
}
