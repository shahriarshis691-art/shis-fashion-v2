import React from 'react'
import HomeHeroCarousel from './HomeHeroCarousel'

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
      <HomeHeroCarousel />
    </>
  )
}
