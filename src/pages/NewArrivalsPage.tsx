import { useEffect, useMemo, useState } from 'react'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import { subscribeToProducts, type AdminProduct } from '../firebase/adminService'
import type { ShopProduct } from '../data/shopData'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { resolveCanonicalSubcategorySlug } from '../data/categoryTaxonomy'
import { useListingWishlist } from '../hooks/useListingWishlist'

const LISTING_PAGE_SIZE = 24

function mapProduct(product: AdminProduct): ShopProduct {
  const canonicalCategory = resolveCanonicalSubcategorySlug(product.category)
  return mapAdminProductToShopProduct(product, {
    category: canonicalCategory && canonicalCategory !== 'all' ? canonicalCategory : product.category.trim().toLowerCase(),
  })
}

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [visibleCount, setVisibleCount] = useState(LISTING_PAGE_SIZE)
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => {
      setProducts(nextProducts.map(mapProduct))
    })

    return unsubscribe
  }, [])

  const newArrivals = useMemo(
    () => products.filter((product) => product.newArrival),
    [products],
  )
  const pagedProducts = newArrivals.slice(0, visibleCount)

  return (
    <section className="bg-white px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <header className="mt-2 sm:mt-4">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">New Arrivals</h1>
            <span className="text-xs font-normal text-neutral-400">
              {newArrivals.length} Product{newArrivals.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            The latest pieces from SHIS Fashion, curated for a premium, modern wardrobe.
          </p>
        </header>
        {newArrivals.length ? (
          <ProductListingGrid className="mt-8">
            {pagedProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 4}
                onToggleWishlist={handleToggleWishlist}
                isInWishlist={isInWishlist(String(product.id))}
              />
            ))}
          </ProductListingGrid>
        ) : (
          <div className="mt-16 py-10 text-center">
            <p className="text-sm text-neutral-500">No new arrivals yet</p>
            <p className="mt-2 text-sm text-neutral-400">Browse the full collection while the next drop is prepared.</p>
          </div>
        )}
        {newArrivals.length > visibleCount ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + LISTING_PAGE_SIZE)}
              className="text-xs font-medium text-neutral-900 underline underline-offset-4"
            >
              Load more
            </button>
          </div>
        ) : null}
      </Container>
    </section>
  )
}
