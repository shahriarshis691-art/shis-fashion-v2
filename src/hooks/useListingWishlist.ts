import { useCallback } from 'react'
import type { ShopProduct } from '../data/shopData'
import { useWishlist } from '../context/WishlistContext'
import { parseBDT } from '../utils/currency'
import { googleAnalytics } from '../services/googleAnalytics'

export function useListingWishlist() {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const handleToggleWishlist = useCallback((product: ShopProduct) => {
    const itemId = String(product.id)

    if (isInWishlist(itemId)) {
      removeFromWishlist(itemId)
      googleAnalytics.trackEvent('wishlist_removed', {
        item_id: itemId,
        item_name: product.name,
        item_category: product.category,
        value: parseBDT(product.price),
        currency: 'BDT',
        brand: product.brand,
      })
      return
    }

    addToWishlist(product)
    googleAnalytics.trackEvent('wishlist_added', {
      item_id: itemId,
      item_name: product.name,
      item_category: product.category,
      value: parseBDT(product.price),
      currency: 'BDT',
      brand: product.brand,
    })
  }, [addToWishlist, isInWishlist, removeFromWishlist])

  return { handleToggleWishlist, isInWishlist }
}
