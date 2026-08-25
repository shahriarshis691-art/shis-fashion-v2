import React from 'react'

/** Matching file in public/hero/ (updated full-portrait Monsoon banner). */
const HERO_IMAGE = '/hero/main-hero-image.2.jpeg'

/**
 * Homepage hero — full-portrait Monsoon banner with embedded brand typography.
 * No overlay headlines. CTA scrolls to featured collections.
 */
export const Hero: React.FC = () => {
  return (
    <section className="relative w-full overflow-hidden bg-neutral-950" aria-label="The Monsoon Edit">
      <h1 className="sr-only">SHIS Fashion — The Monsoon Edit</h1>

      <div className="relative flex min-h-[75dvh] w-full items-end justify-center overflow-hidden bg-neutral-950 pb-8 sm:h-[85vh] sm:pb-12 lg:h-[90vh]">
        <img
          src={HERO_IMAGE}
          alt="The Monsoon - SHIS Fashion"
          width={1920}
          height={2400}
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top sm:object-[center_10%]"
          onError={(event) => {
            event.currentTarget.src = '/og-image.svg'
          }}
          draggable={false}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="relative z-10 px-4 text-center">
          <a
            href="#featured-collections"
            onClick={(event) => {
              event.preventDefault()
              document
                .getElementById('featured-collections')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-xs font-semibold tracking-wider text-neutral-950 uppercase shadow-2xl transition-all duration-200 hover:bg-neutral-100 active:scale-95 sm:text-sm"
          >
            Shop Collection
          </a>
        </div>
      </div>
    </section>
  )
}
