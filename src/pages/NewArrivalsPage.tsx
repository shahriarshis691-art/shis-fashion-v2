import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import { shopProducts } from '../data/shopData'

export default function NewArrivalsPage() {
  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">New arrivals</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--color-text)]">Fresh drops, just in</h1>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">The latest pieces from SHIS Fashion, curated for a premium, modern wardrobe.</p>
        </div>
        <div className="mt-6 grid gap-3.5 md:mt-8 md:grid-cols-2 xl:grid-cols-3">
          {shopProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  )
}
