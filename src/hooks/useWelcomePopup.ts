import { useEffect, useRef, useState } from 'react'
import { auth } from '../firebase/firebase'

const STORAGE_KEY_COMPLETED = 'shis_popup_completed'
const STORAGE_KEY_CLOSED = 'shis_popup_closed'
const STORAGE_KEY_EMAIL = 'shis_popup_email'
const TRIGGER_DELAY_MS = 8000
const SCROLL_THRESHOLD = 0.4

function isPopupCompleted(): boolean {
  if (typeof window === 'undefined') {
    return true
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY_COMPLETED) === '1'
  } catch {
    return true
  }
}

function isRecentlyDismissed(): boolean {
  if (typeof window === 'undefined') {
    return true
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY_CLOSED)
    if (!stored) {
      return false
    }

    const dismissedAt = Number(stored)
    if (Number.isNaN(dismissedAt)) {
      return false
    }

    const sevenDays = 7 * 24 * 60 * 60 * 1000
    return Date.now() - dismissedAt < sevenDays
  } catch {
    return true
  }
}

function isLoggedIn(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return Boolean(auth?.currentUser)
}

export interface UseWelcomePopupResult {
  isPopupOpen: boolean
  openPopup: () => void
  closePopup: () => void
  completePopup: (email?: string) => void
  resetPopup: () => void
}

export function useWelcomePopup(): UseWelcomePopupResult {
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const triggeredRef = useRef(false)
  const timeoutRef = useRef<number | null>(null)

  const resetPopup = () => {
    triggeredRef.current = false
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const closePopup = () => {
    setIsPopupOpen(false)
    window.localStorage.setItem(STORAGE_KEY_CLOSED, String(Date.now()))
  }

  const completePopup = (email?: string) => {
    setIsPopupOpen(false)
    window.localStorage.setItem(STORAGE_KEY_COMPLETED, '1')
    if (email) {
      window.localStorage.setItem(STORAGE_KEY_EMAIL, email)
    }
    window.localStorage.setItem(STORAGE_KEY_CLOSED, String(Date.now()))
  }

  const openPopup = () => {
    if (triggeredRef.current) {
      return
    }

    triggeredRef.current = true
    setIsPopupOpen(true)
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (isPopupCompleted()) {
      return
    }

    if (isRecentlyDismissed()) {
      return
    }

    if (isLoggedIn()) {
      return
    }

    const onScroll = () => {
      if (triggeredRef.current) {
        return
      }

      const scrollTop = window.scrollY || window.pageYOffset || 0
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) {
        return
      }

      const scrollPercent = scrollTop / docHeight
      if (scrollPercent >= SCROLL_THRESHOLD) {
        openPopup()
      }
    }

    timeoutRef.current = window.setTimeout(() => {
      openPopup()
    }, TRIGGER_DELAY_MS)

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return {
    isPopupOpen,
    openPopup,
    closePopup,
    completePopup,
    resetPopup,
  }
}
