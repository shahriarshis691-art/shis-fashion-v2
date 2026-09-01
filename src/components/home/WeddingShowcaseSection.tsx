import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useParallax } from '../../hooks/useParallax'
import { useScrollReveal } from '../../hooks/useScrollReveal'

const WEDDING_CARD_IMAGE = '/hero/hero-images/wedding.image.png'
const WEDDING_CARD_IMAGE_WIDTH = 1472
const WEDDING_CARD_IMAGE_HEIGHT = 2616
const WEDDING_CARD_BACKGROUND = '#0b0b0b'

export default function WeddingShowcaseSection() {
  const imageRef = useRef<HTMLImageElement>(null)
  useParallax(imageRef, 0.04)

  const titleRef = useScrollReveal<HTMLHeadingElement>({ threshold: 0.3 })
  const cardRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 })

  return (
    <section
      id="wedding-collection"
      className="relative z-10 isolate bg-white px-4 pb-8 md:mx-auto md:max-w-7xl md:px-6 md:pb-14"
      aria-labelledby="wedding-collection-title"
    >
      <h2
        ref={titleRef}
        id="wedding-collection-title"
        className="scroll-reveal-typography mb-3 text-center font-serif text-sm tracking-widest text-neutral-900 uppercase md:text-base"
        style={{ fontFamily: 'var(--font-display)', '--scroll-reveal-delay': '0ms' } as React.CSSProperties}
      >
        Wedding
      </h2>

      <div className="relative mx-auto w-full max-w-5xl">
        <div
          ref={cardRef}
          className="scroll-reveal relative w-full min-h-[75vh] aspect-[9/16] overflow-hidden rounded-none bg-black md:min-h-[85vh]"
          style={{ backgroundColor: WEDDING_CARD_BACKGROUND, '--scroll-reveal-delay': '80ms' } as React.CSSProperties}
        >
          <img
            ref={imageRef}
            src={WEDDING_CARD_IMAGE}
            alt="SHIS Fashion wedding collection — bridal fireworks under the floral arch"
            width={WEDDING_CARD_IMAGE_WIDTH}
            height={WEDDING_CARD_IMAGE_HEIGHT}
            className="absolute inset-0 h-full w-full object-contain object-center ambient-pan-y"
            loading="lazy"
            fetchPriority="low"
            decoding="async"
          />
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/20 px-4 text-center">
            <h3
              className="mb-6 font-serif text-3xl uppercase drop-shadow-md sm:text-4xl md:text-5xl lg:text-6xl"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 400,
                letterSpacing: '0.25em',
                color: '#ffffff',
              }}
            >
              Wedding Plan
            </h3>
            <Link
              to="/wedding"
              className="inline-flex items-center justify-center border border-white/80 bg-white/10 px-8 py-3 text-xs text-white uppercase backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-black md:text-sm"
              style={{ letterSpacing: '0.25em' }}
            >
              Explore &gt;
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
