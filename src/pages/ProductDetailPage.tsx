import { Link, useParams } from 'react-router-dom'
import Container from '../components/ui/Container'
import { getProductsByCategory, shopProducts } from '../data/shopData'

export default function ProductDetailPage() {
  const { productSlug } = useParams()
  const product = shopProducts.find((entry) => entry.slug === productSlug)

  if (!product) {
    return null
  }

  const related = getProductsByCategory(product.category).filter((entry) => entry.id !== product.id).slice(0, 3)

  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="grid gap-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-8 lg:grid-cols-[1fr_0.9fr]">
          <img src={product.image} alt={product.name} className="h-[420px] w-full rounded-[1.5rem] object-cover" />
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Product detail</p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{product.name}</h1>
            <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">{product.description}</p>
            <div className="mt-6 flex items-center gap-4">
              <span className="text-2xl font-semibold text-[var(--color-accent)]">{product.price}</span>
              <Link to="/shop" className="text-sm font-semibold text-[var(--color-text)]">Back to shop</Link>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-semibold text-[var(--color-text)]">You may also like</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {related.map((item) => (
              <Link key={item.id} to={`/shop/${item.category}/${item.slug}`} className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90">
                <img src={item.image} alt={item.name} className="h-40 w-full object-cover" />
                <div className="p-4">
                  <h3 className="text-base font-semibold text-[var(--color-text)]">{item.name}</h3>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">{item.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
