/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode, useCallback } from 'react'
import type { ShopProduct } from '../data/shopData'
import { parseBDT } from '../utils/currency'
import { useCustomerRecovery } from './CustomerRecoveryContext'

export interface CartItem extends Omit<ShopProduct, 'id'> {
  id: string
  size: string
  color: string
  quantity: number
}

export interface CartAdditionEvent {
  itemId: string
  productName: string
  productImage: string
  size: string
  color: string
  unitPrice: number
  quantityAdded: number
  cartSubtotal: number
  cartItemCount: number
}

export interface CouponApplied {
  code: string
  discountPercent: number
  discountAmount: number
  couponId?: string
}

interface CartContextValue {
  items: CartItem[]
  addToCart: (product: ShopProduct, options: { size: string; color: string; quantity?: number }) => void
  updateQuantity: (itemId: string, change: number) => void
  removeFromCart: (itemId: string) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
  appliedCoupon: CouponApplied | null
  applyCoupon: (couponCode: string, couponId?: string, discountPercent?: number) => boolean
  removeCoupon: () => void
  discountAmount: number
  grandTotal: number
  recentAddition: CartAdditionEvent | null
  dismissRecentAddition: () => void
}

const STORAGE_KEY = 'shis-fashion-cart'
const COUPON_STORAGE_KEY = 'shis-fashion-coupon'
const BUY_NOW_KEY = 'shis-fashion-buy-now'

export function readBuyNowCheckout(): CartItem[] | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(BUY_NOW_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

export function writeBuyNowCheckout(items: CartItem[]) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(items))
}

export function clearBuyNowCheckout() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(BUY_NOW_KEY)
}

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
  const [coupon, setCoupon] = useState<CouponApplied | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const stored = window.localStorage.getItem(COUPON_STORAGE_KEY)
      return stored ? (JSON.parse(stored) as CouponApplied) : null
    } catch {
      return null
    }
  })
  const [recentAddition, setRecentAddition] = useState<CartAdditionEvent | null>(null)
  const { addAbandonedCartItem, clearAbandonedCart } = useCustomerRecovery()
  const previousItemsRef = useRef<CartItem[]>([])

  useEffect(() => {
    previousItemsRef.current = items
  }, [items])

  useEffect(() => {
    if (items.length === 0 && previousItemsRef.current.length > 0) {
      const abandonedItems = previousItemsRef.current.map((item) => ({
        id: item.id,
        productId: item.slug,
        productName: item.name,
        productImage: item.image,
        price: item.price,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        abandonedAt: new Date().toISOString(),
      }))

      abandonedItems.forEach((item) => {
        addAbandonedCartItem(item)
      })
    }
  }, [items, addAbandonedCartItem])

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (items.length > 0) {
        const abandonedItems = items.map((item) => ({
          id: item.id,
          productId: item.slug,
          productName: item.name,
          productImage: item.image,
          price: item.price,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          abandonedAt: new Date().toISOString(),
        }))

        abandonedItems.forEach((item) => {
          addAbandonedCartItem(item)
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [items, addAbandonedCartItem])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    if (coupon) {
      window.localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon))
    } else {
      window.localStorage.removeItem(COUPON_STORAGE_KEY)
    }
  }, [coupon])

  const addToCart = (product: ShopProduct, options: { size: string; color: string; quantity?: number }) => {
    const requestedQuantity = Math.max(1, options.quantity ?? 1)
    const stockLimit = typeof product.stock === 'number' ? Math.max(0, product.stock) : undefined

    if (typeof stockLimit === 'number' && stockLimit <= 0) {
      return
    }

    const itemId = `${product.slug}-${options.size}-${options.color}`
    let nextAddition: CartAdditionEvent | null = null

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === itemId)
      const effectiveQuantity = typeof stockLimit === 'number'
        ? Math.min(requestedQuantity, stockLimit)
        : requestedQuantity

      if (existingItem) {
        const nextQuantity = typeof stockLimit === 'number'
          ? Math.min(existingItem.quantity + effectiveQuantity, stockLimit)
          : existingItem.quantity + effectiveQuantity

        const quantityAdded = Math.max(0, nextQuantity - existingItem.quantity)
        if (quantityAdded <= 0) {
          return currentItems
        }

        const nextItems = currentItems.map((item) => (item.id === itemId ? { ...item, quantity: nextQuantity } : item))
        const nextSubtotal = nextItems.reduce((sum, item) => sum + parseBDT(item.price) * item.quantity, 0)
        const nextItemCount = nextItems.reduce((sum, item) => sum + item.quantity, 0)

        nextAddition = {
          itemId,
          productName: existingItem.name,
          productImage: existingItem.image,
          size: existingItem.size,
          color: existingItem.color,
          unitPrice: parseBDT(existingItem.price),
          quantityAdded,
          cartSubtotal: nextSubtotal,
          cartItemCount: nextItemCount,
        }

        return nextItems
      }

      const nextItems = [
        ...currentItems,
        {
          ...product,
          id: itemId,
          size: options.size,
          color: options.color,
          quantity: effectiveQuantity,
        },
      ]

      const nextSubtotal = nextItems.reduce((sum, item) => sum + parseBDT(item.price) * item.quantity, 0)
      const nextItemCount = nextItems.reduce((sum, item) => sum + item.quantity, 0)

      nextAddition = {
        itemId,
        productName: product.name,
        productImage: product.image,
        size: options.size,
        color: options.color,
        unitPrice: parseBDT(product.price),
        quantityAdded: effectiveQuantity,
        cartSubtotal: nextSubtotal,
        cartItemCount: nextItemCount,
      }

      return nextItems
    })

    if (nextAddition) {
      setRecentAddition(nextAddition)
    }
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

  const clearCart = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
      window.localStorage.removeItem(COUPON_STORAGE_KEY)
    }
    setItems([])
    setCoupon(null)
    clearAbandonedCart()
  }, [clearAbandonedCart])

  const dismissRecentAddition = () => {
    setRecentAddition(null)
  }

  const applyCoupon = useCallback((code: string, couponId?: string, discountPercent?: number): boolean => {
    const trimmedCode = code.trim().toUpperCase()
    if (!trimmedCode) {
      return false
    }

    const safePercent = Number.isFinite(discountPercent) ? Math.min(100, Math.max(0, Number(discountPercent))) : 5

    const newCoupon: CouponApplied = {
      code: trimmedCode,
      discountPercent: safePercent,
      discountAmount: 0,
      couponId,
    }

    setCoupon(newCoupon)
    return true
  }, [])

  const removeCoupon = useCallback(() => {
    setCoupon(null)
  }, [])

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + parseBDT(item.price) * item.quantity, 0)
  const discountAmount = coupon ? Math.round(subtotal * coupon.discountPercent / 100 * 100) / 100 : 0
  const grandTotal = subtotal - discountAmount

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      itemCount,
      subtotal,
      appliedCoupon: coupon,
      applyCoupon,
      removeCoupon,
      discountAmount,
      grandTotal,
      recentAddition,
      dismissRecentAddition,
    }),
    [items, itemCount, recentAddition, subtotal, coupon, applyCoupon, removeCoupon, discountAmount, grandTotal, clearCart],
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
