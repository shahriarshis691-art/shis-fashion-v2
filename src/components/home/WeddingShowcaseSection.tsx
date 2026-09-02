import { Link } from 'react-router-dom'

const WEDDING_CARD_IMAGE = '/hero/hero-images/wedding.image.png'

export default function WeddingShowcaseSection() {
  return (
    <section
      id="wedding-collection"
      className="relative z-10 isolate bg-white px-4 md:mx-auto md:max-w-7xl md:px-6"
      aria-labelledby="wedding-collection-title"
    >
      <div className="relative w-full aspect-[9/14] md:aspect-[16/9] min-h-[480px] md:min-h-[620px] overflow-hidden bg-stone-900 my-12">
        <img
          src={WEDDING_CARD_IMAGE}
          alt="Wedding Plan"
          className="absolute inset-0 w-full h-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 bg-black/25">
          <h2
            id="wedding-collection-title"
            className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white tracking-[0.25em] uppercase font-normal mb-6 drop-shadow-md"
          >
            WEDDING PLAN
          </h2>
          <Link
            className="inline-flex items-center justify-center border border-white/80 bg-white/10 hover:bg-white text-white hover:text-black transition-all duration-300 backdrop-blur-sm px-8 py-3 text-xs md:text-sm tracking-[0.25em] uppercase"
            to="/wedding"
          >
            EXPLORE &gt;
          </Link>
        </div>
      </div>
    </section>
  )
}
