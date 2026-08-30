import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  WEDDING_LISTING_HERO,
  WEDDING_LISTING_HERO_BACKGROUND,
  WEDDING_LISTING_HERO_HEIGHT,
  WEDDING_LISTING_HERO_WIDTH,
  weddingProductCover,
  weddingProducts,
} from '../data/weddingCollection'
import { formatBDT } from '../utils/currency'
import { applySeoMetadata } from '../utils/seo'

export default function WeddingCollectionPage() {
  useEffect(() => {
    applySeoMetadata('/wedding', {
      title: 'Wedding Collection | SHIS Fashion Bangladesh',
      description:
        'THE DREAM STORY — SHIS Fashion wedding collection. Timeless bridal lehenga, Banarasi silk, and groom sherwani elegance.',
      canonicalPath: '/wedding',
      keywords: 'wedding collection Bangladesh, bridal saree, groom panjabi, SHIS wedding, THE DREAM STORY',
    })
  }, [])

  return (
    <section className="bg-white pt-0 pb-24">
      <section
        className="relative z-0 isolate flex min-h-screen w-full items-center justify-center overflow-hidden md:h-screen"
        style={{ backgroundColor: WEDDING_LISTING_HERO_BACKGROUND }}
        aria-label="Wedding collection banner"
      >
        <img
          src={WEDDING_LISTING_HERO}
          alt="THE DREAM STORY — SHIS Fashion wedding collection, timeless bridal and groom elegance"
          width={WEDDING_LISTING_HERO_WIDTH}
          height={WEDDING_LISTING_HERO_HEIGHT}
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/65" />
        <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
          <p
            className="font-sans text-xs uppercase"
            style={{ letterSpacing: '0.3em', color: 'rgba(255,255,255,0.8)' }}
          >
            Wedding Collection
          </p>
          <h1
            className="mt-5 text-3xl uppercase md:text-5xl lg:text-6xl"
            style={{
              fontFamily: "var(--font-display, 'Cormorant Garamond', Georgia, serif)",
              fontWeight: 400,
              letterSpacing: '0.12em',
              color: '#ffffff',
            }}
          >
            The Dream Story
          </h1>
          <p className="mt-4 max-w-md text-sm tracking-[0.08em] text-white/80">
            Timeless Bridal &amp; Groom Elegance
          </p>
          <a
            href="#wedding-grid"
            className="mt-8 inline-block border border-white/80 px-8 py-3 text-xs uppercase transition-all duration-300 hover:bg-white hover:!text-black"
            style={{ letterSpacing: '0.2em', color: '#ffffff' }}
          >
            Explore Collection
          </a>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-3 pt-6 md:px-6 lg:pt-10">
        <nav aria-label="Breadcrumb" className="text-[12px] font-normal tracking-wide text-neutral-400">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-neutral-700">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-neutral-300">
              /
            </li>
            <li className="text-neutral-500">Wedding</li>
          </ol>
        </nav>

        <header className="mt-8 sm:mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">Wedding Collection</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            An exclusive bridal and groom lookbook — Banarasi silk, lehenga couture, and embroidered sherwani edits.
          </p>
        </header>

        <div
          id="wedding-grid"
          className="mt-8 grid grid-cols-2 gap-x-[2px] gap-y-6 px-1 md:grid-cols-3 md:gap-x-4 md:gap-y-10 md:px-0 lg:grid-cols-4"
        >
          {weddingProducts.map((item) => {
            const coverImage = weddingProductCover(item)
            const formattedPrice = item.price > 0 ? formatBDT(item.price) : null

            return (
              <article key={item.id} className="group min-w-0">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#f4efe8]">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={`${item.title} — SHIS Fashion wedding collection`}
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                      onError={(event) => {
                        event.currentTarget.style.visibility = 'hidden'
                      }}
                    />
                  ) : null}
                  {item.tag ? (
                    <span className="absolute top-3 left-3 bg-white/90 px-2.5 py-1 text-[9px] font-medium tracking-[0.18em] text-neutral-800 uppercase">
                      {item.tag}
                    </span>
                  ) : null}
                  {item.inStock === false ? (
                    <span className="absolute right-3 bottom-3 bg-black/80 px-2.5 py-1 text-[9px] font-medium tracking-[0.18em] text-white uppercase">
                      Sold out
                    </span>
                  ) : null}
                </div>
                <div className="px-1 pt-3 text-center">
                  <h3
                    className="text-[11px] font-medium tracking-[0.16em] text-neutral-900 uppercase md:text-xs"
                    style={{ fontFamily: "var(--font-display, 'Cormorant Garamond', Georgia, serif)" }}
                  >
                    {item.title}
                  </h3>
                  {formattedPrice ? (
                    <p className="mt-1.5 text-xs tracking-wide text-neutral-500">{formattedPrice}</p>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
