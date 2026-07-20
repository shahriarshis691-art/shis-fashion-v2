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
        className="group relative block aspect-[0.82] overflow-hidden rounded-[1.6rem] bg-[#f1ede6] shadow-[0_14px_34px_rgba(17,17,17,0.08)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_24px_50px_rgba(17,17,17,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2"
        aria-label={`${name} collection`}
      >
        <img
          src={optimizedImage}
          alt={`${name} category`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_8%,rgba(0,0,0,0.18)_40%,rgba(0,0,0,0.68)_100%)]" />

        <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-14 text-white">
          <div className="rounded-[1.1rem] border border-white/12 bg-black/22 px-4 py-4 backdrop-blur-sm">
            <h3 className="text-[1.18rem] font-semibold uppercase leading-[1.02] tracking-[0.06em] antialiased transition-colors duration-300 group-hover:text-white/95">{name}</h3>
            <div className="mt-3 flex items-center justify-between gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white/84">
              <span>Shop now</span>
              <span aria-hidden="true" className="text-base leading-none">→</span>
            </div>
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
            <h2 id="shop-by-category-title" className="mt-3 text-[2rem] font-bold leading-[0.96] text-[var(--color-text)] sm:text-[2.45rem]">
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
            <div key={item.key} className="min-w-[43%] max-w-[10.2rem] flex-none">
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
