import React, { useCallback, useEffect, useRef, useState } from 'react'

const AUTOPLAY_MS = 2800
const SWIPE_THRESHOLD_PX = 48
const DEFAULT_OG_IMAGE = '/og-image.svg'

type HeroSlide = {
  src: string
  fallbacks: string[]
  alt: string
  objectPosition: string
  desktopObjectPosition?: string
}

const HERO_SLIDES: HeroSlide[] = [
  {
    src: '/homepage/40e0b639-d95a-42d5-aa38-f3d42a8e5589.png',
    fallbacks: ['/homepage/40e0b639-d95a-42d5-aa38-f3d42a8e5589.jpg'],
    alt: 'SHIS Fashion Exclusive Launch Saree — campaign banner',
    objectPosition: 'center center',
    desktopObjectPosition: 'center 62%',
  },
  {
    src: '/hero/panjabi.jpg',
    fallbacks: ['/hero/panjabi.jpg.jpg'],
    alt: 'SHIS Fashion Panjabi collection — refined menswear editorial',
    objectPosition: 'center 40%',
  },
  {
    src: '/hero/denim-homepage.jpg',
    fallbacks: ['/hero/denim-homepage.jpg.png'],
    alt: 'SHIS Fashion denim collection — premium baggy denim',
    objectPosition: 'center center',
  },
]

export interface HeroContentInput {
  heroTitle?: string
  heroCta?: string
  heroPrimaryLink?: string
  heroImage?: string
  heroImageTitle?: string
  heroImageDescription?: string
}

interface HeroProps {
  /** Reserved for layout compatibility; homepage hero uses a fixed campaign carousel. */
  content?: HeroContentInput
}

function handleSlideImageError(event: React.SyntheticEvent<HTMLImageElement>, fallbacks: string[]) {
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
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const goToSlide = useCallback((index: number) => {
    const total = HERO_SLIDES.length
    setActiveIndex(((index % total) + total) % total)
  }, [])

  useEffect(() => {
    if (isPaused || HERO_SLIDES.length <= 1) {
      return
    }

    timerRef.current = setTimeout(() => {
      setActiveIndex((current) => (current + 1) % HERO_SLIDES.length)
    }, AUTOPLAY_MS)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [activeIndex, isPaused])

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current == null) {
      return
    }

    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
    const delta = endX - touchStartX.current
    touchStartX.current = null

    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) {
      return
    }

    if (delta < 0) {
      goToSlide(activeIndex + 1)
      return
    }

    goToSlide(activeIndex - 1)
  }

  return (
    <section
      className="relative z-0 isolate mb-3 w-full max-w-[100vw] overflow-x-hidden bg-neutral-950 md:mb-0"
      aria-label="SHIS Fashion hero banner"
      aria-roledescription="carousel"
    >
      <h1 className="sr-only">SHIS Fashion Bangladesh</h1>

      <div
        className="homepage-hero-frame relative h-[75vh] min-h-[70vh] w-full touch-pan-y overflow-hidden bg-neutral-950 md:h-[75vh] md:min-h-[75vh] md:w-full"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === activeIndex

          return (
            <div
              key={slide.src}
              className={`homepage-hero-slide transition-all duration-700 ease-in-out ${isActive ? 'is-active' : ''}`}
              aria-hidden={!isActive}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                width={900}
                height={1600}
                sizes="100vw"
                className={`homepage-hero-image object-cover object-center ${slide.desktopObjectPosition ? 'homepage-hero-image--saree' : ''}`}
                style={{
                  objectPosition: slide.objectPosition,
                  ...(slide.desktopObjectPosition
                    ? { ['--hero-desktop-object-position' as string]: slide.desktopObjectPosition }
                    : {}),
                }}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : undefined}
                decoding={index === 0 ? 'sync' : 'async'}
                draggable={false}
                onError={(event) => handleSlideImageError(event, slide.fallbacks)}
              />
            </div>
          )
        })}

        {HERO_SLIDES.length > 1 ? (
          <div
            className="homepage-hero-dots"
            role="tablist"
            aria-label="Hero slide navigation"
          >
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Go to slide ${index + 1}: ${slide.alt}`}
                className={`homepage-hero-dot ${index === activeIndex ? 'is-active' : ''}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
