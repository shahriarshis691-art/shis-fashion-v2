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
          <div className="relative aspect-[4/5] w-full">
            <img
              src={WEDDING_HOMEPAGE_COVER}
              alt="THE DREAM STORY — SHIS Fashion wedding collection"
              width={WEDDING_HOMEPAGE_COVER_WIDTH}
              height={WEDDING_HOMEPAGE_COVER_HEIGHT}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </Link>
    </section>
  )
}
