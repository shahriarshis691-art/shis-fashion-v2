interface MobilePdpStickyBarProps {
  didAddToBag: boolean
  actionError?: string
  shakeToken?: number
  wished?: boolean
  onAddToBag: () => void
  onBuyNow: () => void
  onToggleWishlist?: () => void
  buyNowLabel?: string
}

/** Fixed mobile PDP CTA — sits above WhatsApp; never silently swallows taps. */
export default function MobilePdpStickyBar({
  didAddToBag,
  actionError = '',
  shakeToken = 0,
  wished = false,
  onAddToBag,
  onBuyNow,
  onToggleWishlist,
  buyNowLabel = 'Order Now',
}: MobilePdpStickyBarProps) {
  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur-md sm:hidden">
      <div
        key={shakeToken}
        className={`pb-[max(0.25rem,env(safe-area-inset-bottom))] ${actionError ? 'ui-shake' : ''}`}
      >
        {actionError ? (
          <p className="mb-2 text-center text-xs font-medium text-red-600" role="alert">
            {actionError}
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddToBag}
            className="flex-1 rounded-xl border border-neutral-300 bg-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-900 transition-transform active:scale-95"
          >
            {didAddToBag ? 'Added' : 'Add to Bag'}
          </button>
          <button
            type="button"
            onClick={onBuyNow}
            className="flex-1 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95"
          >
            {buyNowLabel}
          </button>
          {onToggleWishlist ? (
            <button
              type="button"
              onClick={onToggleWishlist}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                wished ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 text-neutral-700'
              }`}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
