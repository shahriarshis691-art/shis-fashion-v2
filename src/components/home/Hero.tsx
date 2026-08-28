import React from 'react'

const DEFAULT_OG_IMAGE = '/og-image.svg'
const HERO_IMAGE = '/hero/saree-heroimage/homepage-hero-image.jpg'
const HERO_IMAGE_FALLBACKS = ['/hero/saree-heroimage/homepage-hero-image.jpg.png']

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
      className="relative z-0 isolate mb-3 w-full max-w-[100vw] overflow-x-hidden bg-neutral-950 md:mb-0"
      aria-label="SHIS Fashion hero banner"
    >
      <h1 className="sr-only">SHIS Fashion Bangladesh</h1>

      <div className="homepage-hero-frame relative h-[75vh] min-h-[70vh] w-full overflow-hidden bg-neutral-950 md:h-[75vh] md:min-h-[75vh] md:w-full">
        <img
          src={HERO_IMAGE}
          alt="SHIS Fashion Exclusive Launch Saree — campaign banner"
          width={900}
          height={1600}
          sizes="100vw"
          className="homepage-hero-image homepage-hero-image--saree object-cover object-center"
          style={{
            objectPosition: 'center center',
            ['--hero-desktop-object-position' as string]: 'center 38%',
          }}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          draggable={false}
          onError={(event) => handleHeroImageError(event, HERO_IMAGE_FALLBACKS)}
        />
      </div>
    </section>
  )
}
