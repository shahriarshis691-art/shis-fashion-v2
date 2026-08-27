import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

interface HeroSlide {
  id: number
  image: string
  /** Optional WebP/AVIF source for <picture> (preferred over JPEG). */
  imageWebp?: string
  title: string
  btnText: string
  link: string
  alt: string
  width: number
  height: number
  priority?: boolean
}

export interface HeroContentInput {
  heroTitle?: string
  heroCta?: string
  heroPrimaryLink?: string
  heroImage?: string
  heroImageTitle?: string
  heroImageDescription?: string
}

/**
 * Fixed campaign carousel — always used on the homepage so autoplay and
 * collection banners stay reliable. CMS heroImage is used elsewhere (welcome popup / SEO).
 */
const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    image: '/hero/kids/hero-soft-cotton-saree.jpg',
    imageWebp: '/hero/kids/hero-soft-cotton-saree.jpg.webp',
    title: 'THE MONSOON',
    btnText: 'SHOP SAREE',
    link: '/sarees',
    alt: 'The Monsoon Saree Collection',
    width: 900,
    height: 1600,
    priority: true,
  },
  {
    id: 2,
    image: '/collections/mens-baggy/mens-baggy1.jpg',
    title: "Men's Baggy Denim",
    btnText: 'Shop Denim',
    link: '/men?sub=denim',
    alt: "Men's Baggy Denim Collection",
    width: 1122,
    height: 1402,
  },
  {
    id: 3,
    image: '/collections/featured-denim-collection.jpg',
    title: "Women's Baggy",
    btnText: "Shop Women's Baggy",
    link: '/women/womens-baggy',
    alt: "Women's Baggy Jeans Collection",
    width: 1122,
    height: 1402,
  },
]

const AUTO_ROTATE_MS = 4500
const SWIPE_THRESHOLD_PX = 48
const DEFAULT_OG_IMAGE = '/og-image.svg'

interface HeroProps {
  /** Reserved for layout compatibility; campaign slides are fixed for storefront reliability. */
  content?: HeroContentInput
}

export const Hero: React.FC<HeroProps> = () => {
  const heroSlides = HERO_SLIDES
  const slideCount = heroSlides.length
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hoverPaused, setHoverPaused] = useState(false)
  const [touchPaused, setTouchPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const safeIndex = currentIndex % slideCount
  const activeSlide = heroSlides[safeIndex]!

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slideCount)
  }, [slideCount])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slideCount) % slideCount)
  }, [slideCount])

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(((index % slideCount) + slideCount) % slideCount)
  }, [slideCount])

  // Autoplay: keeps running after arrow/dot taps (disableOnInteraction: false).
  // Only pauses while hovering (desktop) or during an active touch swipe.
  useEffect(() => {
    if (hoverPaused || touchPaused || prefersReducedMotion || slideCount < 2) {
      return
    }

    const interval = window.setInterval(nextSlide, AUTO_ROTATE_MS)
    return () => window.clearInterval(interval)
  }, [currentIndex, hoverPaused, nextSlide, prefersReducedMotion, slideCount, touchPaused])

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
    setTouchPaused(true)
  }

  const onTouchEnd = (event: React.TouchEvent) => {
    const startX = touchStartX.current
    touchStartX.current = null
    setTouchPaused(false)

    if (startX === null || slideCount < 2) {
      return
    }

    const endX = event.changedTouches[0]?.clientX ?? startX
    const delta = endX - startX

    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) {
      return
    }

    if (delta < 0) {
      nextSlide()
    } else {
      prevSlide()
    }
  }

  const onTouchCancel = () => {
    touchStartX.current = null
    setTouchPaused(false)
  }

  return (
    <section
      className="relative z-0 isolate mb-3 w-full max-w-[100vw] select-none overflow-hidden bg-neutral-950 md:mb-0"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      aria-roledescription="carousel"
      aria-label="Campaign hero banners"
    >
      <h1 className="sr-only">SHIS Fashion Bangladesh</h1>

      <div
        className="hero-slider-frame relative w-full overflow-hidden bg-neutral-950 aspect-[4/5] md:aspect-auto md:h-[85vh] lg:h-[90vh]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
      >
        {heroSlides.map((slide, index) => {
          const isActive = index === safeIndex
          const isLcpCandidate = Boolean(slide.priority) || index === 0

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 z-0 h-full w-full transition-all duration-700 ease-in-out ${
                isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
              aria-hidden={!isActive}
            >
              <picture>
                {slide.imageWebp ? (
                  <source srcSet={slide.imageWebp} type="image/webp" sizes="100vw" />
                ) : null}
                <img
                  src={slide.image}
                  alt={slide.alt}
                  width={slide.width}
                  height={slide.height}
                  sizes="100vw"
                  className="hero-slide-image absolute inset-0 h-full w-full object-cover object-[center_top]"
                  loading={isLcpCandidate ? 'eager' : 'lazy'}
                  fetchPriority={isLcpCandidate ? 'high' : 'low'}
                  decoding={isLcpCandidate ? 'sync' : 'async'}
                  draggable={false}
                  onError={(event) => {
                    const src = event.currentTarget.src
                    if (src.includes('mens-baggy1.jpg')) {
                      event.currentTarget.src = '/collections/featured-denim-collection.jpg'
                      return
                    }
                    if (src.includes('featured-denim-collection.jpg')) {
                      event.currentTarget.src = '/hero/denim-homepage.jpg'
                      return
                    }
                    event.currentTarget.src = DEFAULT_OG_IMAGE
                  }}
                />
              </picture>
            </div>
          )
        })}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-32 bg-gradient-to-t from-black/60 via-black/15 to-transparent md:h-36" />

        <div className="hero-slide-cta absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
          <Link
            to={activeSlide.link}
            className="btn-glass-cta"
            aria-label={`${activeSlide.btnText}: ${activeSlide.title}`}
          >
            {activeSlide.btnText}
          </Link>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            prevSlide()
          }}
          className="absolute top-1/2 left-4 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/60 text-neutral-900 backdrop-blur-md transition-all hover:bg-white md:flex"
          aria-label="Previous slide"
        >
          &#8592;
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            nextSlide()
          }}
          className="absolute top-1/2 right-4 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/60 text-neutral-900 backdrop-blur-md transition-all hover:bg-white md:flex"
          aria-label="Next slide"
        >
          &#8594;
        </button>

        <div className="absolute right-3 bottom-3 z-30 flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-md md:right-8 md:bottom-4">
          {heroSlides.map((slide, dotIdx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => goToSlide(dotIdx)}
              aria-current={dotIdx === safeIndex ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                dotIdx === safeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${dotIdx + 1}: ${slide.title}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
