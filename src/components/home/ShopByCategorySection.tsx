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
        className="group relative block aspect-[4/5] overflow-hidden rounded-[1.15rem] bg-[#0a0a0a] shadow-[0_12px_24px_rgba(0,0,0,0.3)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(0,0,0,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
        aria-label={`${name} collection`}
      >
        <img
          src={optimizedImage}
          alt={`${name} category`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.03)_12%,rgba(0,0,0,0.1)_52%,rgba(0,0,0,0.52)_100%)]" />

        <div className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-10 text-white">
          <h3 className="font-sans text-[0.9rem] font-semibold uppercase leading-[1.08] tracking-[0.08em] antialiased drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] transition-colors duration-300 group-hover:text-white/95">{name}</h3>
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
    </motion.section>
  )
}
