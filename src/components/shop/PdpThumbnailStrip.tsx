interface PdpThumbnailItem {
  src: string
  alt: string
  label?: string
  imgClassName?: string
}

interface PdpThumbnailStripProps {
  items: PdpThumbnailItem[]
  activeIndex: number
  onSelect: (index: number) => void
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void
}

/** Horizontal thumbnail row under the PDP hero — uses existing gallery srcs only. */
export default function PdpThumbnailStrip({ items, activeIndex, onSelect, onError }: PdpThumbnailStripProps) {
  if (items.length < 2) {
    return null
  }

  const columns = Math.min(items.length, 4)

  return (
    <div
      className="pdp-thumb-strip"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label="Product images"
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex

        return (
          <button
            key={`${item.src}-${index}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={item.label || item.alt || `Image ${index + 1}`}
            onClick={() => onSelect(index)}
            className={`min-w-0 text-left ${isActive ? 'text-neutral-900' : 'text-neutral-500'}`}
          >
            <span
              className={`studio-media-frame block ${
                isActive ? 'ring-1 ring-black' : 'ring-1 ring-black/10'
              }`}
            >
              <img
                src={item.src}
                alt=""
                width={240}
                height={320}
                loading="lazy"
                decoding="async"
                onError={onError}
                className={`gpu-media ${item.imgClassName ?? ''}`.trim()}
              />
            </span>
            {item.label ? (
              <span className="mt-1.5 block text-center text-[10px] font-medium uppercase tracking-[0.12em]">
                {item.label}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
