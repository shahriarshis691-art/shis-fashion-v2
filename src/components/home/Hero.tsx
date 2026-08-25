import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

interface HeroSlide {
  id: number
  image: string
  title: string
  btnText: string
  link: string
  alt: string
  width: number
  height: number
}

/** Strictly the 3 campaign posters in /public/hero/ (clean filenames). */
const heroSlides: HeroSlide[] = [
  {
    id: 1,
    image: '/hero/kid-homepage.jpg',
    title: 'Everyday Kids Edit',
    btnText: 'Shop Kids',
    link: '/kids',
    alt: 'Kids Everyday Wear',
    width: 1122,
    height: 1402,
  },
  {
    id: 2,
    image: '/hero/main-hero-image2.jpg',
    title: 'Monsoon Saree Collection',
    btnText: 'Shop Saree',
    link: '/saree',
    alt: 'The Monsoon Saree Collection',
    width: 900,
    height: 1600,
  },
  {
    id: 3,
    image: '/hero/denim-homepage.jpg',
    title: 'Signature Denim Series',
    btnText: 'Shop Denim',
    link: '/men',
    alt: 'Premium Denim Collection',
    width: 1122,
    height: 1402,
  },
]

const AUTO_ROTATE_MS = 4500
const SWIPE_THRESHOLD_PX = 48

export const Hero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const safeIndex = currentIndex % heroSlides.length
  const activeSlide = heroSlides[safeIndex]!

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroSlides.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  }, [])

  useEffect(() => {
    if (isPaused || prefersReducedMotion) {
      return
    }

    const interval = window.setInterval(nextSlide, AUTO_ROTATE_MS)
    return () => window.clearInterval(interval)
  }, [isPaused, nextSlide, prefersReducedMotion])

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) {
      return
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const delta = endX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) {
      return
    }

    if (delta < 0) {
      nextSlide()
    } else {
      prevSlide()
    }
  }

  return (
    <section
      className="relative w-full max-w-[100vw] select-none overflow-x-hidden bg-neutral-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false)
        }
      }}
      aria-roledescription="carousel"
      aria-label="Campaign hero banners"
    >
      <h1 className="sr-only">SHIS Fashion Bangladesh</h1>

      {/* Locked frame: mobile 4/5 — identical height for every slide (no CLS jump). */}
      <div
        className="hero-slider-frame relative w-full overflow-hidden bg-neutral-950 aspect-[4/5] md:aspect-auto md:h-[85vh] lg:h-[90vh]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {heroSlides.map((slide, index) => {
          const isActive = index === safeIndex
          const shouldLoad = index === 0 || Math.abs(index - safeIndex) <= 1
          const isLcpCandidate = index === 0

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 h-full w-full overflow-hidden transition-opacity duration-700 ease-in-out ${
                isActive ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'
              }`}
              aria-hidden={!isActive}
            >
              {shouldLoad ? (
                <img
                  src={slide.image}
                  alt={slide.alt}
                  width={slide.width}
                  height={slide.height}
                  sizes="100vw"
                  className="hero-slide-image absolute inset-0"
                  loading={isLcpCandidate ? 'eager' : 'lazy'}
                  fetchPriority={isLcpCandidate ? 'high' : 'low'}
                  decoding={isLcpCandidate ? 'sync' : 'async'}
                  draggable={false}
                  onError={(event) => {
                    const src = event.currentTarget.src
                    if (src.includes('kid-homepage.jpg')) {
                      event.currentTarget.src = '/hero/kid-homepage.jpeg'
                      return
                    }
                    if (src.includes('main-hero-image2.jpg')) {
                      event.currentTarget.src = '/hero/main-hero-image2.jpg.jpeg'
                      return
                    }
                    event.currentTarget.src = '/og-image.svg'
                  }}
                />
              ) : (
                <div className="h-full w-full bg-neutral-950" aria-hidden />
              )}
            </div>
          )
        })}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-32 bg-gradient-to-t from-black/60 via-black/15 to-transparent md:h-36" />

        {/* Shared CTA — same bottom-center spot on every slide */}
        <div className="hero-slide-cta absolute bottom-5 left-1/2 z-20 -translate-x-1/2 md:bottom-12">
          <Link
            to={activeSlide.link}
            className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-xs font-semibold tracking-wider text-neutral-950 uppercase shadow-xl transition-all duration-200 hover:bg-neutral-100 active:scale-95 md:text-sm"
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

        {/* Shared dots — fixed bottom-right, same on every slide */}
        <div className="absolute right-3 bottom-3 z-30 flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-md md:right-8 md:bottom-4">
          {heroSlides.map((slide, dotIdx) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setCurrentIndex(dotIdx)}
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
