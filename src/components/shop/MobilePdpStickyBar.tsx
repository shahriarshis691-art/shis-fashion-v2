interface MobilePdpStickyBarProps {
  didAddToBag: boolean
  actionError?: string
  shakeToken?: number
  onAddToBag: () => void
  onBuyNow: () => void
  buyNowLabel?: string
  addToCartLabel?: string
}

/** Fixed mobile PDP CTA — size/color gated via parent handlers; never silently disabled. */
export default function MobilePdpStickyBar({
  didAddToBag,
  actionError = '',
  shakeToken = 0,
  onAddToBag,
  onBuyNow,
  buyNowLabel = 'Buy Now',
  addToCartLabel = 'Add to Cart',
}: MobilePdpStickyBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[55] border-t border-gray-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg md:hidden">
      <div
        key={shakeToken}
        className={actionError ? 'ui-shake' : ''}
      >
        {actionError ? (
          <p className="mb-2 text-center text-xs font-medium text-red-600" role="alert">
            {actionError}
          </p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onAddToBag}
            className="btn-glass-cta flex-1 px-3 sm:px-6"
          >
            {didAddToBag ? 'Added' : addToCartLabel}
          </button>
          <button
            type="button"
            onClick={onBuyNow}
            className="btn-glass-cta flex-1 px-3 sm:px-6"
          >
            {buyNowLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
