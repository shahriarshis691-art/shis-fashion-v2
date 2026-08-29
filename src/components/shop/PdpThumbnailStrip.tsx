import { catalogImageAttrs } from '../../utils/media'

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
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

const THUMB_SIZES = '(max-width: 639px) 22vw, 120px'

/** Horizontal thumbnail row under the PDP hero — uses existing gallery srcs only. */
export default function PdpThumbnailStrip({
  items,
  activeIndex,
  onSelect,
  onError,
  className,
  orientation = 'horizontal',
}: PdpThumbnailStripProps) {
  if (items.length < 2) {
    return null
  }

  const columns = orientation === 'vertical' ? 1 : Math.min(items.length, 4)

  return (
    <div
      className={className ?? 'pdp-thumb-strip'}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      role="tablist"
      aria-label="Product images"
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex
        const image = catalogImageAttrs(item.src, 240, 320, THUMB_SIZES, [160, 240])

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
                src={image.src}
                srcSet={image.srcSet}
                sizes={image.sizes}
                alt=""
                width={240}
                height={320}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  event.currentTarget.removeAttribute('srcset')
                  onError?.(event)
                }}
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
