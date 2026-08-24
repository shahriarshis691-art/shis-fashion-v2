import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { HomepageContent } from '../../firebase/adminService'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { normalizeCatalogImageUrl } from '../../utils/media'

// Fallback carousel when CMS hero image is not set
const LOCAL_HERO_SLIDES = [
  {
    id: 'slide-1',
    image: '/hero/hero-soft-cotton-saree.webp',
    title: 'Soft Cotton Saree',
    ctaText: 'SHOP SAREE',
    link: '/women?sub=saree',
  },
  {
    id: 'slide-2',
    image: '/hero/hero-premium-casual-shirt.webp',
    title: 'Premium Casual Shirt',
    ctaText: 'SHOP SHIRTS',
    link: '/men?sub=shirts',
  },
  {
    id: 'slide-3',
    image: '/hero/hero-regular-fit-denim.webp',
    title: 'Regular Fit Denim',
    ctaText: 'SHOP DENIM',
    link: '/shop?category=men&sub=denim',
  },
  {
    id: 'slide-4',
    image: '/hero/timeless-oversize-hero.png',
    title: 'Timeless Oversize Tee Collection',
    ctaText: 'EXPLORE COLLECTION',
    link: '/shop?category=women&sub=oversized-tee',
  },
]

type HeroSlide = {
  id: string
  image: string
  title: string
  ctaText: string
  link: string
}

type HeroContent = Pick<
  HomepageContent,
  'heroEyebrow' | 'heroTitle' | 'heroSubtitle' | 'heroCta' | 'heroPrimaryLink' | 'heroImage' | 'heroImageTitle'
>

function isUsableCmsHeroImage(url?: string) {
  const value = url?.trim() ?? ''
  if (!value) {
    return false
  }

  const normalized = value.toLowerCase()
  return !normalized.endsWith('/og-image.svg') && !normalized.endsWith('/og-image.png') && normalized !== '/og-image.svg'
}

function buildHeroSlides(content?: HeroContent | null): HeroSlide[] {
  if (!isUsableCmsHeroImage(content?.heroImage)) {
    return LOCAL_HERO_SLIDES
  }

  const image = normalizeCatalogImageUrl(content!.heroImage!, 1600, 2000) || content!.heroImage!

  return [
    {
      id: 'cms-hero',
      image,
      title: content?.heroTitle?.trim() || content?.heroImageTitle?.trim() || 'SHIS Fashion',
      ctaText: content?.heroCta?.trim() || 'Shop collection',
      link: content?.heroPrimaryLink?.trim() || '/shop',
    },
  ]
}

export const Hero: React.FC<{ content?: HeroContent | null }> = ({ content = null }) => {
  const slides = useMemo(() => buildHeroSlides(content), [content])
  const [currentIndex, setCurrentIndex] = useState(0)
  const safeIndex = slides.length ? currentIndex % slides.length : 0
  const hasMultipleSlides = slides.length > 1
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!hasMultipleSlides || prefersReducedMotion) {
      return
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length)
    }, 4000)

    return () => window.clearInterval(timer)
  }, [hasMultipleSlides, prefersReducedMotion, slides.length])

  const heading = content?.heroTitle?.trim() || 'SHIS Fashion Bangladesh'

  return (
    <section className="relative w-full bg-[#EAE5DF] overflow-hidden">
      <h1 className="sr-only">{heading}</h1>
      {content?.heroSubtitle?.trim() ? (
        <p className="sr-only">{content.heroSubtitle.trim()}</p>
      ) : null}
      <div className="w-full px-0 sm:px-4 md:px-6">
        <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[75vh] max-h-[720px] overflow-hidden">
          {slides.map((slide, index) => {
            const isActive = index === safeIndex

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <Link className="block relative w-full h-full group" to={slide.link}>
                  <img
                    src={slide.image}
                    alt={slide.title}
                    width={1600}
                    height={2000}
                    className="w-full h-full object-cover object-[center_20%] md:object-center transition-transform duration-[3000ms] ease-out md:group-hover:scale-105"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    decoding="async"
                  />

                  <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 sm:bottom-10">
                    <span className="inline-flex items-center justify-center bg-neutral-900/90 backdrop-blur-md text-white text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase px-6 py-3 shadow-xl hover:bg-black transition-all">
                      {slide.ctaText} &rarr;
                    </span>
                  </div>
                </Link>
              </div>
            )
          })}

          {hasMultipleSlides && (
            <div className="absolute bottom-3 sm:bottom-4 right-4 sm:right-8 z-30 flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
              {slides.map((slide, dotIdx) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setCurrentIndex(dotIdx)}
                  aria-current={dotIdx === safeIndex ? 'true' : undefined}
                  className={`transition-all duration-300 rounded-full ${
                    dotIdx === safeIndex
                      ? 'w-6 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
