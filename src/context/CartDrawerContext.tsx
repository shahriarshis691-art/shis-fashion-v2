/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface CartDrawerContextValue {
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
}

const CartDrawerContext = createContext<CartDrawerContextValue | undefined>(undefined)

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const value = useMemo(
    () => ({ isOpen, openCart, closeCart }),
    [isOpen, openCart, closeCart],
  )

  return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>
}

export function useCartDrawer() {
  const context = useContext(CartDrawerContext)
  if (!context) {
    throw new Error('useCartDrawer must be used within a CartDrawerProvider')
  }
  return context
}
