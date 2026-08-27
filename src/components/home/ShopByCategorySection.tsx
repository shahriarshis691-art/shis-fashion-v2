import CategoryHeroCard from '../common/CategoryHeroCard'

export interface ShopByCategoryItem {
  key: string
  name: string
  href: string
  image: string
  imagePosition?: string
}

const HUB_ORDER = ['men', 'women', 'kids'] as const

function orderHubItems(items: ShopByCategoryItem[]) {
  const byKey = new Map(items.map((item) => [item.key.trim().toLowerCase(), item]))
  return HUB_ORDER.map((key) => byKey.get(key)).filter((item): item is ShopByCategoryItem => Boolean(item))
}

export default function ShopByCategorySection({
  items,
  title = 'SHOP BY CATEGORY',
  eyebrow = 'Featured collections',
}: {
  items: ShopByCategoryItem[]
  title?: string
  eyebrow?: string
}) {
  const hubItems = orderHubItems(items)
  if (!hubItems.length) {
    return null
  }

  return (
    <section
      id="featured-collections"
      className="relative z-10 isolate scroll-mt-20 overflow-x-hidden bg-white md:py-14"
      aria-labelledby="shop-by-category-title"
    >
      <h2 id="shop-by-category-title" className="sr-only">
        {title}
      </h2>
      <div className="border-t border-black/10 bg-white px-4 py-6 text-center md:hidden">
        <p className="text-caption uppercase tracking-[0.14em] text-black/55">{eyebrow}</p>
        <p
          className="mt-1 text-xl font-normal tracking-[0.2em] text-neutral-900 uppercase"
          style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif" }}
          aria-hidden
        >
          {title}
        </p>
      </div>
      <div className="mx-auto hidden max-w-7xl px-6 md:block">
        <div className="mb-10 text-center">
          <p className="text-caption uppercase tracking-[0.14em] text-black/55">{eyebrow}</p>
          <p
            className="mt-1 text-2xl font-normal tracking-[0.2em] text-neutral-900 uppercase md:text-3xl"
            style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif" }}
            aria-hidden
          >
            {title}
          </p>
        </div>
      </div>

      <div className="category-snap-feed md:mx-auto md:max-w-7xl md:px-6">
        {hubItems.map((item, index) => (
          <article key={item.key} className="category-snap-card">
            <CategoryHeroCard
              name={item.name}
              href={item.href}
              image={item.image}
              cta="View Categories"
              priority={index === 0}
              variant="feed"
              imagePosition={item.imagePosition}
              sizes="(max-width: 767px) 100vw, 33vw"
            />
            {index < hubItems.length - 1 ? (
              <span
                className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex justify-center text-white/80 md:hidden"
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 animate-bounce" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
