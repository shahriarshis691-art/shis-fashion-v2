import PdpGalleryNav from './PdpGalleryNav'
import PdpThumbnailStrip from './PdpThumbnailStrip'

export const HALF_SHIRT_CROP_VIEWS = [
  {
    id: 'full',
    label: 'Full Look',
    scaleClass: 'scale-100',
    positionClass: 'object-[center_top]',
    originClass: 'origin-[50%_0%]',
  },
  {
    id: 'collar',
    label: 'Collar & Buttons',
    scaleClass: 'scale-[2.5]',
    positionClass: 'object-[50%_25%]',
    originClass: 'origin-[50%_25%]',
  },
  {
    id: 'texture',
    label: 'Fabric Texture',
    scaleClass: 'scale-[3.25]',
    positionClass: 'object-[50%_50%]',
    originClass: 'origin-center',
  },
] as const

export type HalfShirtCropView = (typeof HALF_SHIRT_CROP_VIEWS)[number]

export function getHalfShirtCropView(index: number): HalfShirtCropView {
  return HALF_SHIRT_CROP_VIEWS[index] ?? HALF_SHIRT_CROP_VIEWS[0]
}

export function halfShirtCropImageClass(index: number) {
  const view = getHalfShirtCropView(index)
  return `object-cover ${view.positionClass} ${view.scaleClass} ${view.originClass}`
}

interface PdpCssCropGalleryProps {
  src: string
  srcSet?: string
  sizes?: string
  name: string
  activeIndex: number
  onSelect: (index: number) => void
  onPrev: () => void
  onNext: () => void
  onZoom: () => void
  onError: (event: React.SyntheticEvent<HTMLImageElement>) => void
  onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void
  onTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void
}

export default function PdpCssCropGallery({
  src,
  srcSet,
  sizes,
  name,
  activeIndex,
  onSelect,
  onPrev,
  onNext,
  onZoom,
  onError,
  onTouchStart,
  onTouchEnd,
}: PdpCssCropGalleryProps) {
  const safeIndex = Math.min(Math.max(activeIndex, 0), HALF_SHIRT_CROP_VIEWS.length - 1)
  const activeView = getHalfShirtCropView(safeIndex)

  return (
    <div>
      <div
        className="studio-media-frame"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          className="absolute inset-0 z-[1] overflow-hidden"
          onClick={onZoom}
          aria-label={`Zoom ${name} — ${activeView.label}`}
        >
          <img
            src={src}
            srcSet={srcSet}
            sizes={sizes}
            alt={`${name} — ${activeView.label}`}
            width={1200}
            height={1600}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onError={onError}
            className={`pdp-main-image gpu-media cursor-zoom-in transition-transform duration-500 ease-out ${halfShirtCropImageClass(safeIndex)}`}
          />
        </button>
        <PdpGalleryNav
          count={HALF_SHIRT_CROP_VIEWS.length}
          index={safeIndex}
          onPrev={onPrev}
          onNext={onNext}
          onSelect={onSelect}
        />
      </div>

      <PdpThumbnailStrip
        items={HALF_SHIRT_CROP_VIEWS.map((view, index) => ({
          src,
          alt: `${name} — ${view.label}`,
          label: view.label,
          imgClassName: `transition-transform duration-500 ease-out ${halfShirtCropImageClass(index)}`,
        }))}
        activeIndex={safeIndex}
        onSelect={onSelect}
        onError={onError}
      />
    </div>
  )
}
