import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import { getCategoryBySlug, getProductsByCategory, shopCategories, shopProducts } from '../data/shopData'

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: Low to high' },
  { value: 'price-desc', label: 'Price: High to low' },
  { value: 'name', label: 'Name' },
] as const

export default function ShopPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const slug = location.pathname.split('/').filter(Boolean).at(-1)
  const category = slug && slug !== 'shop' ? getCategoryBySlug(slug) : undefined
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<(typeof sortOptions)[number]['value']>('featured')
  const visibleCategories = shopCategories.slice(0, 6)

  const products = useMemo(() => {
    const baseProducts = slug && slug !== 'shop' ? getProductsByCategory(slug) : shopProducts
    const query = searchQuery.trim().toLowerCase()

    const filtered = query
      ? baseProducts.filter((product) => [product.name, product.description, product.category].some((value) => value.toLowerCase().includes(query)))
      : baseProducts

    const sorted = [...filtered].sort((left, right) => {
      if (sortOrder === 'price-asc') {
        return Number.parseFloat(left.price.replace('$', '')) - Number.parseFloat(right.price.replace('$', ''))
      }
      if (sortOrder === 'price-desc') {
        return Number.parseFloat(right.price.replace('$', '')) - Number.parseFloat(left.price.replace('$', ''))
      }
      if (sortOrder === 'name') {
        return left.name.localeCompare(right.name)
      }
      return 0
    })

    return sorted
  }, [searchQuery, slug, sortOrder])

  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="flex flex-col gap-4 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">SHIS SHOP</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)] sm:text-4xl">
                {category?.title ?? 'Curated essentials'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
                {category?.description ?? 'Discover premium essentials crafted for modern dressing and timeless comfort.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search collection"
                className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none ring-0 sm:w-56"
              />
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as (typeof sortOptions)[number]['value'])}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button to="/shop" variant="secondary" className="px-4 py-2.5">
                All
              </Button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {shopCategories.map((item) => (
              <button
                key={item.slug}
                type="button"
                onClick={() => navigate(`/shop/${item.slug}`)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${location.pathname === `/shop/${item.slug}` ? 'border-[var(--color-accent)] bg-[rgba(201,162,39,0.12)] text-[var(--color-accent)]' : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] hover:border-[var(--color-accent)]'}`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--color-text)]">Featured picks</h2>
            <Link to="/shop/new-arrivals" className="text-sm font-semibold text-[var(--color-accent)]">View All</Link>
          </div>

          <div className="mb-8 flex gap-4 overflow-x-auto pb-2">
            {visibleCategories.map((item) => (
              <motion.button
                key={item.slug}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/shop/${item.slug}`)}
                className="min-w-[180px] overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90 text-left shadow-[0_14px_40px_rgba(0,0,0,0.05)]"
              >
                <img src={item.image} alt={item.title} loading="lazy" decoding="async" className="h-28 w-full object-cover" />
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{item.description}</p>
                </div>
              </motion.button>
            ))}
          </div>

          {products.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/70 px-6 py-12 text-center shadow-[0_14px_40px_rgba(0,0,0,0.04)]">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">No matches</p>
              <h3 className="mt-3 text-xl font-semibold text-[var(--color-text)]">Nothing matched your search yet</h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--color-muted)]">Try a broader term or reset the filters to see more of the collection.</p>
              <div className="mt-6 flex justify-center">
                <Button onClick={() => setSearchQuery('')} variant="secondary">Reset search</Button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}
