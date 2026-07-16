import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { homeCategoryItems } from '../../data/homeCategories'
import { normalizeCatalogImageUrl } from '../../utils/media'
import Container from '../ui/Container'

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

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05)_0%,rgba(0,0,0,0.35)_52%,rgba(0,0,0,0.78)_100%)]" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pb-7 pt-12 text-center text-white">
          <h3 className="text-[1.05rem] font-medium tracking-[0.3px] antialiased transition-colors duration-300 group-hover:text-white/95">{name}</h3>
          <p className="mt-2 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-white/85 transition-colors duration-300 group-hover:text-white">
            {'Explore Collection ->'}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}

export default function ShopByCategorySection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="bg-[#FFFFFF] px-4 py-14 sm:px-6 lg:px-8 lg:py-18"
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

        <div className="mt-9 hidden gap-6 md:grid md:grid-cols-3 lg:grid-cols-5">
          {homeCategoryItems.map((item, index) => (
            <CategoryCard key={item.key} name={item.name} href={item.href} image={item.image} index={index} />
          ))}
        </div>

        <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {homeCategoryItems.map((item, index) => (
            <div key={item.key} className="min-w-[74%] max-w-[18rem] flex-none">
              <CategoryCard name={item.name} href={item.href} image={item.image} index={index} />
            </div>
          ))}
        </div>
      </Container>
    </motion.section>
  )
}
