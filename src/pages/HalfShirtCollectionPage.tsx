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
    <section className="bg-white pb-24 pt-6 lg:pb-20 lg:pt-10">
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

        <header className="mt-8 sm:mt-10">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
              Men&apos;s Half Shirt Collection
            </h1>
            <span className="text-xs font-normal text-neutral-400">
              {visibleProducts.length} Product{visibleProducts.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
            Breathable fabrics, relaxed fits &amp; effortless everyday styling.
          </p>
        </header>

        <div className="mt-8 flex flex-col gap-4 border-b border-neutral-100 pb-4 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-4 flex gap-1 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {(['all', 'Regular', 'Oversized'] as const).map((fit) => {
              const active = selectedFit === fit
              return (
                <button
                  key={fit}
                  type="button"
                  onClick={() => setSelectedFit(fit)}
                  className={`shrink-0 px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'text-neutral-900 underline decoration-neutral-900 decoration-1 underline-offset-8'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {fit === 'all' ? 'All' : fit}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 self-end text-xs font-medium text-neutral-600">
            <label className="flex items-center gap-1.5">
              <span className="text-neutral-400">Size</span>
              <select
                value={selectedSize}
                onChange={(event) => setSelectedSize(event.target.value)}
                className="bg-transparent text-neutral-700 outline-none"
              >
                <option value="all">All</option>
                {SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <span className="text-neutral-400">Color</span>
              <select
                value={selectedColor}
                onChange={(event) => setSelectedColor(event.target.value)}
                className="max-w-[7rem] bg-transparent text-neutral-700 outline-none"
              >
                <option value="all">All</option>
                {colorOptions.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5">
              <span className="text-neutral-400">Sort</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="bg-transparent text-neutral-700 outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {visibleProducts.length ? (
          <ProductListingGrid className="mt-8">
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
            <div className="mt-16 py-10 text-center">
            <p className="text-sm text-neutral-500">No matching half shirts</p>
            <p className="mt-2 text-sm text-neutral-400">Try clearing a filter to see more styles.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedSize('all')
                setSelectedColor('all')
                setSelectedFit('all')
                setSortBy('featured')
              }}
              className="mt-4 text-xs font-medium text-neutral-900 underline underline-offset-4"
            >
              Reset filters
            </button>
          </div>
        )}
      </Container>
    </section>
  )
}
