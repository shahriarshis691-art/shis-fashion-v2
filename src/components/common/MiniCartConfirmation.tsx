import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { subscribeToHomepageContent } from '../../firebase/adminService'
import { formatBDT } from '../../utils/currency'

const DEFAULT_FREE_DELIVERY_THRESHOLD = 3000
const IMAGE_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f4f4f4"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="%23777777"%3ESHIS Fashion%3C/text%3E%3C/svg%3E'

export default function MiniCartConfirmation() {
  const { recentAddition, dismissRecentAddition } = useCart()
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(DEFAULT_FREE_DELIVERY_THRESHOLD)

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => {
      const threshold = content.freeDeliveryThreshold
      if (typeof threshold === 'number' && Number.isFinite(threshold) && threshold >= 0) {
        setFreeDeliveryThreshold(Math.round(threshold))
        return
      }

      setFreeDeliveryThreshold(DEFAULT_FREE_DELIVERY_THRESHOLD)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!recentAddition) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      dismissRecentAddition()
    }, 4500)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [dismissRecentAddition, recentAddition])

  const threshold = Math.max(0, freeDeliveryThreshold)
  const remainingForFreeDelivery = Math.max(0, threshold - (recentAddition?.cartSubtotal ?? 0))
  const progressPercent = threshold > 0
    ? Math.max(0, Math.min(100, Math.round(((recentAddition?.cartSubtotal ?? 0) / threshold) * 100)))
    : 100

  return (
    <AnimatePresence>
      {recentAddition ? (
        <motion.div
          key={recentAddition.itemId}
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-3 z-[70] px-3 sm:bottom-5 sm:px-5"
        >
          <div className="pointer-events-auto mx-auto w-full max-w-xl rounded-[1.2rem] border border-[var(--color-border)] bg-[rgba(255,255,255,0.97)] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:rounded-[1.5rem] sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Added to bag</p>
                <h3 className="mt-1 text-base font-semibold text-[var(--color-text)] sm:text-lg">{recentAddition.productName}</h3>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {recentAddition.color} • {recentAddition.size} • Qty +{recentAddition.quantityAdded}
                </p>
              </div>
              <button
                type="button"
                onClick={dismissRecentAddition}
                className="rounded-full border border-[var(--color-border)] bg-[rgba(0,0,0,0.03)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text)]"
                aria-label="Close mini cart message"
              >
                Close
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3 rounded-[0.9rem] bg-[rgba(0,0,0,0.04)] p-2.5 sm:p-3">
              <img
                src={recentAddition.productImage || IMAGE_PLACEHOLDER}
                alt={recentAddition.productName}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.src = IMAGE_PLACEHOLDER
                }}
                className="h-14 w-14 rounded-[0.8rem] object-cover sm:h-16 sm:w-16"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-text)]">Cart total: {formatBDT(recentAddition.cartSubtotal)}</p>
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">{recentAddition.cartItemCount} item(s) in your bag</p>
                <p className="mt-1 text-xs font-medium text-[var(--color-text)]">
                  {remainingForFreeDelivery > 0
                    ? `Spend ${formatBDT(remainingForFreeDelivery)} more for free delivery.`
                    : 'You unlocked free delivery.'}
                </p>
                <div className="mt-2.5">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(0,0,0,0.08)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-[var(--color-muted)]">
                    {threshold > 0 ? `${progressPercent}% of free-delivery goal` : 'Free delivery goal not set'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link
                to="/cart"
                onClick={dismissRecentAddition}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#1f1f1f] bg-[linear-gradient(180deg,#1a1a1a,#000000)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(0,0,0,0.28)]"
              >
                View cart
              </Link>
              <button
                type="button"
                onClick={dismissRecentAddition}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[rgba(0,0,0,0.03)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)]"
              >
                Continue shopping
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}