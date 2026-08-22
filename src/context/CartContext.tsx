/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode, useCallback } from 'react'
import type { ShopProduct } from '../data/shopData'
import { parseBDT } from '../utils/currency'
import { getVariantStock } from '../utils/variantStock'
import { quoteCouponDiscount, type CouponDiscountType } from '../utils/coupon'
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
  discountType?: CouponDiscountType
  discountFixedBdt?: number
  minSpend?: number
  applicableCategories?: string[]
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
  applyCoupon: (coupon: Omit<CouponApplied, 'discountAmount'> & { discountAmount?: number }) => boolean
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

  const next = parseStoredCart(window.sessionStorage.getItem(BUY_NOW_KEY))
  return next.length ? next : null
}

export function writeBuyNowCheckout(items: CartItem[]) {
  if (typeof window === 'undefined') {
    return
  }

  const next = items.map(hydrateCartItem).filter((item): item is CartItem => Boolean(item))
  if (!next.length) {
    window.sessionStorage.removeItem(BUY_NOW_KEY)
    return
  }

  window.sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(next))
}

export function clearBuyNowCheckout() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(BUY_NOW_KEY)
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

function lineStockLimit(product: Pick<ShopProduct, 'stock' | 'variants'>, size: string, color: string) {
  return Math.max(0, getVariantStock(product, size, color))
}

function hydrateCartItem(value: unknown): CartItem | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const item = value as CartItem
  if (!item.slug || !item.size) {
    return null
  }

  const limit = lineStockLimit(item, item.size, item.color || 'Default')
  const quantity = Math.min(Math.max(0, Number(item.quantity) || 0), limit)
  if (quantity <= 0) {
    return null
  }

  return {
    ...item,
    color: item.color || 'Default',
    stock: limit,
    quantity,
  }
}

function parseStoredCart(raw: string | null): CartItem[] {
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map(hydrateCartItem).filter((item): item is CartItem => Boolean(item))
  } catch {
    return []
  }
}

function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    return parseStoredCart(window.localStorage.getItem(STORAGE_KEY))
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

  const addToCart = useCallback((product: ShopProduct, options: { size: string; color: string; quantity?: number }) => {
    const requestedQuantity = Math.max(1, options.quantity ?? 1)
    const size = options.size
    const color = options.color || 'Default'
    const stockLimit = lineStockLimit(product, size, color)

    if (stockLimit <= 0) {
      return
    }

    const itemId = `${product.slug}-${size}-${color}`
    let nextAddition: CartAdditionEvent | null = null

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === itemId)
      const effectiveQuantity = Math.min(requestedQuantity, stockLimit)

      if (existingItem) {
        const nextQuantity = Math.min(existingItem.quantity + effectiveQuantity, stockLimit)
        const quantityAdded = Math.max(0, nextQuantity - existingItem.quantity)
        if (quantityAdded <= 0) {
          return currentItems
        }

        const nextItems = currentItems.map((item) => (
          item.id === itemId
            ? { ...item, quantity: nextQuantity, stock: stockLimit, variants: product.variants ?? item.variants }
            : item
        ))
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
          size,
          color,
          quantity: effectiveQuantity,
          stock: stockLimit,
          variants: product.variants ?? [],
        },
      ]

      const nextSubtotal = nextItems.reduce((sum, item) => sum + parseBDT(item.price) * item.quantity, 0)
      const nextItemCount = nextItems.reduce((sum, item) => sum + item.quantity, 0)

      nextAddition = {
        itemId,
        productName: product.name,
        productImage: product.image,
        size,
        color,
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
  }, [])

  const updateQuantity = useCallback((itemId: string, change: number) => {
    setItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.id !== itemId) {
            return item
          }

          const stockLimit = lineStockLimit(item, item.size, item.color)
          const nextQuantity = item.quantity + change
          return { ...item, stock: stockLimit, quantity: Math.min(nextQuantity, stockLimit) }
        })
        .filter((item) => item.quantity > 0),
    )
  }, [])

  const removeFromCart = useCallback((itemId: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId))
  }, [])

  const clearCart = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
      window.localStorage.removeItem(COUPON_STORAGE_KEY)
    }
    setItems([])
    setCoupon(null)
    clearAbandonedCart()
  }, [clearAbandonedCart])

  const dismissRecentAddition = useCallback(() => {
    setRecentAddition(null)
  }, [])

  const applyCoupon = useCallback((couponInput: Omit<CouponApplied, 'discountAmount'> & { discountAmount?: number }): boolean => {
    const trimmedCode = couponInput.code.trim().toUpperCase()
    if (!trimmedCode) {
      return false
    }

    const safePercent = Number.isFinite(couponInput.discountPercent)
      ? Math.min(100, Math.max(0, Number(couponInput.discountPercent)))
      : 0

    const newCoupon: CouponApplied = {
      code: trimmedCode,
      discountPercent: safePercent,
      discountAmount: 0,
      couponId: couponInput.couponId,
      discountType: couponInput.discountType === 'fixed' ? 'fixed' : 'percent',
      discountFixedBdt: Math.max(0, Number(couponInput.discountFixedBdt ?? 0) || 0),
      minSpend: Math.max(0, Number(couponInput.minSpend ?? 0) || 0),
      applicableCategories: couponInput.applicableCategories ?? [],
    }

    setCoupon(newCoupon)
    return true
  }, [])

  const removeCoupon = useCallback(() => {
    setCoupon(null)
  }, [])

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + parseBDT(item.price) * item.quantity, 0), [items])
  const discountAmount = coupon
    ? quoteCouponDiscount(coupon, items.map((item) => ({
      category: item.category,
      price: parseBDT(item.price),
      quantity: item.quantity,
    }))).amount
    : 0
  const grandTotal = Math.max(0, subtotal - discountAmount)

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
    [items, itemCount, recentAddition, subtotal, coupon, addToCart, updateQuantity, removeFromCart, applyCoupon, removeCoupon, discountAmount, grandTotal, clearCart, dismissRecentAddition],
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
