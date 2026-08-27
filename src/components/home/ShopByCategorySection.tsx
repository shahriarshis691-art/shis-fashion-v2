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

      <div className="relative z-10 isolate flex flex-col gap-3 px-0 pb-3 md:mx-auto md:grid md:max-w-7xl md:grid-cols-3 md:gap-6 md:px-6 md:pb-0">
        {hubItems.map((item, index) => (
          <article
            key={item.key}
            className="relative z-10 isolate h-[calc(100svh-14rem)] min-h-[28rem] overflow-hidden md:h-auto md:min-h-0 md:aspect-[3/4]"
          >
            <CategoryHeroCard
              name={item.name}
              href={item.href}
              image={item.image}
              cta="View Categories"
              priority={index === 0}
              variant="feed"
              imagePosition={item.imagePosition}
              sizes="(max-width: 767px) 100vw, 33vw"
              showOverlay={item.key.trim().toLowerCase() === 'kids'}
            />
          </article>
        ))}
      </div>
    </section>
  )
}
