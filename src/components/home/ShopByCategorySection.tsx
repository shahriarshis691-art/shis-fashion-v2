import { Link } from 'react-router-dom'
import { homeCategoryItems } from '../../data/homeCategories'
import Container from '../ui/Container'
import Reveal from '../common/Reveal'
import LuxuryImage from '../common/LuxuryImage'

interface ShopByCategoryCardItem {
  key: string
  name: string
  href: string
  image: string
}

function CategoryCard({
  name,
  href,
  image: imageSrc,
  index,
}: {
  name: string
  href: string
  image: string
  index: number
}) {
  return (
    <Reveal delayMs={index * 50} className="snap-start">
      <Link
        to={href}
        className="group luxury-tap relative block h-full overflow-hidden bg-black shadow-[0_12px_24px_rgba(0,0,0,0.3)] transition-shadow duration-300 ease-out hover:shadow-[0_18px_34px_rgba(0,0,0,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        aria-label={`${name} collection`}
      >
        <LuxuryImage
          src={imageSrc}
          alt={`${name} category`}
          width={960}
          height={1200}
          sizes="(max-width: 767px) 46vw, (max-width: 1279px) 25vw, 16vw"
          widths={[320, 480, 768, 960]}
          className="h-full w-full"
          aspectClassName="aspect-[4/5] w-full sm:aspect-[3/4]"
          imgClassName="h-full w-full object-cover object-center"
          hover
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 text-white sm:p-6">
          <h3 className="font-sans text-[0.9rem] font-semibold uppercase leading-[1.08] tracking-[0.08em] antialiased drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] transition-colors duration-300 group-hover:text-white/95">{name}</h3>
          <span aria-hidden className="text-base leading-none">→</span>
        </div>
      </Link>
    </Reveal>
  )
}

export default function ShopByCategorySection({ items }: { items?: ShopByCategoryCardItem[] }) {
  const categoryItems = items?.length ? items : homeCategoryItems

  return (
    <section
      className="bg-transparent px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14"
      aria-labelledby="shop-by-category-title"
    >
      <Container>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Explore</p>
            <h2 id="shop-by-category-title" className="mt-2.5 font-sans text-[1.75rem] font-bold leading-[1] text-[var(--color-text)] sm:text-[2.15rem]">
              Shop by category
            </h2>
            <p className="mt-2.5 max-w-xl text-sm leading-6 text-[var(--color-muted)] sm:text-[0.98rem] sm:leading-7">
              Curated categories with a quieter, editorial shopping flow.
            </p>
          </div>
          <Link to="/shop" className="hidden shrink-0 items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text)] md:inline-flex">
            <span>View all</span>
            <span aria-hidden className="text-base leading-none">→</span>
          </Link>
        </div>

        <div className="mt-5 hidden gap-4 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {categoryItems.map((item, index) => (
            <CategoryCard key={item.key} name={item.name} href={item.href} image={item.image} index={index} />
          ))}
        </div>

        <div className="-mx-4 mt-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categoryItems.map((item, index) => (
            <div key={item.key} className="min-w-[46%] max-w-[10.2rem] flex-none">
              <CategoryCard name={item.name} href={item.href} image={item.image} index={index} />
            </div>
          ))}
        </div>

        <div className="mt-4 flex md:hidden">
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text)]">
            <span>View all</span>
            <span aria-hidden className="text-base leading-none">→</span>
          </Link>
        </div>
      </Container>
    </section>
  )
}
