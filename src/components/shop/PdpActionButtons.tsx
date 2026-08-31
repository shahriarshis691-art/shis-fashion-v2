interface PdpActionButtonsProps {
  didAddToBag: boolean
  actionError?: string
  shakeToken?: number
  onAddToBag: () => void
  onBuyNow: () => void
  addLabel?: string
  orderLabel?: string
}

const actionButtonClass =
  'flex h-12 w-full items-center justify-center rounded-none bg-black text-xs font-semibold tracking-[0.18em] text-white uppercase transition-colors hover:bg-neutral-800 active:bg-neutral-900 touch-press'

const addedButtonClass =
  'flex h-12 w-full items-center justify-center rounded-none bg-black text-xs font-semibold tracking-[0.18em] text-white uppercase transition-colors hover:bg-neutral-800 active:bg-neutral-900 touch-press added-confirm'

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
      <button type="button" onClick={onAddToBag} className={didAddToBag ? addedButtonClass : actionButtonClass}>
        {didAddToBag ? 'ADDED' : addLabel}
      </button>
      <button type="button" onClick={onBuyNow} className={actionButtonClass}>
        {orderLabel}
      </button>
    </div>
  )
}
