import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../../context/CartContext'

const DISMISS_KEY = 'shis-fashion-bag-banner-dismissed'
const HIDDEN_PREFIXES = ['/cart', '/checkout', '/order-success', '/admin', '/shis-admin', '/track-order']

function isHiddenPath(pathname: string) {
  return HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

interface AbandonedCartBannerProps {
  isWelcomePopupOpen?: boolean
}

export default function AbandonedCartBanner({ isWelcomePopupOpen = false }: AbandonedCartBannerProps) {
  const location = useLocation()
  const { itemCount, recentAddition } = useCart()
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.sessionStorage.getItem(DISMISS_KEY) === '1'
  })

  if (
    dismissed
    || isWelcomePopupOpen
    || Boolean(recentAddition)
    || itemCount <= 0
    || isHiddenPath(location.pathname)
  ) {
    return null
  }

  const handleDismiss = () => {
    window.sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="border-b border-black/10 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-3.5 py-2.5 sm:px-6 lg:px-8">
        <p className="min-w-0 text-sm text-black/80">
          You still have {itemCount} item{itemCount === 1 ? '' : 's'} in your bag.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/cart"
            className="ui-interactive border border-black bg-black px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#121212]"
          >
            Return to bag
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="ui-interactive px-2 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/55 hover:text-black"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
