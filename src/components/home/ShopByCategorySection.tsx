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
        className="group relative block aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.16)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_22px_50px_rgba(0,0,0,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] focus-visible:ring-offset-2"
        aria-label={`${name} collection`}
      >
        <img
          src={optimizedImage}
          alt={`${name} category`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.42)_58%,rgba(0,0,0,0.84)_100%)]" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pb-7 pt-12 text-center text-white">
          <h3 className="text-[1.05rem] font-medium tracking-[0.3px] antialiased transition-colors duration-300 group-hover:text-white/95">{name}</h3>
          <div className="mt-3 flex items-center gap-2 rounded-full border border-white/35 bg-black/25 px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/95 backdrop-blur-[1px] transition-all duration-300 group-hover:border-white/60 group-hover:bg-black/35">
            <span>Shop this edit</span>
            <span aria-hidden="true" className="text-xs leading-none">→</span>
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
      className="bg-[#FFFFFF] px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
      aria-labelledby="shop-by-category-title"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="shop-by-category-title" className="text-xs font-semibold uppercase tracking-[0.28em] text-[#111111]">
            SHOP BY CATEGORY
          </h2>
          <p className="mt-3 text-sm text-[#3A3A3A] sm:text-[0.95rem]">
            Discover our premium collections designed for every style.
          </p>
        </div>

        <div className="mt-7 hidden gap-4 md:grid md:grid-cols-3 lg:grid-cols-6">
          {categoryItems.map((item, index) => (
            <CategoryCard key={item.key} name={item.name} href={item.href} image={item.image} index={index} />
          ))}
        </div>

        <div className="-mx-4 mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categoryItems.map((item, index) => (
            <div key={item.key} className="min-w-[78%] max-w-[18rem] flex-none">
              <CategoryCard name={item.name} href={item.href} image={item.image} index={index} />
            </div>
          ))}
        </div>
      </Container>
    </motion.section>
  )
}
