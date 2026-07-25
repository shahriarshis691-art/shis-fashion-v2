import { useEffect, useMemo, useState } from 'react'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import { subscribeToProducts, type AdminProduct } from '../firebase/adminService'
import type { ShopProduct } from '../data/shopData'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { resolveCanonicalSubcategorySlug } from '../data/categoryTaxonomy'

function mapProduct(product: AdminProduct): ShopProduct {
  const canonicalCategory = resolveCanonicalSubcategorySlug(product.category)
  return mapAdminProductToShopProduct(product, {
    category: canonicalCategory && canonicalCategory !== 'all' ? canonicalCategory : product.category.trim().toLowerCase(),
  })
}

export default function NewArrivalsPage() {
  const [products, setProducts] = useState<ShopProduct[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => {
      setProducts(nextProducts.map(mapProduct))
    })

    return unsubscribe
  }, [])

  const newArrivals = useMemo(() => {
    const prioritized = [
      ...products.filter((product) => product.newArrival),
      ...products.filter((product) => !product.newArrival),
    ]
    return prioritized.slice(0, 18)
  }, [products])

  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">New arrivals</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--color-text)]">Fresh drops, just in</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">The latest pieces from SHIS Fashion, curated for a premium, modern wardrobe.</p>
        </div>
        <div className="mt-6 grid gap-3.5 md:mt-8 md:grid-cols-2 xl:grid-cols-3">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  )
}
