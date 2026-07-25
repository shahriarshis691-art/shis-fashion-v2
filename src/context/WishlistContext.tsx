/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ShopProduct } from '../data/shopData'

export interface WishlistItem {
  id: string
  product: ShopProduct
  addedAt: string
}

interface WishlistContextValue {
  items: WishlistItem[]
  addToWishlist: (product: ShopProduct) => void
  removeFromWishlist: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  clearWishlist: () => void
  itemCount: number
  moveToCart: (productId: string) => void
}

const STORAGE_KEY = 'shis-fashion-wishlist'

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined)

function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      return stored ? (JSON.parse(stored) as WishlistItem[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addToWishlist = (product: ShopProduct) => {
    setItems((currentItems) => {
      const exists = currentItems.some((item) => item.product.id === product.id)
      if (exists) {
        return currentItems
      }

      const nextItems = [
        ...currentItems,
        {
          id: String(product.id),
          product,
          addedAt: new Date().toISOString(),
        },
      ]

      return nextItems
    })
  }

  const removeFromWishlist = (productId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.product.id !== productId))
  }

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.product.id === productId)
  }

  const clearWishlist = () => {
    setItems([])
  }

  const moveToCart = (productId: string) => {
    const wishlistItem = items.find((item) => item.product.id === productId)
    if (!wishlistItem) {
      return
    }

    setItems((currentItems) => currentItems.filter((item) => item.product.id !== productId))
  }

  const itemCount = items.length

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      clearWishlist,
      itemCount,
      moveToCart,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, itemCount],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

function useWishlist() {
  const context = useContext(WishlistContext)

  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }

  return context
}

export { WishlistProvider, useWishlist }
