import { useParams, Link } from 'react-router-dom'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import { getCategoryBySlug, getProductsByCategory } from '../data/shopData'

export default function ShopCategoryPage() {
  const { slug } = useParams()
  const category = slug ? getCategoryBySlug(slug) : undefined
  const products = slug ? getProductsByCategory(slug) : []

  if (!category) {
    return null
  }

  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Category</p>
              <h1 className="mt-2 text-3xl font-semibold text-[var(--color-text)]">{category.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">{category.description}</p>
            </div>
            <Link to="/shop" className="text-sm font-semibold text-[var(--color-accent)]">Back to shop</Link>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  )
}
