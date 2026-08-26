import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import Container from '../components/ui/Container'
import {
  OVERSIZED_TEE_FIT,
  OVERSIZED_TEE_LISTING_PATH,
  isOversizedTeeProduct,
  matchesOversizedTeeAudience,
  mergeOversizedTeeCatalog,
  oversizedTeeCollectionProducts,
  type OversizedTeeAudienceFilter,
} from '../data/oversizedTeeCollection'
import { subscribeToProducts } from '../firebase/adminService'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { parseBDT } from '../utils/currency'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { applySeoMetadata, buildProductSchema } from '../utils/seo'
import type { ShopProduct } from '../data/shopData'

const SITE_URL = 'https://www.shisfashion.com'
const prefetchProductDetail = () => import('./ProductDetailPage')

type SortOption = 'newest' | 'price-low' | 'price-high'

const AUDIENCE_OPTIONS: Array<{ value: OversizedTeeAudienceFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'Men', label: 'Men' },
  { value: 'Women', label: 'Women' },
  { value: 'Unisex', label: 'Unisex' },
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
  const [audienceFilter, setAudienceFilter] = useState<OversizedTeeAudienceFilter>('all')
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
    const filtered = products.filter((product) => matchesOversizedTeeAudience(product, audienceFilter))
    const sorted = [...filtered]

    if (sortBy === 'price-low') {
      sorted.sort((left, right) => parseBDT(left.price) - parseBDT(right.price))
    } else if (sortBy === 'price-high') {
      sorted.sort((left, right) => parseBDT(right.price) - parseBDT(left.price))
    } else {
      sorted.sort((left, right) => Number(Boolean(right.newArrival)) - Number(Boolean(left.newArrival)))
    }

    return sorted
  }, [audienceFilter, products, sortBy])

  useEffect(() => {
    const canonicalPath = location.pathname === '/oversized-tee'
      ? '/oversized-tee'
      : OVERSIZED_TEE_LISTING_PATH

    const catalog = products.length ? products : oversizedTeeCollectionProducts
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
    <section className="bg-white pb-24 pt-6 lg:pb-20 lg:pt-10">
      <Container>
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

        <div className="mt-6 -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {AUDIENCE_OPTIONS.map((option) => {
            const active = audienceFilter === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setAudienceFilter(option.value)}
                className={`shrink-0 px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'text-neutral-900 underline decoration-neutral-900 decoration-1 underline-offset-8'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <div className="mt-5 flex items-center justify-between border-b border-neutral-100 pb-3">
          <p className="text-xs font-normal text-neutral-400">
            {visibleProducts.length} product{visibleProducts.length === 1 ? '' : 's'}
          </p>
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
            <p className="text-sm text-neutral-500">No oversized tees match this filter.</p>
            <button
              type="button"
              onClick={() => setAudienceFilter('all')}
              className="btn-glass-cta mt-5"
            >
              View all
            </button>
          </div>
        )}

        <p className="mt-8 text-[11px] uppercase tracking-[0.14em] text-neutral-400">
          Tags: Unisex / All Adults · {OVERSIZED_TEE_FIT}
        </p>
      </Container>
    </section>
  )
}
