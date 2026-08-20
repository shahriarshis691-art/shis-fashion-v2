import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import { subscribeToProducts, type AdminProduct } from '../firebase/adminService'
import type { ShopProduct } from '../data/shopData'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { parseBDT } from '../utils/currency'
import { useWishlist } from '../context/WishlistContext'
import { googleAnalytics } from '../services/googleAnalytics'

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
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

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

  const handleToggleWishlist = (product: ShopProduct) => {
    if (isInWishlist(String(product.id))) {
      removeFromWishlist(String(product.id))
      return
    }

    addToWishlist(product)
    googleAnalytics.trackEvent('wishlist_added', {
      item_id: String(product.id),
      item_name: product.name,
      item_category: product.category,
      value: parseBDT(product.price),
      currency: 'BDT',
    })
  }

  return (
    <section className="bg-white px-3.5 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-20 lg:pt-10">
      <Container>
        <div>
          <p className="text-caption uppercase tracking-[0.14em] text-black/55">Sale</p>
          <h1 className="mt-1 text-h1 text-black">Sale pieces</h1>
          <p className="mt-3 max-w-2xl text-body text-black/72">
            Reduced-price pieces from the current SHIS Fashion catalog. Only products with a marked compare-at price appear here.
          </p>
        </div>

        {!ready ? (
          <div className="mt-6 grid grid-cols-2 gap-x-1.5 gap-y-4 sm:grid-cols-3 lg:grid-cols-4 tight-mobile-grid" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`sale-skeleton-${index}`}>
                <div className="aspect-[4/5] animate-pulse bg-black/5" />
                <div className="mt-2 h-3 w-3/4 animate-pulse bg-black/5" />
                <div className="mt-1.5 h-3 w-1/3 animate-pulse bg-black/5" />
              </div>
            ))}
          </div>
        ) : saleProducts.length ? (
          <div className="mt-6 grid grid-cols-2 gap-x-1.5 gap-y-4 sm:grid-cols-3 lg:grid-cols-4 tight-mobile-grid">
            {saleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onToggleWishlist={handleToggleWishlist}
                isInWishlist={isInWishlist(String(product.id))}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 border border-dashed border-black/20 px-4 py-8 text-center">
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">No sale items right now</p>
            <p className="mt-2 text-sm text-black/70">Browse the full collection while the next marked-down pieces are prepared.</p>
            <Link
              to="/shop"
              className="ui-interactive mt-4 inline-flex border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white"
            >
              Shop all
            </Link>
          </div>
        )}
      </Container>
    </section>
  )
}
