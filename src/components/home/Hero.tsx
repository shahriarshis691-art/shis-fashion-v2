import React from 'react'

const HERO_IMAGE = '/hero/main-hero-image2.jpg'
const HERO_IMAGE_FALLBACK = '/hero/main-hero-image2.jpg.jpeg'
const DEFAULT_OG_IMAGE = '/og-image.svg'

export interface HeroContentInput {
  heroTitle?: string
  heroCta?: string
  heroPrimaryLink?: string
  heroImage?: string
  heroImageTitle?: string
  heroImageDescription?: string
}

interface HeroProps {
  /** Reserved for layout compatibility; homepage hero uses a fixed campaign banner. */
  content?: HeroContentInput
}

export const Hero: React.FC<HeroProps> = () => {
  return (
    <section
      className="relative z-0 isolate mb-3 w-full max-w-[100vw] overflow-hidden bg-neutral-950 md:mb-0"
      aria-label="SHIS Fashion hero banner"
    >
      <h1 className="sr-only">SHIS Fashion Bangladesh</h1>

      <div className="homepage-hero-frame relative w-full overflow-hidden bg-neutral-950">
        <img
          src={HERO_IMAGE}
          alt="The Monsoon — SHIS Fashion saree collection"
          width={900}
          height={1600}
          sizes="100vw"
          className="homepage-hero-image"
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          draggable={false}
          onError={(event) => {
            const image = event.currentTarget
            if (image.dataset.fallback === 'done') {
              return
            }
            if (image.dataset.fallback !== 'jpeg') {
              image.dataset.fallback = 'jpeg'
              image.src = HERO_IMAGE_FALLBACK
              return
            }
            image.dataset.fallback = 'done'
            image.src = DEFAULT_OG_IMAGE
          }}
        />
      </div>
    </section>
  )
}
