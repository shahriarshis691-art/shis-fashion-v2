import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

interface HeroSlide {
  id: string
  image: string
  title: string
  subtitle: string
  link: string
  tag: string
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'oversize-tee',
    image: '/hero/timeless-oversize-hero.png',
    title: 'TIMELESS OVERSIZE TEE',
    subtitle: 'Premium Comfort. Everyday Confidence.',
    link: '/shop?category=women&sub=oversized-tee',
    tag: 'NEW ARRIVAL',
  },
  {
    id: 'casual-shirt',
    image: '/hero/hero-premium-casual-shirt.webp',
    title: 'PREMIUM CASUAL SHIRTS',
    subtitle: 'Refined Cotton Craftsmanship',
    link: '/shop?category=men&sub=casual-shirt',
    tag: 'MEN EDITION',
  },
  {
    id: 'regular-fit-denim',
    image: '/hero/hero-regular-fit-denim.webp',
    title: 'SIGNATURE DENIM PANTS',
    subtitle: 'Regular Fit • Everyday Durability',
    link: '/shop?category=men&sub=denim-pants',
    tag: 'ESSENTIALS',
  },
  {
    id: 'soft-cotton-saree',
    image: '/hero/hero-soft-cotton-saree.webp',
    title: 'TAT SOFT COTTON SAREE',
    subtitle: 'Heritage Elegance & Modern Draping',
    link: '/shop?category=women&sub=saree',
    tag: 'FESTIVE EDIT',
  },
]

const AUTO_ROTATE_MS = 4500
const SWIPE_THRESHOLD_PX = 48

export const Hero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const safeIndex = currentIndex % HERO_SLIDES.length

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
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
      className="relative w-full bg-[#f6f4f0] border-b border-neutral-200/70 select-none overflow-hidden"
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

      <div className="max-w-7xl mx-auto px-0 sm:px-4 md:px-6">
        <div
          className="relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[2/1] lg:aspect-[2.3/1] max-h-[760px] overflow-hidden bg-[#ebe6df]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {HERO_SLIDES.map((slide, index) => {
            const isActive = index === safeIndex

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
                  isActive
                    ? 'opacity-100 scale-100 z-10'
                    : 'opacity-0 scale-[1.02] z-0 pointer-events-none'
                }`}
                aria-hidden={!isActive}
              >
                <Link className="block relative w-full h-full group cursor-pointer" to={slide.link}>
                  <img
                    src={slide.image}
                    alt={slide.title}
                    width={1600}
                    height={2000}
                    className="w-full h-full object-cover object-[center_25%] sm:object-center transition-transform duration-[4000ms] ease-out group-hover:scale-105"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    decoding="async"
                    draggable={false}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

                  <div className="absolute bottom-6 left-4 right-4 sm:bottom-10 sm:left-10 sm:right-auto z-20 flex flex-col items-start text-left max-w-lg">
                    <span className="inline-block bg-white/20 text-white backdrop-blur-md border border-white/30 text-[9px] sm:text-[10px] font-bold tracking-[0.25em] px-2.5 py-1 uppercase mb-2">
                      {slide.tag}
                    </span>
                    <h2
                      className="text-lg sm:text-2xl md:text-3xl font-normal tracking-[0.15em] text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                      style={{ fontFamily: 'var(--font-brand)' }}
                    >
                      {slide.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/90 mt-1 line-clamp-1 font-light tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {slide.subtitle}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-2 bg-white text-black hover:bg-neutral-200 transition-colors font-semibold shadow-lg text-[10px] sm:text-xs tracking-[0.2em] uppercase px-5 py-2.5">
                      SHOP COLLECTION &rarr;
                    </span>
                  </div>
                </Link>
              </div>
            )
          })}

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              prevSlide()
            }}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 items-center justify-center rounded-full bg-white/60 hover:bg-white text-neutral-900 backdrop-blur-md transition-all"
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
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 items-center justify-center rounded-full bg-white/60 hover:bg-white text-neutral-900 backdrop-blur-md transition-all"
            aria-label="Next slide"
          >
            &#8594;
          </button>

          <div className="absolute bottom-4 right-4 sm:right-8 z-30 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full">
            {HERO_SLIDES.map((slide, dotIdx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentIndex(dotIdx)}
                aria-current={dotIdx === safeIndex ? 'true' : undefined}
                className={`transition-all duration-500 rounded-full h-1.5 ${
                  dotIdx === safeIndex
                    ? 'w-6 bg-white'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
