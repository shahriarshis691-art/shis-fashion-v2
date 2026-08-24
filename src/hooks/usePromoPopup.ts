import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'shis_promo_popup_dismissed'
const TRIGGER_DELAY_MS = 3500
const COOLDOWN_MS = 24 * 60 * 60 * 1000

function isRecentlyDismissed(): boolean {
  if (typeof window === 'undefined') {
    return true
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return false
    }

    const dismissedAt = Number(stored)
    if (Number.isNaN(dismissedAt)) {
      return false
    }

    return Date.now() - dismissedAt < COOLDOWN_MS
  } catch {
    return true
  }
}

export interface UsePromoPopupOptions {
  enabled?: boolean
}

export interface UsePromoPopupResult {
  isOpen: boolean
  close: () => void
}

export function usePromoPopup({ enabled = true }: UsePromoPopupOptions = {}): UsePromoPopupResult {
  const [isOpen, setIsOpen] = useState(false)
  const triggeredRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)

  const close = useCallback(() => {
    setIsOpen(false)

    try {
      window.localStorage.setItem(STORAGE_KEY, String(Date.now()))
    } catch {
      // Ignore storage failures; popup should still close.
    }
  }, [])

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return
    }

    if (isRecentlyDismissed()) {
      return
    }

    timeoutRef.current = window.setTimeout(() => {
      if (triggeredRef.current) {
        return
      }

      triggeredRef.current = true
      setIsOpen(true)
    }, TRIGGER_DELAY_MS)

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [enabled])

  return { isOpen, close }
}
