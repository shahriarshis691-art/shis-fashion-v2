import React from 'react'

const HERO_IMAGE = '/hero/main-hero-image.2.png'

/**
 * Homepage hero — Monsoon Edit poster with embedded brand typography.
 * No overlay headlines (text is in the artwork). CTA scrolls to featured collections.
 */
export const Hero: React.FC = () => {
  return (
    <section className="relative w-full overflow-hidden bg-neutral-950" aria-label="The Monsoon Edit">
      <h1 className="sr-only">SHIS Fashion — The Monsoon Edit</h1>

      <div className="relative flex h-[70dvh] w-full items-end justify-center overflow-hidden bg-neutral-950 pb-8 sm:h-[85vh] sm:pb-12 lg:h-[90vh]">
        <img
          src={HERO_IMAGE}
          alt="The Monsoon Edit - SHIS Fashion"
          width={1920}
          height={2400}
          sizes="100vw"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top sm:object-[center_15%]"
          onError={(event) => {
            event.currentTarget.src = '/og-image.svg'
          }}
          draggable={false}
        />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

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
            Explore Collection
          </a>
        </div>
      </div>
    </section>
  )
}
