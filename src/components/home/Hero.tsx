import React from 'react'
import ResponsiveHeroBanner from '../common/ResponsiveHeroBanner'

const HERO_IMAGE = '/hero/saree-heroimage/homepage-hero-image.jpg'
const HERO_IMAGE_FALLBACKS = ['/hero/saree-heroimage/homepage-hero-image.jpg.png']
const HERO_IMAGE_WIDTH = 1122
const HERO_IMAGE_HEIGHT = 1402

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

export const Hero: React.FC<HeroProps> = () => {
  return (
    <>
      <h1 className="sr-only">SHIS Fashion Bangladesh</h1>
      <ResponsiveHeroBanner
        src={HERO_IMAGE}
        alt="SHIS Fashion Exclusive Launch Saree — campaign banner"
        width={HERO_IMAGE_WIDTH}
        height={HERO_IMAGE_HEIGHT}
        fallbacks={HERO_IMAGE_FALLBACKS}
        background="cream"
        sectionClassName="mb-3 md:mb-0"
        ariaLabel="SHIS Fashion hero banner"
        objectPosition="center top"
      />
    </>
  )
}
