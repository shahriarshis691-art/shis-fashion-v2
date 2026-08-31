/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface AbandonedCartItem {
  id: string
  productId: string
  productName: string
  productImage: string
  price: string
  size: string
  color: string
  quantity: number
  abandonedAt: string
}

export interface WishlistReminderItem {
  id: string
  productId: string
  productName: string
  productImage: string
  price: string
  addedAt: string
  remindedAt?: string
}

export interface BackInStockItem {
  id: string
  productId: string
  productName: string
  productImage: string
  price: string
  notifiedAt?: string
}

interface CustomerRecoveryContextValue {
  abandonedCart: AbandonedCartItem[]
  wishlistReminders: WishlistReminderItem[]
  backInStock: BackInStockItem[]
  markCartRecovered: (productId: string) => void
  clearAbandonedCart: () => void
  addAbandonedCartItem: (item: AbandonedCartItem) => void
  addBackInStockNotification: (productId: string, productName: string, productImage: string, price: string) => void
  removeBackInStockNotification: (productId: string) => void
  markWishlistReminded: (productId: string) => void
}

const STORAGE_KEYS = {
  abandonedCart: 'shis-fashion-abandoned-cart',
  wishlistReminders: 'shis-fashion-wishlist-reminders',
  backInStock: 'shis-fashion-back-in-stock',
}

const CustomerRecoveryContext = createContext<CustomerRecoveryContextValue | undefined>(undefined)

function CustomerRecoveryProvider({ children }: { children: ReactNode }) {
  const [abandonedCart, setAbandonedCart] = useState<AbandonedCartItem[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.abandonedCart)
      return stored ? (JSON.parse(stored) as AbandonedCartItem[]) : []
    } catch {
      return []
    }
  })

  const [wishlistReminders, setWishlistReminders] = useState<WishlistReminderItem[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.wishlistReminders)
      return stored ? (JSON.parse(stored) as WishlistReminderItem[]) : []
    } catch {
      return []
    }
  })

  const [backInStock, setBackInStock] = useState<BackInStockItem[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEYS.backInStock)
      return stored ? (JSON.parse(stored) as BackInStockItem[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.abandonedCart, JSON.stringify(abandonedCart))
  }, [abandonedCart])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.wishlistReminders, JSON.stringify(wishlistReminders))
  }, [wishlistReminders])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.backInStock, JSON.stringify(backInStock))
  }, [backInStock])

  const markCartRecovered = useCallback((productId: string) => {
    setAbandonedCart((currentItems) => currentItems.filter((item) => item.productId !== productId))
  }, [])

  const clearAbandonedCart = useCallback(() => {
    setAbandonedCart([])
  }, [])

  const addAbandonedCartItem = useCallback((item: AbandonedCartItem) => {
    setAbandonedCart((currentItems) => {
      const exists = currentItems.some((existingItem) => existingItem.productId === item.productId)
      if (exists) {
        return currentItems.map((existingItem) =>
          existingItem.productId === item.productId ? item : existingItem,
        )
      }

      return [...currentItems, item]
    })
  }, [])

  const addBackInStockNotification = useCallback((productId: string, productName: string, productImage: string, price: string) => {
    setBackInStock((currentItems) => {
      const exists = currentItems.some((item) => item.productId === productId)
      if (exists) {
        return currentItems
      }

      return [
        ...currentItems,
        {
          id: productId,
          productId,
          productName,
          productImage,
          price,
        },
      ]
    })
  }, [])

  const removeBackInStockNotification = useCallback((productId: string) => {
    setBackInStock((currentItems) => currentItems.filter((item) => item.productId !== productId))
  }, [])

  const markWishlistReminded = useCallback((productId: string) => {
    setWishlistReminders((currentItems) =>
      currentItems.map((item) =>
        item.productId === productId ? { ...item, remindedAt: new Date().toISOString() } : item,
      ),
    )
  }, [])

  const value = useMemo<CustomerRecoveryContextValue>(
    () => ({
      abandonedCart,
      wishlistReminders,
      backInStock,
      markCartRecovered,
      clearAbandonedCart,
      addAbandonedCartItem,
      addBackInStockNotification,
      removeBackInStockNotification,
      markWishlistReminded,
    }),
    [abandonedCart, backInStock, wishlistReminders, markCartRecovered, clearAbandonedCart, addAbandonedCartItem, addBackInStockNotification, removeBackInStockNotification, markWishlistReminded],
  )

  return <CustomerRecoveryContext.Provider value={value}>{children}</CustomerRecoveryContext.Provider>
}

function useCustomerRecovery() {
  const context = useContext(CustomerRecoveryContext)

  if (!context) {
    throw new Error('useCustomerRecovery must be used within a CustomerRecoveryProvider')
  }

  return context
}

export { CustomerRecoveryProvider, useCustomerRecovery }
