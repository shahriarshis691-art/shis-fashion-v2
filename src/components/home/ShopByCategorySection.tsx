import CategoryHeroCard from '../common/CategoryHeroCard'
import { KIDS_HOMEPAGE_COVER_BACKGROUND, KIDS_HOMEPAGE_COVER_POSITION, SAREE_HOMEPAGE_COVER_ASPECT, SAREE_HOMEPAGE_COVER_BACKGROUND, SAREE_HOMEPAGE_COVER_POSITION } from '../../data/featuredCollectionCovers'

export interface ShopByCategoryItem {
  key: string
  name: string
  href: string
  image: string
  imagePosition?: string
}

const HUB_ORDER = ['men', 'women', 'kids', 'saree'] as const

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

      <div className="relative z-10 isolate flex flex-col gap-8 px-4 pb-8 md:mx-auto md:grid md:max-w-7xl md:grid-cols-2 md:items-start md:gap-x-4 md:gap-y-8 md:px-6 md:pb-0 lg:grid-cols-4">
        {hubItems.map((item, index) => {
          const isSareeCard = item.key.trim().toLowerCase() === 'saree'
          const isKidsCard = item.key.trim().toLowerCase() === 'kids'

          return (
            <article key={item.key} className="relative z-10 isolate w-full min-w-0">
              <CategoryHeroCard
                name={item.name}
                href={item.href}
                image={item.image}
                priority={index === 0}
                variant="feed"
                imagePosition={isSareeCard ? (item.imagePosition ?? SAREE_HOMEPAGE_COVER_POSITION) : isKidsCard ? (item.imagePosition ?? KIDS_HOMEPAGE_COVER_POSITION) : item.imagePosition}
                imageFit="cover"
                imageWidth={isSareeCard ? SAREE_HOMEPAGE_COVER_ASPECT.width : undefined}
                imageHeight={isSareeCard ? SAREE_HOMEPAGE_COVER_ASPECT.height : undefined}
                frameBackground={isSareeCard ? SAREE_HOMEPAGE_COVER_BACKGROUND : isKidsCard ? KIDS_HOMEPAGE_COVER_BACKGROUND : undefined}
                imgClassName={isSareeCard ? 'object-top' : isKidsCard ? 'object-center' : undefined}
                imageHoverScale={!isSareeCard}
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
              />
            </article>
          )
        })}
      </div>
    </section>
  )
}
