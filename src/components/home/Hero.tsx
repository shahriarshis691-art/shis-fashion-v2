import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const AUTOPLAY_MS = 5500
const SWIPE_THRESHOLD_PX = 48
const DEFAULT_OG_IMAGE = '/og-image.svg'

type HeroSlide = {
  src: string
  fallbacks: string[]
  alt: string
  objectPosition: string
}

const HERO_SLIDES: HeroSlide[] = [
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
  heroSecondaryCta?: string
  heroSecondaryLink?: string
  heroImage?: string
  heroImageTitle?: string
  heroImageDescription?: string
}

interface HeroProps {
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

export const Hero: React.FC<HeroProps> = ({ content }) => {
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
        className="homepage-hero-frame relative w-full touch-pan-y overflow-hidden bg-neutral-950"
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
              className={`homepage-hero-slide ${isActive ? 'is-active' : ''}`}
              aria-hidden={!isActive}
            >
              <img
                src={slide.src}
                alt={slide.alt}
                width={900}
                height={1600}
                sizes="100vw"
                className="homepage-hero-image"
                style={{ objectPosition: slide.objectPosition }}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : undefined}
                decoding={index === 0 ? 'sync' : 'async'}
                draggable={false}
                onError={(event) => handleSlideImageError(event, slide.fallbacks)}
              />
            </div>
          )
        })}

        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center px-5 pb-16 text-center md:pb-20">
          {content?.heroTitle ? (
            <p
              className="max-w-2xl text-3xl leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] md:text-5xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {content.heroTitle}
            </p>
          ) : null}
          <div className="pointer-events-auto mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={content?.heroPrimaryLink || '/shop'}
              className="inline-flex min-h-11 items-center border border-white bg-white px-6 text-[11px] font-semibold tracking-[0.18em] text-[#111111] uppercase"
            >
              {content?.heroCta || 'Shop now'}
            </Link>
            {content?.heroSecondaryCta ? (
              <Link
                to={content.heroSecondaryLink || '/shop/new-arrivals'}
                className="inline-flex min-h-11 items-center border border-white/80 bg-transparent px-6 text-[11px] font-semibold tracking-[0.18em] text-white uppercase"
              >
                {content.heroSecondaryCta}
              </Link>
            ) : null}
          </div>
        </div>

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
