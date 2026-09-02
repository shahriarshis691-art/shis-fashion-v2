import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import ResponsiveHeroBanner from '../components/common/ResponsiveHeroBanner'
import Container from '../components/ui/Container'
import {
  OVERSIZED_TEE_FIT,
  OVERSIZED_TEE_LISTING_PATH,
  isOversizedTeeProduct,
  matchesOversizedTeeListingFilter,
  mergeOversizedTeeCatalog,
  type OversizedTeeListingFilter,
} from '../data/oversizedTeeCollection'
import { subscribeToProducts } from '../firebase/adminService'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { parseBDT } from '../utils/currency'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { applySeoMetadata, buildProductSchema } from '../utils/seo'
import type { ShopProduct } from '../data/shopData'

const SITE_URL = 'https://www.shisfashion.com'
const prefetchProductDetail = () => import('./ProductDetailPage')

const OVERSIZED_TEE_LISTING_HERO = '/hero/oversized-new-hero.png'

type SortOption = 'newest' | 'price-low' | 'price-high'

const LISTING_FILTER_OPTIONS: Array<{ value: OversizedTeeListingFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'Unisex', label: 'Unisex' },
  { value: 'Men', label: 'Men' },
  { value: 'Women', label: 'Women' },
  { value: 'Graphic', label: 'Graphic' },
  { value: 'Solid', label: 'Solid' },
]

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
]

export default function OversizedTeeCollectionPage() {
  const location = useLocation()
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()
  const [products, setProducts] = useState<ShopProduct[]>(() => mergeOversizedTeeCatalog([]))
  const [listingFilter, setListingFilter] = useState<OversizedTeeListingFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => {
      const live = nextProducts
        .map((product) => mapAdminProductToShopProduct(product))
        .filter((product) => isOversizedTeeProduct(product))
      setProducts(mergeOversizedTeeCatalog(live))
    })

    return unsubscribe
  }, [])

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => matchesOversizedTeeListingFilter(product, listingFilter))
    const sorted = [...filtered]

    if (sortBy === 'price-low') {
      sorted.sort((left, right) => parseBDT(left.price) - parseBDT(right.price))
    } else if (sortBy === 'price-high') {
      sorted.sort((left, right) => parseBDT(right.price) - parseBDT(left.price))
    } else {
      sorted.sort((left, right) => Number(Boolean(right.newArrival)) - Number(Boolean(left.newArrival)))
    }

    return sorted
  }, [listingFilter, products, sortBy])

  useEffect(() => {
    const canonicalPath = location.pathname === '/oversized-tee'
      ? '/oversized-tee'
      : OVERSIZED_TEE_LISTING_PATH

    const catalog = products
    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Oversized Tee Collection',
      url: `${SITE_URL}${canonicalPath}`,
      numberOfItems: catalog.length,
      itemListElement: catalog.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/product/${product.slug}`,
        name: product.name,
        image: product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`,
      })),
    }

    const productSchemas = catalog.map((product) =>
      buildProductSchema(
        {
          name: product.name,
          description: product.description || 'Premium oversized tee from SHIS Fashion Bangladesh.',
          slug: product.slug,
          category: product.category,
          image: product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`,
          price: product.price,
          comparePrice: product.comparePrice,
          brand: product.brand,
          stock: product.stock ?? 0,
        },
        `/product/${product.slug}`,
      ),
    )

    applySeoMetadata(canonicalPath, {
      title: 'Oversized Tee Collection | SHIS Fashion Bangladesh',
      description:
        'Shop unisex oversized tees for men, women, and all adults. Graphic, vintage, and heavyweight cuts in S–XXL boxy fit from SHIS Fashion Bangladesh.',
      canonicalPath: OVERSIZED_TEE_LISTING_PATH,
      keywords: 'oversized tee Bangladesh, unisex oversized t-shirt, SHIS oversized tee, boxy tee Dhaka',
      schema: [itemListSchema, ...productSchemas],
    })
  }, [location.pathname, products])

  return (
    <section className="bg-white pb-24 lg:pb-20">
      <ResponsiveHeroBanner
        src={OVERSIZED_TEE_LISTING_HERO}
        alt="SHIS Fashion oversized tee collection — premium fashion"
        width={1717}
        height={916}
        background="dark"
        ariaLabel="Oversized Tee collection banner"
      />

      <Container className="pt-6 lg:pt-10">
        <nav className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-black/55">
          <Link to="/" className="hover:text-black">Home</Link>
          <span>/</span>
          <span className="text-black">Oversized Tee</span>
        </nav>

        <div>
          <h1 className="text-h1 text-black">OVERSIZED TEE</h1>
          <p className="mt-3 max-w-2xl text-body text-black/72">
            An all-inclusive adult collection for Unisex, Men, and Women. {OVERSIZED_TEE_FIT} in S, M, L, XL, and XXL.
          </p>
        </div>

        {products.length ? (
          <>
            <div className="sticky top-[calc(var(--nav-offset,3.5rem)+0.25rem)] z-30 -mx-4 mt-6 border-b border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur-md sm:-mx-8 sm:px-8">
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {LISTING_FILTER_OPTIONS.map((option) => {
                  const active = listingFilter === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setListingFilter(option.value)}
                      className={`shrink-0 px-3 py-1.5 text-xs font-medium tracking-[0.08em] uppercase transition-colors ${
                        active
                          ? 'bg-black text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <label htmlFor="oversized-tee-sort" className="text-xs font-medium text-neutral-400">
                  Sort
                </label>
                <select
                  id="oversized-tee-sort"
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                  className="border-0 bg-transparent py-1 text-xs font-medium text-neutral-800 outline-none"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        ) : null}

        {visibleProducts.length ? (
          <ProductListingGrid className="mt-6">
            {visibleProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                href={`/product/${product.slug}`}
                prefetchModule={prefetchProductDetail}
                priority={index < 4}
                onToggleWishlist={handleToggleWishlist}
                isInWishlist={isInWishlist(String(product.id))}
              />
            ))}
          </ProductListingGrid>
        ) : (
          <div className="mt-16 text-center">
            <p className="text-sm text-neutral-500">
              {products.length
                ? 'No oversized tees match this filter.'
                : 'New oversized tees will appear here as they are added.'}
            </p>
            {products.length ? (
              <button
                type="button"
                onClick={() => setListingFilter('all')}
                className="btn-glass-cta mt-5"
              >
                View all
              </button>
            ) : null}
          </div>
        )}

        {products.length ? (
          <p className="mt-8 text-[11px] uppercase tracking-[0.14em] text-neutral-400">
            Unisex oversized tees are exclusive to this collection · {OVERSIZED_TEE_FIT}
          </p>
        ) : null}
      </Container>
    </section>
  )
}
