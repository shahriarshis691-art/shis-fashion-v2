import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../components/ui/Container'
import LuxuryImage from '../components/common/LuxuryImage'
import { halfShirtCollectionProducts, type HalfShirtProduct } from '../data/halfShirtCollection'
import { useCart } from '../context/CartContext'
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

function HalfShirtProductCard({ product }: { product: HalfShirtProduct }) {
  const { addToCart } = useCart()
  const defaultSize = product.sizes?.[0] ?? 'L'
  const defaultColor = product.colors?.[0] ?? 'Default'

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
        <LuxuryImage
          src={product.image}
          alt={product.name}
          width={960}
          height={1280}
          sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
          widths={[320, 480, 768, 960]}
          hover
          className="h-full w-full"
          aspectClassName="aspect-[3/4]"
          imgClassName="h-full w-full object-cover object-[center_top]"
        />

        <span className="absolute left-2.5 top-2.5 bg-white/90 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-neutral-900 backdrop-blur-sm">
          Half Shirt
        </span>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-2 flex-col gap-2 bg-gradient-to-t from-black/55 via-black/20 to-transparent px-2.5 pb-2.5 pt-10 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex-row">
          <Link
            to={`/shop/${product.category}/${product.slug}`}
            className="pointer-events-auto inline-flex flex-1 items-center justify-center bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={() => addToCart(product, { size: defaultSize, color: defaultColor, quantity: 1 })}
            className="pointer-events-auto inline-flex flex-1 items-center justify-center border border-white/70 bg-black/70 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm transition-colors hover:bg-black"
          >
            Add to Cart
          </button>
        </div>
      </div>

      <div className="pt-2.5 text-left sm:pt-3">
        <h2 className="line-clamp-2 text-xs font-bold leading-snug text-neutral-900 transition-colors group-hover:text-neutral-600 sm:text-sm">
          {product.name}
        </h2>
        <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-neutral-500">
          {product.fit} · {product.fabric}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-xs font-normal text-neutral-800 sm:text-sm">{product.price}</p>
          {product.comparePrice ? (
            <p className="text-[10px] text-neutral-400 line-through sm:text-xs">{product.comparePrice}</p>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default function HalfShirtCollectionPage() {
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
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {visibleProducts.map((product) => (
              <HalfShirtProductCard key={product.id} product={product} />
            ))}
          </div>
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
