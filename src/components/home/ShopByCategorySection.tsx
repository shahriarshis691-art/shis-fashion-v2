import { Link } from 'react-router-dom'
import { homeCategoryItems } from '../../data/homeCategories'
import Container from '../ui/Container'
import Reveal from '../common/Reveal'
import LuxuryImage from '../common/LuxuryImage'

export default function ShopByCategorySection({ items }: { items?: { key: string; name: string; href: string; image: string }[] }) {
  const categoryItems = items?.length ? items : homeCategoryItems

  return (
    <section
      className="bg-transparent px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-14"
      aria-labelledby="shop-by-category-title"
    >
      <Container>
        <h2
          id="shop-by-category-title"
          className="text-xl sm:text-2xl md:text-3xl font-bold tracking-wider text-center text-neutral-900 uppercase mb-6 sm:mb-8"
        >
          SHOP BY CATEGORY
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
          {categoryItems.map((item, index) => (
            <Reveal key={item.key} delayMs={index * 50}>
              <Link
                to={item.href}
                className="group luxury-tap flex flex-col items-center w-full cursor-pointer"
                aria-label={`${item.name} collection`}
              >
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-neutral-100">
                  <LuxuryImage
                    src={item.image}
                    alt={`${item.name} category`}
                    width={960}
                    height={1200}
                    sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
                    widths={[320, 480, 768, 960]}
                    className="h-full w-full"
                    aspectClassName="aspect-[4/5]"
                    imgClassName="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="mt-3 text-center w-full">
                  <span className="text-xs sm:text-sm md:text-base font-bold text-neutral-900 tracking-wide uppercase group-hover:text-neutral-600 transition-colors">
                    {item.name}
                  </span>
                </div>
              </Link>
            </Reveal>
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
