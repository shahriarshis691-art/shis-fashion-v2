import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import KidsSizeGuideModal from '../components/kids/KidsSizeGuideModal'
import {
  KIDS_COLOR_LABELS,
  KIDS_OVERSIZED_SIZES,
  kidsOversizedTeeProducts,
  type KidsGenderCategory,
  type KidsOversizedTeeProduct,
} from '../data/kidsOversizedTeeCollection'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { parseBDT } from '../utils/currency'
import { applySeoMetadata, buildProductSchema } from '../utils/seo'

type GenderFilter = 'all' | KidsGenderCategory
type SortOption = 'newest' | 'price-low' | 'price-high'

const SITE_URL = 'https://www.shisfashion.com'
const ALL_KIDS_PRODUCTS = kidsOversizedTeeProducts

function prefetchKidsProductDetail() {
  void import('./KidsProductDetailPage')
}

function matchesGenderFilter(product: KidsOversizedTeeProduct, genderFilter: GenderFilter) {
  if (genderFilter === 'all') {
    return true
  }

  const selected = genderFilter.trim().toLowerCase()
  const productGender = product.genderCategory.trim().toLowerCase()
  const productCategory = String(product.category ?? '').trim().toLowerCase()

  if (productGender === selected) {
    return true
  }

  if (selected === 'kids boy' || selected === 'boys') {
    return productGender.includes('boy') || productCategory.includes('boy')
  }

  if (selected === 'kids girl' || selected === 'girls') {
    return productGender.includes('girl') || productCategory.includes('girl')
  }

  if (selected === 'unisex') {
    return productGender.includes('unisex') || productCategory.includes('unisex') || productCategory === 'kids'
  }

  return false
}

function matchesSizeFilter(product: KidsOversizedTeeProduct, sizeFilter: string) {
  if (sizeFilter === 'all') {
    return true
  }

  return (product.sizes ?? []).some((size) => size.trim().toLowerCase() === sizeFilter.trim().toLowerCase())
}

function matchesSearch(product: KidsOversizedTeeProduct, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  const haystack = [
    product.name,
    product.genderCategory,
    product.description ?? '',
    ...(product.colors ?? []),
    ...(product.colorHexes ?? []).map((hex) => KIDS_COLOR_LABELS[hex] ?? hex),
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalized)
}

const GENDER_OPTIONS: Array<{ value: GenderFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'Kids Boy', label: 'Boys' },
  { value: 'Kids Girl', label: 'Girls' },
  { value: 'Unisex', label: 'Unisex' },
]

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
]

function KidsProductCard({
  product,
  priority,
  onToggleWishlist,
  wished,
}: {
  product: KidsOversizedTeeProduct
  priority?: boolean
  onToggleWishlist: (product: KidsOversizedTeeProduct) => void
  wished: boolean
}) {
  const detailHref = `/kids/${product.slug}`

  return (
    <article className="group relative min-w-0">
      <Link
        to={detailHref}
        className="block"
        aria-label={`View ${product.name}`}
        onMouseEnter={prefetchKidsProductDetail}
        onFocus={prefetchKidsProductDetail}
      >
        <div className="relative aspect-[3/4] overflow-hidden bg-[#f6f6f6]">
          <img
            src={product.image}
            alt={product.name}
            width={960}
            height={1280}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
            className="h-full w-full object-contain p-1 transition-transform duration-300 ease-out group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.src = '/og-image.svg'
            }}
          />
        </div>

        <div className="pt-2.5 text-left sm:pt-3">
          <h2 className="line-clamp-1 text-left text-[13px] font-semibold tracking-tight text-gray-900 sm:text-[14px]">
            {product.name}
          </h2>
          <p className="mt-0.5 text-left text-[12px] font-normal text-gray-800 sm:text-[13px]">{product.price}</p>
        </div>
      </Link>

      <button
        type="button"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          onToggleWishlist(product)
        }}
        className="absolute top-2.5 right-2.5 z-10 text-neutral-600 transition-colors hover:text-red-500 sm:top-3 sm:right-3"
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </article>
  )
}

