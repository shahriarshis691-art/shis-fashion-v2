import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { homeCategoryItems } from '../../data/homeCategories'
import { normalizeCatalogImageUrl } from '../../utils/media'
import Container from '../ui/Container'

interface ShopByCategoryCardItem {
  key: string
  name: string
  href: string
  image: string
}

function CategoryCard({
  name,
  href,
  image,
  index,
}: {
  name: string
  href: string
  image: string
  index: number
}) {
  const optimizedImage = normalizeCatalogImageUrl(image, 960, 1280)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: 'easeOut' }}
      className="snap-start"
    >
      <Link
        to={href}
        className="group relative block aspect-[0.96] overflow-hidden rounded-[1.35rem] bg-[#f1ede6] shadow-[0_12px_28px_rgba(17,17,17,0.08)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(17,17,17,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2"
        aria-label={`${name} collection`}
      >
        <img
          src={optimizedImage}
          alt={`${name} category`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.03)_12%,rgba(0,0,0,0.12)_52%,rgba(0,0,0,0.56)_100%)]" />

        <div className="absolute inset-x-0 bottom-0 px-3.5 pb-3.5 pt-14 text-white">
          <h3 className="font-sans text-[0.96rem] font-semibold uppercase leading-[1.08] tracking-[0.08em] antialiased drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] transition-colors duration-300 group-hover:text-white/95">{name}</h3>
          <div className="mt-2 flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-white/85 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
            <span>Shop now</span>
            <span aria-hidden="true" className="text-sm leading-none">→</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default function ShopByCategorySection({ items }: { items?: ShopByCategoryCardItem[] }) {
  const categoryItems = items?.length ? items : homeCategoryItems

  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-transparent px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
      aria-labelledby="shop-by-category-title"
    >
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Explore</p>
            <h2 id="shop-by-category-title" className="mt-3 font-sans text-[1.75rem] font-bold leading-[1] text-[var(--color-text)] sm:text-[2.15rem]">
              Shop by category
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--color-muted)] sm:text-[0.98rem]">
              Discover premium edits built for everyday wear, statement pieces, and easy gifting.
            </p>
          </div>
          <Link to="/shop" className="hidden shrink-0 items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text)] md:inline-flex">
            <span>View all</span>
            <span aria-hidden className="text-base leading-none">→</span>
          </Link>
        </div>

        <div className="mt-7 hidden gap-4 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {categoryItems.map((item, index) => (
            <CategoryCard key={item.key} name={item.name} href={item.href} image={item.image} index={index} />
          ))}
        </div>

        <div className="-mx-4 mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categoryItems.map((item, index) => (
            <div key={item.key} className="min-w-[47%] max-w-[10.8rem] flex-none">
              <CategoryCard name={item.name} href={item.href} image={item.image} index={index} />
            </div>
          ))}
        </div>

        <div className="mt-6 flex md:hidden">
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text)]">
            <span>View all</span>
            <span aria-hidden className="text-base leading-none">→</span>
          </Link>
        </div>
      </Container>
    </motion.section>
  )
}
