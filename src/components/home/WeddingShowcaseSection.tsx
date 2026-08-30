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
        className="group relative block w-full"
        aria-label="Explore the Wedding collection"
      >
        <div
          className="relative aspect-[4/5] w-full overflow-hidden"
          style={{ backgroundColor: WEDDING_CARD_BACKGROUND }}
        >
          <img
            src={WEDDING_CARD_IMAGE}
            alt="SHIS Fashion wedding collection — bridal fireworks under the floral arch"
            width={WEDDING_CARD_IMAGE_WIDTH}
            height={WEDDING_CARD_IMAGE_HEIGHT}
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-6 pb-8 text-center md:pb-12">
            <p
              className="text-2xl tracking-[0.18em] text-white uppercase md:text-4xl"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 400 }}
            >
              The Dream Story
            </p>
            <p className="mt-2 text-[11px] font-medium tracking-[0.28em] text-white/85 uppercase">
              Wedding Collection
            </p>
            <p className="mt-3 text-xs tracking-[0.08em] text-white/80 md:text-sm">
              Timeless Bridal &amp; Groom Elegance
            </p>
            <span className="mt-6 inline-block border border-white/85 px-8 py-3 text-[11px] tracking-[0.22em] text-white uppercase transition-colors duration-300 group-hover:bg-white group-hover:text-black">
              Explore Collection
            </span>
          </div>
        </div>
      </Link>
    </section>
  )
}
