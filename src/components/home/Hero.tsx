import React from 'react'

const DEFAULT_OG_IMAGE = '/og-image.svg'
const HERO_IMAGE = '/hero/saree-heroimage/homepage-hero-image.jpg'
const HERO_IMAGE_FALLBACKS = ['/hero/saree-heroimage/homepage-hero-image.jpg.png']
const HERO_IMAGE_WIDTH = 1122
const HERO_IMAGE_HEIGHT = 1402
const HERO_BACKGROUND = '#f7f5f2'

export interface HeroContentInput {
  heroTitle?: string
  heroCta?: string
  heroPrimaryLink?: string
  heroImage?: string
  heroImageTitle?: string
  heroImageDescription?: string
}

interface HeroProps {
  /** Reserved for layout compatibility; homepage hero is a fixed campaign banner. */
  content?: HeroContentInput
}

function handleHeroImageError(event: React.SyntheticEvent<HTMLImageElement>, fallbacks: string[]) {
  const image = event.currentTarget
  const step = Number.parseInt(image.dataset.fallbackStep ?? '0', 10)

  if (step < fallbacks.length) {
    image.dataset.fallbackStep = String(step + 1)
    image.src = fallbacks[step] ?? DEFAULT_OG_IMAGE
    return
  }

  if (image.src.endsWith(DEFAULT_OG_IMAGE)) {
    return
  }

  image.src = DEFAULT_OG_IMAGE
}

export const Hero: React.FC<HeroProps> = () => {
  return (
    <section
      className="relative z-0 isolate mb-3 w-full max-w-[100vw] overflow-x-hidden md:mb-0"
      style={{ backgroundColor: HERO_BACKGROUND }}
      aria-label="SHIS Fashion hero banner"
    >
      <h1 className="sr-only">SHIS Fashion Bangladesh</h1>

      <div
        className="relative w-full md:flex md:justify-center md:bg-[#f7f5f2]"
        style={{ backgroundColor: HERO_BACKGROUND }}
      >
        <img
          src={HERO_IMAGE}
          alt="SHIS Fashion Exclusive Launch Saree — campaign banner"
          width={HERO_IMAGE_WIDTH}
          height={HERO_IMAGE_HEIGHT}
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          draggable={false}
          className="block h-auto w-full max-w-full object-contain object-top md:mx-auto md:h-auto md:max-h-[85vh] md:w-auto md:max-w-full"
          onError={(event) => handleHeroImageError(event, HERO_IMAGE_FALLBACKS)}
        />
      </div>
    </section>
  )
}
