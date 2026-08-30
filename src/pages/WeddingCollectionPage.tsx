import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import ResponsiveHeroBanner from '../components/common/ResponsiveHeroBanner'
import { subscribeToProducts } from '../firebase/adminService'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { parseBDT } from '../utils/currency'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { applySeoMetadata } from '../utils/seo'
import {
  WEDDING_LISTING_HERO,
  WEDDING_LISTING_HERO_BACKGROUND,
  WEDDING_LISTING_HERO_HEIGHT,
  WEDDING_LISTING_HERO_WIDTH,
  mergeWeddingCatalog,
  weddingProductHref,
} from '../data/weddingCollection'
import type { ShopProduct } from '../data/shopData'

type SortOption = 'featured' | 'price-low' | 'price-high'

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
]

export default function WeddingCollectionPage() {
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()
  const [products, setProducts] = useState<ShopProduct[]>(() => mergeWeddingCatalog([]))
  const [sortBy, setSortBy] = useState<SortOption>('featured')

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => {
      setProducts(mergeWeddingCatalog(nextProducts.map((product) => mapAdminProductToShopProduct(product))))
    })

    return unsubscribe
  }, [])

  const visibleProducts = useMemo(() => {
    const sorted = [...products]

    if (sortBy === 'price-low') {
      sorted.sort((left, right) => parseBDT(left.price) - parseBDT(right.price))
      return sorted
    }

    if (sortBy === 'price-high') {
      sorted.sort((left, right) => parseBDT(right.price) - parseBDT(left.price))
      return sorted
    }

    sorted.sort(
      (left, right) =>
        Number(Boolean(right.featured)) - Number(Boolean(left.featured)) ||
        (right.stock ?? 0) - (left.stock ?? 0),
    )
    return sorted
  }, [products, sortBy])

  useEffect(() => {
    applySeoMetadata('/wedding', {
      title: 'Wedding Collection | SHIS Fashion Bangladesh',
      description:
        'Shop the SHIS Fashion wedding collection — timeless bridal sarees and groom panjabi edits with fast delivery and cash on delivery.',
      canonicalPath: '/wedding',
      keywords: 'wedding collection Bangladesh, bridal saree, groom panjabi, SHIS wedding',
    })
  }, [])

  return (
    <section className="bg-white pb-24">
      <ResponsiveHeroBanner
        src={WEDDING_LISTING_HERO}
        alt="SHIS Fashion wedding collection — timeless bridal and groom elegance"
        width={WEDDING_LISTING_HERO_WIDTH}
        height={WEDDING_LISTING_HERO_HEIGHT}
        background={WEDDING_LISTING_HERO_BACKGROUND}
        objectFit="cover"
        objectPosition="center"
        ariaLabel="Wedding collection banner"
      />

      <div className="mx-auto w-full max-w-7xl px-3 pt-6 md:px-6 lg:pt-10">
        <nav aria-label="Breadcrumb" className="text-[12px] font-normal tracking-wide text-neutral-400">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="hover:text-neutral-700">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-neutral-300">
              /
            </li>
            <li className="text-neutral-500">Wedding</li>
          </ol>
        </nav>

        <header className="mt-8 sm:mt-10">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">Wedding Collection</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Timeless bridal and groom elegance — refined sarees and panjabi edits for the wedding season.
          </p>
        </header>

        <div className="mt-8 flex items-center justify-end border-b border-neutral-100 pb-3 sm:mt-10">
          <label className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <span className="sr-only sm:not-sr-only">Sort</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="appearance-none bg-transparent pr-5 text-xs font-medium text-neutral-700 outline-none hover:text-neutral-900"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%737373' stroke-width='1.5'%3E%3Cpath d='m3 4.5 3 3 3-3'/%3E%3C/svg%3E\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.15rem center',
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div id="wedding-grid">
          {visibleProducts.length > 0 ? (
            <ProductListingGrid className="mt-8">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  href={weddingProductHref(product)}
                  variant="studio"
                  priority={index < 4}
                  onToggleWishlist={handleToggleWishlist}
                  isInWishlist={isInWishlist(String(product.id))}
                />
              ))}
            </ProductListingGrid>
          ) : (
            <p className="mt-10 text-center text-sm text-neutral-500">Wedding pieces will appear here as they are added to the catalog.</p>
          )}
        </div>
      </div>
    </section>
  )
}
