import { useCallback } from 'react'
import {
  MENS_SHIRTS_HERO_BACKGROUND,
  MENS_SHIRTS_HERO_HEIGHT,
  MENS_SHIRTS_HERO_IMAGE,
  MENS_SHIRTS_HERO_IMAGE_FALLBACK,
  MENS_SHIRTS_HERO_SIZES,
  MENS_SHIRTS_HERO_WIDTH,
} from '../../data/mensShirtCollection'

const DEFAULT_OG_IMAGE = '/og-image.svg'

export default function ShirtsListingHero() {
  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget
    const step = Number.parseInt(image.dataset.fallbackStep ?? '0', 10)

    if (step < 1) {
      image.dataset.fallbackStep = '1'
      image.src = MENS_SHIRTS_HERO_IMAGE_FALLBACK
      return
    }

    if (image.src.endsWith(DEFAULT_OG_IMAGE)) {
      return
    }

    image.src = DEFAULT_OG_IMAGE
  }, [])

  return (
    <section
      className="relative z-0 isolate w-full max-w-[100vw] overflow-x-hidden"
      style={{ backgroundColor: MENS_SHIRTS_HERO_BACKGROUND }}
      aria-label="Men's Shirts collection banner"
    >
      <div
        className="relative w-full overflow-hidden max-md:[aspect-ratio:var(--hero-aspect)] md:aspect-[16/9]"
        style={{
          '--hero-aspect': `${MENS_SHIRTS_HERO_WIDTH} / ${MENS_SHIRTS_HERO_HEIGHT}`,
          backgroundColor: MENS_SHIRTS_HERO_BACKGROUND,
        } as React.CSSProperties}
      >
        <img
          src={MENS_SHIRTS_HERO_IMAGE}
          alt="Men's Shirts Collection — SHIS Fashion"
          width={MENS_SHIRTS_HERO_WIDTH}
          height={MENS_SHIRTS_HERO_HEIGHT}
          sizes={MENS_SHIRTS_HERO_SIZES}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          draggable={false}
          className="gpu-media block h-full w-full max-w-full object-contain object-center md:h-auto md:w-full md:max-w-none md:transform-gpu md:[backface-visibility:hidden] md:[image-rendering:auto] md:[transform:translateZ(0)]"
          style={{ objectPosition: 'center' }}
          onError={handleError}
        />
      </div>
    </section>
  )
}
