import PdpGalleryNav from './PdpGalleryNav'
import PdpThumbnailStrip from './PdpThumbnailStrip'

/* eslint-disable react-refresh/only-export-components -- crop view count is shared with the saree PDP */

const SAREE_DETAIL_CROP_VIEWS = [
  {
    id: 'full',
    label: 'Full look',
    scaleClass: 'scale-100',
    positionClass: 'object-center',
    originClass: 'origin-center',
  },
  {
    id: 'texture',
    label: 'Fabric',
    scaleClass: 'scale-[1.85]',
    positionClass: 'object-[48%_58%]',
    originClass: 'origin-center',
  },
  {
    id: 'drape',
    label: 'Drape',
    scaleClass: 'scale-[1.7]',
    positionClass: 'object-[76%_34%]',
    originClass: 'origin-[80%_30%]',
  },
] as const

function uniqueImagePaths(images: string[]) {
  const seen = new Set<string>()
  const out: string[] = []
  for (const src of images) {
    const path = src.trim()
    if (!path || seen.has(path)) {
      continue
    }
    seen.add(path)
    out.push(path)
  }
  return out
}

export function getProductDetailViewCount(images: string[]) {
  const unique = uniqueImagePaths(images)
  if (unique.length >= 2) {
    return unique.length
  }
  return unique.length === 1 ? SAREE_DETAIL_CROP_VIEWS.length : 0
}

function cropImageClass(index: number) {
  const view = SAREE_DETAIL_CROP_VIEWS[index] ?? SAREE_DETAIL_CROP_VIEWS[0]
  return `object-cover ${view.positionClass} ${view.scaleClass} ${view.originClass}`
}

interface ProductDetailGalleryProps {
  name: string
  images: string[]
  altForIndex?: (index: number) => string
  activeIndex: number
  onSelect: (index: number) => void
  onPrev: () => void
  onNext: () => void
  onZoom: () => void
  onError: (event: React.SyntheticEvent<HTMLImageElement>) => void
  onTouchStart: (event: React.TouchEvent<HTMLDivElement>) => void
  onTouchEnd: (event: React.TouchEvent<HTMLDivElement>) => void
}

export default function ProductDetailGallery({
  name,
  images,
  altForIndex,
  activeIndex,
  onSelect,
  onPrev,
  onNext,
  onZoom,
  onError,
  onTouchStart,
  onTouchEnd,
}: ProductDetailGalleryProps) {
  const files = uniqueImagePaths(images)
  const cropMode = files.length === 1
  const viewCount = cropMode ? SAREE_DETAIL_CROP_VIEWS.length : files.length
  const safeIndex = viewCount > 0 ? Math.min(Math.max(activeIndex, 0), viewCount - 1) : 0
  const activeSrc = cropMode ? (files[0] ?? '') : (files[safeIndex] ?? files[0] ?? '')
  const cropClass = cropMode ? cropImageClass(safeIndex) : 'object-cover object-center pdp-gallery-center'
  const activeAlt = altForIndex?.(safeIndex)
    ?? (cropMode ? `${name} — ${SAREE_DETAIL_CROP_VIEWS[safeIndex]?.label ?? 'Full look'}` : name)

  const thumbItems = cropMode
    ? SAREE_DETAIL_CROP_VIEWS.map((view, index) => ({
        src: files[0] ?? '',
        alt: `${name} — ${view.label}`,
        label: view.label,
        imgClassName: `pdp-gallery-center transition-transform duration-500 ease-out ${cropImageClass(index)}`,
      }))
    : files.map((src, index) => ({
        src,
        alt: altForIndex?.(index) ?? name,
        imgClassName: 'pdp-gallery-center',
      }))

  if (!activeSrc) {
    return null
  }

  return (
    <div className="lg:flex lg:items-start lg:gap-3">
      {viewCount > 1 ? (
        <div className="hidden lg:block lg:w-[4.75rem] lg:shrink-0 xl:w-[5.25rem]">
          <PdpThumbnailStrip
            items={thumbItems}
            activeIndex={safeIndex}
            onSelect={onSelect}
            onError={onError}
            orientation="vertical"
            className="grid gap-2"
          />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div
          className="studio-media-frame aspect-[3/4]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            className="absolute inset-0 z-[1] overflow-hidden"
            onClick={onZoom}
            aria-label={`Zoom ${name}`}
          >
            <img
              key={`${activeSrc}-${safeIndex}`}
              src={activeSrc}
              alt={activeAlt}
              width={960}
              height={1280}
              sizes="(max-width: 1023px) 100vw, 50vw"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className={`pdp-main-image pdp-gallery-center gpu-media cursor-zoom-in transition-[opacity,transform] duration-500 ease-out ${cropClass}`}
              onError={onError}
            />
          </button>
          <PdpGalleryNav
            count={viewCount}
            index={safeIndex}
            onPrev={onPrev}
            onNext={onNext}
            onSelect={onSelect}
          />
        </div>

        {viewCount > 1 ? (
          <div className="lg:hidden">
            <PdpThumbnailStrip
              items={thumbItems}
              activeIndex={safeIndex}
              onSelect={onSelect}
              onError={onError}
              orientation="horizontal"
              className="mt-3 grid gap-2 px-4 sm:px-8"
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