export default function KidsOversizedTeeCollectionPage() {
  const location = useLocation()
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all')
  const [sizeFilter, setSizeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()

  const visibleProducts = useMemo(() => {
    const filtered = ALL_KIDS_PRODUCTS.filter((product) => {
      if (!matchesGenderFilter(product, genderFilter)) {
        return false
      }

      if (!matchesSizeFilter(product, sizeFilter)) {
        return false
      }

      if (!matchesSearch(product, searchQuery)) {
        return false
      }

      return product.inStock !== false
    })

    const sorted = [...filtered]
    if (sortBy === 'price-low') {
      sorted.sort((left, right) => parseBDT(left.price) - parseBDT(right.price))
    } else if (sortBy === 'price-high') {
      sorted.sort((left, right) => parseBDT(right.price) - parseBDT(left.price))
    } else {
      sorted.sort((left, right) => Number(right.newest) - Number(left.newest) || Number(right.featured) - Number(left.featured))
    }

    return sorted
  }, [genderFilter, sizeFilter, sortBy, searchQuery])

  useEffect(() => {
    const canonicalPath = location.pathname.startsWith('/collections/')
      ? location.pathname
      : '/kids'

    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Kids Oversized Tee Collection',
      url: `${SITE_URL}${canonicalPath}`,
      numberOfItems: ALL_KIDS_PRODUCTS.length,
      itemListElement: ALL_KIDS_PRODUCTS.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/kids/${product.slug}`,
        name: product.name,
        image: product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`,
      })),
    }

    const productSchemas = ALL_KIDS_PRODUCTS.map((product) =>
      buildProductSchema(
        {
          name: product.name,
          description: product.description ?? 'Premium kids oversized tee from SHIS Fashion.',
          slug: product.slug,
          category: product.category,
          image: product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`,
          price: product.price,
          comparePrice: product.comparePrice,
          brand: product.brand,
          stock: product.stock ?? 0,
        },
        `/kids/${product.slug}`,
      ),
    )

    applySeoMetadata(canonicalPath, {
      title: 'Kids Oversized Tee Collection | SHIS Fashion Bangladesh',
      description:
        'Premium heavy cotton kids oversized drop-shoulder tees for boys, girls, and unisex styles. Shop SHIS Fashion Bangladesh.',
      canonicalPath,
      keywords: 'kids oversized tee, kids t-shirt Bangladesh, SHIS Fashion kids',
      schema: [itemListSchema, ...productSchemas],
    })
  }, [location.pathname])

  useEffect(() => {
    if (!sizeGuideOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [sizeGuideOpen])

  return (
    <section className="bg-[#fdfbf9] pb-24 pt-6 md:pb-20 md:pt-10">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.14em] text-black/55">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="hover:text-black">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link to="/kids" className="hover:text-black">
                Kids
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-black">Oversized Tees</li>
          </ol>
        </nav>

        <header className="mt-5 max-w-3xl border-b border-black/10 pb-6">
          <p className="text-caption uppercase tracking-[0.14em] text-black/55">Kids Edit</p>
          <h1
            className="mt-1 text-xl font-normal uppercase tracking-[0.16em] text-neutral-900 sm:text-2xl md:text-3xl"
            style={{ fontFamily: 'var(--font-brand)' }}
          >
            Kids Oversized Collection
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-black/70">
            Premium heavy cotton, relaxed drop-shoulder fits designed for modern kids.
          </p>
        </header>

        <div className="mt-6 flex flex-col gap-4 border border-black/10 bg-white p-3 sm:p-4">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">
            Search
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search graphic tees, plain tees, colors..."
              className="mt-2 w-full border border-black/15 bg-[#fdfbf9] px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-neutral-900 outline-none"
            />
          </label>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Filter by Gender</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGenderFilter(option.value)}
                    className={`border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      genderFilter === option.value ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-black/15 text-neutral-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="border border-black/15 bg-[#fdfbf9] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-800 hover:border-neutral-900"
              >
                Size Guide
              </button>

              <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">
                Sort
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as SortOption)}
                  className="border border-black/15 bg-[#fdfbf9] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-neutral-900 outline-none"
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

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/55">Filter by Size</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSizeFilter('all')}
                className={`border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  sizeFilter === 'all' ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-black/15 text-neutral-800'
                }`}
              >
                All
              </button>
              {KIDS_OVERSIZED_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSizeFilter(size)}
                  className={`border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                    sizeFilter === size ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-black/15 text-neutral-800'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/60">
            {visibleProducts.length} products
          </p>
        </div>

        {visibleProducts.length ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
            {visibleProducts.map((product, index) => (
              <KidsProductCard
                key={product.id}
                product={product}
                priority={index < 4}
                wished={isInWishlist(String(product.id))}
                onToggleWishlist={handleToggleWishlist}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 border border-dashed border-black/20 px-4 py-10 text-center">
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">No matching styles</p>
            <button
              type="button"
              onClick={() => {
                setGenderFilter('all')
                setSizeFilter('all')
                setSortBy('newest')
                setSearchQuery('')
              }}
              className="ui-interactive mt-4 inline-flex border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {sizeGuideOpen ? <KidsSizeGuideModal onClose={() => setSizeGuideOpen(false)} /> : null}
    </section>
  )
}
