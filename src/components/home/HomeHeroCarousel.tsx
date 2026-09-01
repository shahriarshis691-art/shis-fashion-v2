import { useCallback, useRef, useState, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import ResponsiveHeroBanner, { type HeroBackgroundTone } from '../common/ResponsiveHeroBanner'

const HERO_SWIPE_THRESHOLD_PX = 40

const HOME_HERO_SLIDES = [
  {
    id: 'saree-launch',
    src: '/hero/saree-heroimage/homepage-hero-image.png',
    alt: 'SHIS Fashion Exclusive Launch Saree — campaign banner',
    width: 2244,
    height: 2804,
    background: 'cream' as HeroBackgroundTone,
    objectFit: 'contain' as const,
    objectPosition: 'center top',
    mobileAspectRatio: '4/5',
    ariaLabel: 'SHIS Fashion hero banner',
  },
  {
    id: 'heritage-edit',
    src: '/hero/hero-images/hero-image2.png',
    alt: 'SHIS Fashion heritage edit — refined panjabi and saree styling',
    width: 1122,
    height: 1402,
    background: 'cream' as HeroBackgroundTone,
    objectFit: 'cover' as const,
    objectPosition: 'center center',
    mobileAspectRatio: '4/5',
    href: '/men',
    ariaLabel: 'Shop the SHIS Fashion men collection',
  },
] as const

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      {direction === 'left' ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
      )}
    </svg>
  )
}

export default function HomeHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const pointerStartX = useRef<number | null>(null)
  const pointerDeltaX = useRef(0)
  const didSwipe = useRef(false)
  const slideCount = HOME_HERO_SLIDES.length

  const goToSlide = useCallback((index: number) => {
    setActiveIndex((index + slideCount) % slideCount)
  }, [slideCount])

  const goNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slideCount)
  }, [slideCount])

  const goPrevious = useCallback(() => {
    setActiveIndex((current) => (current - 1 + slideCount) % slideCount)
  }, [slideCount])

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    const target = event.target as HTMLElement | null
    if (target?.closest('button')) {
      return
    }

    pointerStartX.current = event.clientX
    pointerDeltaX.current = 0
    didSwipe.current = false
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (pointerStartX.current == null) {
      return
    }

    pointerDeltaX.current = event.clientX - pointerStartX.current
  }

  const onPointerUp = () => {
    const delta = pointerDeltaX.current
    pointerStartX.current = null
    pointerDeltaX.current = 0

    if (Math.abs(delta) < HERO_SWIPE_THRESHOLD_PX) {
      return
    }

    didSwipe.current = true
    if (delta < 0) {
      goNext()
      return
    }

    goPrevious()
  }

  return (
    <section
      className="relative z-0 isolate mb-3 w-full max-w-[100vw] overflow-x-hidden md:mb-0"
      style={{ backgroundColor: '#f6f2ec' }}
      aria-roledescription="carousel"
      aria-label="SHIS Fashion homepage hero carousel"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={(event) => {
        if (!didSwipe.current) {
          return
        }

        event.preventDefault()
        event.stopPropagation()
        didSwipe.current = false
      }}
    >
      <div className="hero-slider-frame relative w-full overflow-hidden max-md:aspect-[4/5] md:aspect-[4/5]">
        {HOME_HERO_SLIDES.map((slide, index) => {
          const isActive = index === activeIndex
          const frame = (
              <ResponsiveHeroBanner
                src={slide.src}
                alt={slide.alt}
                width={slide.width}
                height={slide.height}
                fallbacks={'fallbacks' in slide ? [...(slide.fallbacks as string[])] : undefined}
                background={slide.background}
                priority={index === 0}
                embed
                objectFit={slide.objectFit}
                objectPosition={slide.objectPosition}
                mobileAspectRatio={slide.mobileAspectRatio}
                ariaLabel={slide.ariaLabel}
                className={[
                  'ambient-zoom',
                  slide.objectFit === 'cover' ? 'md:h-full md:object-cover' : undefined,
                ]
                  .filter(Boolean)
                  .join(' ')}
                parallax
              />
          )

          return (
            <div
              key={slide.id}
              className={[
                'absolute inset-0 h-full w-full overflow-hidden transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                isActive ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0',
              ].join(' ')}
              aria-hidden={!isActive}
            >
              {'href' in slide && slide.href ? (
                <Link to={slide.href} className="block h-full w-full" aria-label={slide.ariaLabel}>
                  {frame}
                </Link>
              ) : (
                frame
              )}
            </div>
          )
        })}

        {slideCount > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrevious}
              className="absolute top-1/2 left-3 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/35"
              aria-label="Previous hero slide"
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute top-1/2 right-3 z-20 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/35"
              aria-label="Next hero slide"
            >
              <ChevronIcon direction="right" />
            </button>

            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2">
              {HOME_HERO_SLIDES.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={[
                    'h-1 rounded-full transition-all duration-300',
                    index === activeIndex ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70',
                  ].join(' ')}
                  aria-label={`Go to hero slide ${index + 1}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}
