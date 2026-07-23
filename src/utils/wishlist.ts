import type { ShopProduct } from '../data/shopData'

const WISHLIST_STORAGE_KEY = 'shis-fashion-wishlist'

function getStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

export function toWishlistKey(product: Pick<ShopProduct, 'category' | 'slug'>) {
  return `${product.category}::${product.slug}`
}

export function getWishlistKeys() {
  const storage = getStorage()
  if (!storage) {
    return []
  }

  try {
    const stored = storage.getItem(WISHLIST_STORAGE_KEY)
    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((value): value is string => typeof value === 'string')
  } catch {
    return []
  }
}

function persistWishlistKeys(keys: string[]) {
  const storage = getStorage()
  if (!storage) {
    return
  }

  storage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(keys))
  window.dispatchEvent(new Event('wishlist:updated'))
}

export function isWishlistedProduct(product: Pick<ShopProduct, 'category' | 'slug'>) {
  const key = toWishlistKey(product)
  return getWishlistKeys().includes(key)
}

export function toggleWishlistedProduct(product: Pick<ShopProduct, 'category' | 'slug'>) {
  const key = toWishlistKey(product)
  const keys = getWishlistKeys()

  if (keys.includes(key)) {
    const next = keys.filter((entry) => entry !== key)
    persistWishlistKeys(next)
    return false
  }

  persistWishlistKeys([...keys, key])
  return true
}