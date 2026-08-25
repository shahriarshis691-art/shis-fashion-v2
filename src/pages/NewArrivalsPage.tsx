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
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">New arrivals</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--color-text)]">Fresh drops, just in</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">The latest pieces from SHIS Fashion, curated for a premium, modern wardrobe.</p>
        </div>
        {newArrivals.length ? (
          <ProductListingGrid className="mt-6 md:mt-8">
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
          <div className="mt-8 border border-dashed border-black/20 px-4 py-8 text-center">
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">No new arrivals yet</p>
            <p className="mt-2 text-sm text-black/70">Browse the full collection while the next drop is prepared.</p>
          </div>
        )}
        {newArrivals.length > visibleCount ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((current) => current + LISTING_PAGE_SIZE)}
              className="ui-interactive border border-black px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white"
            >
              Load more
            </button>
          </div>
        ) : null}
      </Container>
    </section>
  )
}
