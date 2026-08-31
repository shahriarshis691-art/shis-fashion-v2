interface PdpQuantityStepperProps {
  value: number
  min?: number
  max: number
  onDecrease: () => void
  onIncrease: () => void
}

export default function PdpQuantityStepper({
  value,
  min = 1,
  max,
  onDecrease,
  onIncrease,
}: PdpQuantityStepperProps) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.14em] text-neutral-500 uppercase">Quantity</p>
      <div className="mt-2 inline-flex h-12 w-[8.75rem] items-stretch border border-neutral-900">
        <button
          type="button"
          onClick={onDecrease}
          disabled={value <= min}
          className="qty-button flex w-11 items-center justify-center text-lg text-neutral-900 disabled:text-neutral-300"
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span className="qty-value flex flex-1 items-center justify-center border-x border-neutral-900 text-sm font-medium tabular-nums text-neutral-900">
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrease}
          disabled={value >= max}
          className="qty-button flex w-11 items-center justify-center text-lg text-neutral-900 disabled:text-neutral-300"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  )
}
