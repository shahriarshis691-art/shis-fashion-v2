import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import { halfShirtCollectionProducts } from '../data/halfShirtCollection'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { parseBDT } from '../utils/currency'
import { applySeoMetadata } from '../utils/seo'

type SortOption = 'featured' | 'newest' | 'price-low' | 'price-high'
type FitFilter = 'all' | 'Regular' | 'Oversized'

const SIZE_OPTIONS = ['M', 'L', 'XL', 'XXL'] as const

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
]

export default function HalfShirtCollectionPage() {
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [selectedSize, setSelectedSize] = useState<string>('all')
  const [selectedColor, setSelectedColor] = useState<string>('all')
  const [selectedFit, setSelectedFit] = useState<FitFilter>('all')

  const colorOptions = useMemo(() => {
    const colors = new Set<string>()
    halfShirtCollectionProducts.forEach((product) => {
      product.colors?.forEach((color) => colors.add(color))
    })
    return Array.from(colors).sort((left, right) => left.localeCompare(right))
  }, [])

  const visibleProducts = useMemo(() => {
    const filtered = halfShirtCollectionProducts.filter((product) => {
      if (selectedSize !== 'all' && !(product.sizes ?? []).includes(selectedSize)) {
        return false
      }

      if (selectedColor !== 'all' && !(product.colors ?? []).includes(selectedColor)) {
        return false
      }

      if (selectedFit !== 'all' && product.fit !== selectedFit) {
        return false
      }

      return true
    })

    const sorted = [...filtered]

    if (sortBy === 'newest') {
      sorted.sort((left, right) => Number(Boolean(right.newArrival)) - Number(Boolean(left.newArrival)))
      return sorted
    }

    if (sortBy === 'price-low') {
      sorted.sort((left, right) => parseBDT(left.price) - parseBDT(right.price))
      return sorted
    }

    if (sortBy === 'price-high') {
      sorted.sort((left, right) => parseBDT(right.price) - parseBDT(left.price))
      return sorted
    }

    sorted.sort(
      (left, right) =>
        Number(Boolean(right.featured)) - Number(Boolean(left.featured)) ||
        (right.stock ?? 0) - (left.stock ?? 0),
    )
    return sorted
  }, [selectedColor, selectedFit, selectedSize, sortBy])

  useEffect(() => {
    applySeoMetadata('/collections/half-shirt', {
      title: "Men's Half Shirt Collection | SHIS Fashion Bangladesh",
      description:
        'Shop breathable, relaxed MEN\'S HALF SHIRT styles from SHIS Fashion — Cuban collar, linen, cotton, and everyday casual edits.',
      canonicalPath: '/collections/half-shirt',
      keywords: 'half shirt, mens half shirt, SHIS Fashion Bangladesh, casual shirt',
    })
  }, [])

  return (
    <section className="bg-white px-3.5 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-20 lg:pt-10">
      <Container>
        <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.14em] text-black/55">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="hover:text-black">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link to="/shop" className="hover:text-black">
                Collections
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-black">Half Shirt</li>
          </ol>
        </nav>

        <header className="mt-5 max-w-3xl border-b border-black/10 pb-6">
          <p className="text-caption uppercase tracking-[0.14em] text-black/55">Men&apos;s Edit</p>
          <h1
            className="mt-1 text-xl font-normal uppercase tracking-[0.16em] text-neutral-900 sm:text-2xl md:text-3xl"
            style={{ fontFamily: 'var(--font-brand)' }}
          >
            Men&apos;s Half Shirt Collection
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-black/70">
            Breathable fabrics, relaxed fits &amp; effortless everyday styling.
          </p>
        </header>

        <div className="mt-6 flex flex-col gap-4 border border-black/10 bg-[#fafafa] p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/60">
              {visibleProducts.length} styles
            </p>
            <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-black/65">
              <span>Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="border border-black/15 bg-white px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-900 outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">
              Size
              <select
                value={selectedSize}
                onChange={(event) => setSelectedSize(event.target.value)}
                className="border border-black/15 bg-white px-3 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-900 outline-none"
              >
                <option value="all">All sizes</option>
                {SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">
              Color
              <select
                value={selectedColor}
                onChange={(event) => setSelectedColor(event.target.value)}
                className="border border-black/15 bg-white px-3 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-900 outline-none"
              >
                <option value="all">All colors</option>
                {colorOptions.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">
              Fabric / Fit
              <select
                value={selectedFit}
                onChange={(event) => setSelectedFit(event.target.value as FitFilter)}
                className="border border-black/15 bg-white px-3 py-2 text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-900 outline-none"
              >
                <option value="all">All fits</option>
                <option value="Regular">Regular</option>
                <option value="Oversized">Oversized</option>
              </select>
            </label>
          </div>
        </div>

        {visibleProducts.length ? (
          <ProductListingGrid className="mt-6">
            {visibleProducts.map((product, index) => (
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
          <div className="mt-8 border border-dashed border-black/20 px-4 py-10 text-center">
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">No matching half shirts</p>
            <p className="mt-2 text-sm text-black/70">Try clearing a filter to see more styles.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedSize('all')
                setSelectedColor('all')
                setSelectedFit('all')
                setSortBy('featured')
              }}
              className="ui-interactive mt-4 inline-flex border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white"
            >
              Reset filters
            </button>
          </div>
        )}
      </Container>
    </section>
  )
}
