import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

interface HeroSlide {
  id: string
  image: string
  link: string
  alt: string
  objectPosition?: string
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'effortless-elegance-tee',
    image: '/hero/effortless-elegance-tee.png',
    link: '/shop?category=women&sub=oversized-tee',
    alt: 'Effortless elegance oversized tee campaign',
    objectPosition: 'center top',
  },
  {
    id: 'casual-shirt',
    image: '/hero/hero-premium-casual-shirt.webp',
    link: '/shop?category=men&sub=casual-shirt',
    alt: 'Premium casual shirt campaign',
    objectPosition: 'center center',
  },
  {
    id: 'regular-fit-denim',
    image: '/hero/hero-regular-fit-denim.webp',
    link: '/shop?category=men&sub=denim-pants',
    alt: 'Signature denim pants campaign',
    objectPosition: 'center center',
  },
  {
    id: 'soft-cotton-saree',
    image: '/hero/hero-soft-cotton-saree.webp',
    link: '/shop?category=women&sub=saree',
    alt: 'Soft cotton saree campaign',
    objectPosition: 'center top',
  },
]

const AUTO_ROTATE_MS = 3500
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

      <div
        className="relative w-full h-[85vh] min-h-[520px] max-h-screen overflow-hidden bg-[#ebe6df]"
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
              <Link
                className="block relative w-full h-full group cursor-pointer"
                to={slide.link}
                aria-label={slide.alt}
              >
                <img
                  src={slide.image}
                  alt={slide.alt}
                  width={1600}
                  height={2000}
                  className="w-full h-full object-cover object-center transition-transform duration-[4000ms] ease-out group-hover:scale-105"
                  style={slide.objectPosition ? { objectPosition: slide.objectPosition } : undefined}
                  loading={index === 0 ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                  draggable={false}
                />
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
    </section>
  )
}
