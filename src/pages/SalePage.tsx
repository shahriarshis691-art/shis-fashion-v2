import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import { subscribeToProducts, type AdminProduct } from '../firebase/adminService'
import type { ShopProduct } from '../data/shopData'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { parseBDT } from '../utils/currency'
import { useListingWishlist } from '../hooks/useListingWishlist'

function mapProduct(product: AdminProduct): ShopProduct {
  return mapAdminProductToShopProduct(product)
}

function isSaleProduct(product: ShopProduct) {
  const comparePrice = parseBDT(product.comparePrice ?? '')
  const price = parseBDT(product.price)
  return Boolean(product.comparePrice) && comparePrice > price
}

export default function SalePage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [ready, setReady] = useState(false)
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => {
      setProducts(nextProducts.map(mapProduct))
      setReady(true)
    })

    return unsubscribe
  }, [])

  const saleProducts = useMemo(
    () => products.filter(isSaleProduct),
    [products],
  )

  return (
    <section className="bg-white pb-24 pt-6 lg:pb-20 lg:pt-10">
      <Container>
        <div>
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">Sale</h1>
            {ready ? (
              <span className="text-xs font-normal text-neutral-400">
                {saleProducts.length} Product{saleProducts.length === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Reduced-price pieces from the current SHIS Fashion catalog.
          </p>
        </div>

        {!ready ? (
          <ProductListingGrid className="mt-8" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`sale-skeleton-${index}`}>
                <div className="aspect-[3/4] animate-pulse bg-black/5" />
                <div className="mt-2 h-3 w-3/4 animate-pulse bg-black/5" />
                <div className="mt-1.5 h-3 w-1/3 animate-pulse bg-black/5" />
              </div>
            ))}
          </ProductListingGrid>
        ) : saleProducts.length ? (
          <ProductListingGrid className="mt-8">
            {saleProducts.map((product, index) => (
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
            <p className="text-sm text-neutral-500">No sale items right now</p>
            <p className="mt-2 text-sm text-neutral-400">Browse the full collection while the next marked-down pieces are prepared.</p>
            <Link
              to="/shop"
              className="btn-glass-cta mt-6"
            >
              Shop all
            </Link>
          </div>
        )}
      </Container>
    </section>
  )
}
