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
    <Reveal delayMs={index * 50}>
      <Link
        to={href}
        className="group luxury-tap flex flex-col"
        aria-label={`${name} collection`}
      >
        <div className="relative w-full aspect-square overflow-hidden rounded-md bg-neutral-100">
          <LuxuryImage
            src={imageSrc}
            alt={`${name} category`}
            width={960}
            height={1200}
            sizes="(max-width: 767px) 46vw, (max-width: 1279px) 25vw, 16vw"
            widths={[320, 480, 768, 960]}
            className="h-full w-full"
            aspectClassName="aspect-square"
            imgClassName="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        <h3 className="mt-2.5 text-center text-sm sm:text-base font-semibold text-neutral-900 tracking-tight">{name}</h3>
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

        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-4">
          {categoryItems.map((item, index) => (
            <CategoryCard key={item.key} name={item.name} href={item.href} image={item.image} index={index} />
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
