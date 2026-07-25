/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ShopProduct } from '../data/shopData'

export interface RecentlyViewedItem {
  id: string
  product: ShopProduct
  viewedAt: string
}

interface RecentlyViewedContextValue {
  items: RecentlyViewedItem[]
  addToRecentlyViewed: (product: ShopProduct) => void
  clearRecentlyViewed: () => void
}

const STORAGE_KEY = 'shis-fashion-recently-viewed'
const MAX_HISTORY = 20

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | undefined>(undefined)

function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>(() => {
    if (typeof window === 'undefined') {
      return []
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      return stored ? (JSON.parse(stored) as RecentlyViewedItem[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addToRecentlyViewed = (product: ShopProduct) => {
    setItems((currentItems) => {
      const filtered = currentItems.filter((item) => item.product.id !== product.id)
      const nextItems = [
        { id: String(product.id), product, viewedAt: new Date().toISOString() },
        ...filtered,
      ].slice(0, MAX_HISTORY)

      return nextItems
    })
  }

  const clearRecentlyViewed = () => {
    setItems([])
  }

  const value = useMemo<RecentlyViewedContextValue>(
    () => ({
      items,
      addToRecentlyViewed,
      clearRecentlyViewed,
    }),
    [items],
  )

  return <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>
}

function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext)

  if (!context) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider')
  }

  return context
}

export { RecentlyViewedProvider, useRecentlyViewed }
