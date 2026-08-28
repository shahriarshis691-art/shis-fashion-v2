import { Link } from 'react-router-dom'
import ProductCard from '../shop/ProductCard'
import ProductListingGrid from '../shop/ProductListingGrid'
import type { ShopProduct } from '../../data/shopData'
import { useListingWishlist } from '../../hooks/useListingWishlist'

export default function HomeProductGrid({
  products,
  eyebrow,
  title,
  href,
  emptyLabel,
}: {
  products: ShopProduct[]
  eyebrow: string
  title: string
  href: string
  emptyLabel?: string
}) {
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()
  const visible = products.slice(0, 8)

  if (!visible.length) {
    return emptyLabel ? (
      <section className="bg-white px-4 py-12 md:px-6">
        <p className="text-center text-sm text-neutral-500">{emptyLabel}</p>
      </section>
    ) : null
  }

  return (
    <section className="bg-white px-4 py-10 md:px-8 md:py-16" aria-labelledby={`${eyebrow.replace(/\s+/g, '-').toLowerCase()}-title`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium tracking-[0.22em] text-[var(--color-gold)] uppercase">{eyebrow}</p>
            <h2
              id={`${eyebrow.replace(/\s+/g, '-').toLowerCase()}-title`}
              className="mt-1 text-3xl text-[#111111] md:text-4xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {title}
            </h2>
          </div>
          <Link
            to={href}
            className="hidden text-[11px] font-semibold tracking-[0.16em] text-[#111111] uppercase underline underline-offset-4 sm:inline"
          >
            View all
          </Link>
        </div>
        <ProductListingGrid>
          {visible.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
              onToggleWishlist={handleToggleWishlist}
              isInWishlist={isInWishlist(String(product.id))}
            />
          ))}
        </ProductListingGrid>
        <div className="mt-8 text-center sm:hidden">
          <Link to={href} className="text-[11px] font-semibold tracking-[0.16em] text-[#111111] uppercase underline underline-offset-4">
            View all
          </Link>
        </div>
      </div>
    </section>
  )
}
