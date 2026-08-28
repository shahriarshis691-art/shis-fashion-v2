import CategoryHeroCard from '../common/CategoryHeroCard'

export interface ShopByCategoryItem {
  key: string
  name: string
  href: string
  image: string
  imagePosition?: string
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
  if (!items.length) {
    return null
  }

  return (
    <section
      id="featured-collections"
      className="relative z-10 isolate scroll-mt-20 bg-white px-4 py-10 md:px-8 md:py-16"
      aria-labelledby="shop-by-category-title"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <p className="text-[10px] font-medium tracking-[0.22em] text-[var(--color-gold)] uppercase">{eyebrow}</p>
          <h2
            id="shop-by-category-title"
            className="mt-2 text-3xl text-[#111111] md:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4">
          {items.map((item, index) => (
            <article key={item.key} className="relative aspect-[3/4] overflow-hidden">
              <CategoryHeroCard
                name={item.name}
                href={item.href}
                image={item.image}
                cta="Shop"
                priority={index < 2}
                variant="portrait"
                imagePosition={item.imagePosition}
                sizes="(max-width: 767px) 50vw, 25vw"
                showOverlay
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
