interface PdpActionButtonsProps {
  didAddToBag: boolean
  actionError?: string
  shakeToken?: number
  onAddToBag: () => void
  onBuyNow: () => void
  addLabel?: string
  orderLabel?: string
}

export default function PdpActionButtons({
  didAddToBag,
  actionError = '',
  shakeToken = 0,
  onAddToBag,
  onBuyNow,
  addLabel = 'ADD TO BAG',
  orderLabel = 'ORDER NOW',
}: PdpActionButtonsProps) {
  return (
    <div key={shakeToken} className={`mt-6 space-y-2.5 ${actionError ? 'ui-shake' : ''}`}>
      {actionError ? (
        <p className="text-center text-xs font-medium text-red-600" role="alert">
          {actionError}
        </p>
      ) : null}
      <button type="button" onClick={onAddToBag} className="btn-glass-cta w-full">
        {didAddToBag ? 'ADDED' : addLabel}
      </button>
      <button type="button" onClick={onBuyNow} className="btn-glass-cta w-full">
        {orderLabel}
      </button>
    </div>
  )
}
