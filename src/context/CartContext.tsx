/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ShopProduct } from '../data/shopData'
import { parseBDT } from '../utils/currency'

export interface CartItem extends Omit<ShopProduct, 'id'> {
  id: string
  size: string
  color: string
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  addToCart: (product: ShopProduct, options: { size: string; color: string; quantity?: number }) => void
  updateQuantity: (itemId: string, change: number) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
}

const STORAGE_KEY = 'shis-fashion-cart'

const CartContext = createContext<CartContextValue | undefined>(undefined)

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      return stored ? (JSON.parse(stored) as CartItem[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addToCart = (product: ShopProduct, options: { size: string; color: string; quantity?: number }) => {
    const requestedQuantity = Math.max(1, options.quantity ?? 1)
    const stockLimit = typeof product.stock === 'number' ? Math.max(0, product.stock) : undefined

    if (typeof stockLimit === 'number' && stockLimit <= 0) {
      return
    }

    const itemId = `${product.slug}-${options.size}-${options.color}`

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === itemId)
      const effectiveQuantity = typeof stockLimit === 'number'
        ? Math.min(requestedQuantity, stockLimit)
        : requestedQuantity

      if (existingItem) {
        const nextQuantity = typeof stockLimit === 'number'
          ? Math.min(existingItem.quantity + effectiveQuantity, stockLimit)
          : existingItem.quantity + effectiveQuantity

        return currentItems.map((item) => (item.id === itemId ? { ...item, quantity: nextQuantity } : item))
      }

      return [
        ...currentItems,
        {
          ...product,
          id: itemId,
          size: options.size,
          color: options.color,
          quantity: effectiveQuantity,
        },
      ]
    })
  }

  const updateQuantity = (itemId: string, change: number) => {
    setItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.id !== itemId) {
            return item
          }

          const stockLimit = typeof item.stock === 'number' ? Math.max(0, item.stock) : undefined
          const nextQuantity = item.quantity + change

          if (typeof stockLimit === 'number') {
            return { ...item, quantity: Math.min(nextQuantity, stockLimit) }
          }

          return { ...item, quantity: nextQuantity }
        })
        .filter((item) => item.quantity > 0),
    )
  }

  const removeFromCart = (itemId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId))
  }

  const clearCart = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    setItems([])
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + parseBDT(item.price) * item.quantity, 0)

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      itemCount,
      subtotal,
    }),
    [items, itemCount, subtotal],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return context
}

export { CartProvider, useCart }
