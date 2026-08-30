import { Link } from 'react-router-dom'
import {
  WEDDING_HOMEPAGE_COVER,
  WEDDING_HOMEPAGE_COVER_BACKGROUND,
  WEDDING_HOMEPAGE_COVER_HEIGHT,
  WEDDING_HOMEPAGE_COVER_WIDTH,
} from '../../data/featuredCollectionCovers'

export default function WeddingShowcaseSection() {
  return (
    <section
      id="wedding-collection"
      className="relative z-10 isolate bg-white px-4 pb-8 md:mx-auto md:max-w-7xl md:px-6 md:pb-14"
      aria-labelledby="wedding-collection-title"
    >
      <Link
        to="/wedding"
        className="group relative block w-full"
        aria-label="Explore the Wedding collection"
      >
        <h2
          id="wedding-collection-title"
          className="mb-3 text-center font-serif text-sm tracking-widest text-neutral-900 uppercase md:text-base"
          style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif" }}
        >
          Wedding
        </h2>
        <div
          className="relative w-full overflow-hidden"
          style={{ backgroundColor: WEDDING_HOMEPAGE_COVER_BACKGROUND }}
        >
          <div className="relative aspect-[4/5] w-full sm:aspect-[16/9]">
            <img
              src={WEDDING_HOMEPAGE_COVER}
              alt="SHIS Fashion wedding collection — timeless bridal and groom elegance"
              width={WEDDING_HOMEPAGE_COVER_WIDTH}
              height={WEDDING_HOMEPAGE_COVER_HEIGHT}
              className="h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-black/10" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white">
              <div className="rounded-sm bg-black/20 p-6 backdrop-blur-[2px]">
                <p className="text-[11px] font-medium tracking-[0.22em] text-white/80 uppercase">
                  Wedding Collection
                </p>
                <p
                  className="mt-2 text-3xl font-normal tracking-[0.2em] text-white uppercase drop-shadow-md sm:text-4xl md:text-5xl"
                  style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif" }}
                >
                  Wedding
                </p>
                <p className="mt-3 max-w-lg text-sm tracking-[0.06em] text-white/90 sm:text-base">
                  Timeless Bridal & Groom Elegance
                </p>
                <span className="mt-6 inline-flex border border-white/85 px-5 py-2.5 text-[11px] font-medium tracking-[0.18em] text-white uppercase transition-colors duration-300 group-hover:bg-white group-hover:text-neutral-900">
                  Explore Collection
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </section>
  )
}
