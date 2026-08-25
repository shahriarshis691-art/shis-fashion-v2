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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-3 shadow-lg md:hidden">
      <div
        key={shakeToken}
        className={`pb-[max(0px,env(safe-area-inset-bottom))] ${actionError ? 'ui-shake' : ''}`}
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
            className="flex-1 rounded-sm border border-neutral-900 bg-white px-3 py-3 text-xs font-semibold tracking-wider text-neutral-900 uppercase transition-transform active:scale-[0.98]"
          >
            {didAddToBag ? 'Added' : addToCartLabel}
          </button>
          <button
            type="button"
            onClick={onBuyNow}
            className="flex-1 rounded-sm bg-neutral-950 px-3 py-3 text-xs font-semibold tracking-wider text-white uppercase shadow-md transition-transform active:scale-[0.98]"
          >
            {buyNowLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
