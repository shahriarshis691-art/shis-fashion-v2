import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  WEDDING_LISTING_HERO,
  WEDDING_LISTING_HERO_VIDEO,
  weddingProductCover,
  weddingProducts,
} from '../data/weddingCollection'
import { formatBDT } from '../utils/currency'
import { applySeoMetadata } from '../utils/seo'

export default function WeddingCollectionPage() {
  const heroVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    applySeoMetadata('/wedding', {
      title: 'Wedding Collection | SHIS Fashion Bangladesh',
      description:
        'THE DREAM STORY — SHIS Fashion wedding collection. Timeless bridal lehenga, Banarasi silk, and groom sherwani elegance.',
      canonicalPath: '/wedding',
      keywords: 'wedding collection Bangladesh, bridal saree, groom panjabi, SHIS wedding, THE DREAM STORY',
    })
  }, [])

  useEffect(() => {
    const video = heroVideoRef.current
    if (!video) {
      return
    }

    video.muted = true
    video.defaultMuted = true
    video.playsInline = true

    const playHero = () => {
      void video.play().catch(() => {})
    }

    playHero()
    video.addEventListener('canplay', playHero)
    video.addEventListener('loadeddata', playHero)

    return () => {
      video.removeEventListener('canplay', playHero)
      video.removeEventListener('loadeddata', playHero)
    }
  }, [])

  return (
    <section className="bg-white pt-0 pb-24">
      <section
        className="relative z-0 isolate flex h-screen min-h-[90vh] w-full items-center justify-center overflow-hidden bg-black md:min-h-screen"
        aria-label="Wedding collection banner"
      >
        <video
          ref={heroVideoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={WEDDING_LISTING_HERO}
          disablePictureInPicture
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
        >
          <source src={WEDDING_LISTING_HERO_VIDEO} type="video/mp4" />
        </video>
        <div className="pointer-events-none absolute inset-0 bg-black/25" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/50" />
        <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
          <p
            className="font-sans text-[11px] uppercase md:text-xs"
            style={{ letterSpacing: '0.42em', color: 'rgba(255,255,255,0.82)' }}
          >
            Wedding Couture
          </p>
          <h1
            className="mt-5 text-3xl uppercase md:text-5xl lg:text-6xl"
            style={{
              fontFamily: "var(--font-display, 'Cormorant Garamond', Georgia, serif)",
              fontWeight: 400,
              letterSpacing: '0.16em',
              color: '#ffffff',
            }}
          >
            The Wedding Edit
          </h1>
        </div>
        <a
          href="#wedding-grid"
          className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-white/80 transition-opacity duration-300 hover:text-white"
          style={{ letterSpacing: '0.32em' }}
        >
          <span className="font-sans text-[10px] uppercase">Scroll</span>
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-4 w-4 animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </a>
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
