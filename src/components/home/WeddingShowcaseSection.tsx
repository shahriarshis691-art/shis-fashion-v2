import { Link } from 'react-router-dom'

const WEDDING_CARD_IMAGE = '/hero/hero-images/wedding.image.png'
const WEDDING_CARD_IMAGE_WIDTH = 1472
const WEDDING_CARD_IMAGE_HEIGHT = 2616
const WEDDING_CARD_BACKGROUND = '#0b0b0b'

export default function WeddingShowcaseSection() {
  return (
    <section
      id="wedding-collection"
      className="relative z-10 isolate bg-white px-4 pb-8 md:mx-auto md:max-w-7xl md:px-6 md:pb-14"
      aria-labelledby="wedding-collection-title"
    >
      <h2
        id="wedding-collection-title"
        className="mb-3 text-center font-serif text-sm tracking-widest text-neutral-900 uppercase md:text-base"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Wedding
      </h2>

      <Link
        to="/wedding"
        className="group relative mx-auto block w-full max-w-5xl"
        aria-label="Explore the Wedding collection"
      >
        <div
          className="relative w-full min-h-[75vh] aspect-[9/16] overflow-hidden rounded-none bg-black md:min-h-[85vh]"
          style={{ backgroundColor: WEDDING_CARD_BACKGROUND }}
        >
          <img
            src={WEDDING_CARD_IMAGE}
            alt="SHIS Fashion wedding collection — bridal fireworks under the floral arch"
            width={WEDDING_CARD_IMAGE_WIDTH}
            height={WEDDING_CARD_IMAGE_HEIGHT}
            className="absolute inset-0 h-full w-full object-contain object-center"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-transparent" />
          <div className="absolute inset-x-0 top-[28%] z-10 flex flex-col items-center px-4 text-center md:top-[38%]">
            <div className="flex flex-col items-center bg-gradient-to-b from-black/50 via-black/25 to-transparent px-4 pb-8 pt-4">
              <p
                className="mb-1 font-serif text-2xl tracking-[0.2em] text-white uppercase drop-shadow-md md:text-4xl"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}
              >
                The Dream Story
              </p>
              <p className="mb-1 text-xs tracking-widest text-white/80 uppercase md:text-sm">
                Wedding Collection
              </p>
              <p className="mb-5 text-xs text-white/70 italic">
                Timeless Bridal &amp; Groom Elegance
              </p>
              <span className="inline-block border border-white/80 px-6 py-2.5 text-xs tracking-widest text-white uppercase backdrop-blur-sm transition-all duration-300 group-hover:bg-white group-hover:text-black">
                Explore Collection
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  )
}
