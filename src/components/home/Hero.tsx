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
  },
  {
    id: 2,
    image: '/hero/main-hero-image2.jpg',
    title: 'Monsoon Saree Collection',
    btnText: 'Shop Saree',
    link: '/saree',
    alt: 'The Monsoon Saree Collection',
  },
  {
    id: 3,
    image: '/hero/denim-homepage.jpg',
    title: 'Signature Denim Series',
    btnText: 'Shop Denim',
    link: '/men',
    alt: 'Premium Denim Collection',
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

      {/* Mobile: aspect-ratio (no fixed vh crop). Desktop: tall viewport cover. */}
      <div
        className="relative w-full overflow-hidden bg-neutral-950 aspect-[4/5] sm:aspect-auto sm:h-[85vh] lg:h-[90vh]"
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
              className={`absolute inset-0 h-full w-full transition-opacity duration-700 ease-in-out ${
                isActive ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'
              }`}
              aria-hidden={!isActive}
            >
              {shouldLoad ? (
                <img
                  src={slide.image}
                  alt={slide.alt}
                  width={1200}
                  height={1500}
                  sizes="100vw"
                  className="absolute inset-0 h-full w-full object-contain object-center sm:object-cover sm:object-[center_10%]"
                  style={{ width: '100%' }}
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
                    event.currentTarget.src = '/og-image.svg'
                  }}
                />
              ) : (
                <div className="h-full w-full bg-neutral-950" aria-hidden />
              )}

              <div className="absolute inset-x-0 bottom-6 z-20 flex flex-col items-center justify-center px-4 sm:bottom-12">
                <Link
                  to={slide.link}
                  tabIndex={isActive ? 0 : -1}
                  className="rounded-full bg-white px-8 py-3 text-xs font-semibold tracking-wider text-neutral-950 uppercase shadow-xl transition-all duration-200 hover:bg-neutral-100 active:scale-95 sm:text-sm"
                  aria-label={`${slide.btnText}: ${slide.title}`}
                >
                  {slide.btnText}
                </Link>
              </div>
            </div>
          )
        })}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-28 bg-gradient-to-t from-black/50 via-black/10 to-transparent sm:h-36 sm:from-black/70" />

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            prevSlide()
          }}
          className="absolute top-1/2 left-4 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/60 text-neutral-900 backdrop-blur-md transition-all hover:bg-white sm:flex"
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
          className="absolute top-1/2 right-4 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/60 text-neutral-900 backdrop-blur-md transition-all hover:bg-white sm:flex"
          aria-label="Next slide"
        >
          &#8594;
        </button>

        <div className="absolute right-3 bottom-3 z-30 flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5 backdrop-blur-md sm:right-8 sm:bottom-4">
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
