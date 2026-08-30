import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AarongProductCard from '../components/shop/AarongProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import {
  KIDS_COLOR_LABELS,
  KIDS_OVERSIZED_SIZES,
  mergeKidsOversizedTeeCatalog,
  type KidsGenderCategory,
  type KidsOversizedTeeProduct,
} from '../data/kidsOversizedTeeCollection'
import { subscribeToProducts } from '../firebase/adminService'
import { useListingWishlist } from '../hooks/useListingWishlist'
import { parseBDT } from '../utils/currency'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { applySeoMetadata, buildProductSchema } from '../utils/seo'

const KidsSizeGuideModal = lazy(() => import('../components/kids/KidsSizeGuideModal'))
const prefetchKidsProductDetail = () => import('./KidsProductDetailPage')

type GenderFilter = 'all' | KidsGenderCategory
type SortOption = 'newest' | 'price-low' | 'price-high'

const SITE_URL = 'https://www.shisfashion.com'
const KIDS_LISTING_HERO = `/collections/kid-hero/${encodeURIComponent('Shis Fashion Streetwear Editorial.png')}`
const KIDS_LISTING_HERO_BACKGROUND = '#c5a383'

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
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
]

function parseKidsGenderParam(raw: string | null): GenderFilter {
  const value = (raw ?? '').trim().toLowerCase()
  if (value === 'kids boy' || value === 'boy' || value === 'boys') {
    return 'Kids Boy'
  }
  if (value === 'kids girl' || value === 'girl' || value === 'girls') {
    return 'Kids Girl'
  }
  if (value === 'unisex') {
    return 'Unisex'
  }
  return 'all'
}

export default function KidsOversizedTeeCollectionPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const genderFilter = parseKidsGenderParam(new URLSearchParams(location.search).get('gender'))
  const [products, setProducts] = useState<KidsOversizedTeeProduct[]>(() => mergeKidsOversizedTeeCatalog([]))
  const [sizeFilter, setSizeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()

  const setGenderFilter = (next: GenderFilter) => {
    const params = new URLSearchParams(location.search)
    if (next === 'all') {
      params.delete('gender')
    } else {
      params.set('gender', next)
    }
    const search = params.toString()
    navigate(
      { pathname: location.pathname, search: search ? `?${search}` : '' },
      { replace: true },
    )
  }

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => {
      setProducts(mergeKidsOversizedTeeCatalog(nextProducts.map((product) => mapAdminProductToShopProduct(product))))
    })

    return unsubscribe
  }, [])

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((product) => {
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
  }, [genderFilter, products, searchQuery, sizeFilter, sortBy])

  const activeFilterCount = Number(sizeFilter !== 'all') + Number(Boolean(searchQuery.trim()))

  useEffect(() => {
    const canonicalPath = '/kids'

    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Kids Oversized Tee Collection',
      url: `${SITE_URL}${canonicalPath}`,
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/kids/${product.slug}`,
        name: product.name,
        image: product.image.startsWith('http') ? product.image : `${SITE_URL}${product.image}`,
      })),
    }

    const productSchemas = products.map((product) =>
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
  }, [products])

  useEffect(() => {
    if (!sizeGuideOpen && !filterDrawerOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [sizeGuideOpen, filterDrawerOpen])

  return (
    <section className="bg-white pb-24">
      <section
        className="relative z-0 isolate w-full overflow-hidden"
        style={{ backgroundColor: KIDS_LISTING_HERO_BACKGROUND }}
        aria-label="Kids collection banner"
      >
        <h1 className="sr-only">Kids Collection</h1>
        <img
          src={KIDS_LISTING_HERO}
          alt="Shis Fashion Streetwear Editorial — Kids Collection"
          width={1536}
          height={1024}
          className="block h-auto w-full object-contain object-center"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <nav aria-label="Breadcrumb" className="pt-6 text-[12px] font-normal tracking-wide text-neutral-400">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link to="/" className="transition-colors hover:text-neutral-700">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-neutral-300">
              /
            </li>
            <li>
              <Link to="/kids" className="transition-colors hover:text-neutral-700">
                Kids
              </Link>
            </li>
            <li aria-hidden className="text-neutral-300">
              /
            </li>
            <li className="text-neutral-500">Oversized Tee</li>
          </ol>
        </nav>

        <div id="kids-grid" className="scroll-mt-24 py-8 sm:py-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900 sm:text-xl">Shop</h2>
            </div>

            <div className="flex items-center gap-1 self-end sm:gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen((open) => !open)}
                className={`inline-flex h-9 w-9 items-center justify-center text-neutral-500 transition-colors hover:text-neutral-900 ${
                  searchOpen || searchQuery ? 'text-neutral-900' : ''
                }`}
                aria-label="Search"
                aria-expanded={searchOpen}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </button>

              <label className="sr-only" htmlFor="kids-sort">
                Sort by
              </label>
              <select
                id="kids-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="h-9 max-w-[9.5rem] appearance-none bg-transparent pr-5 text-xs font-medium text-neutral-600 outline-none hover:text-neutral-900"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%737373' stroke-width='1.5'%3E%3Cpath d='m3 4.5 3 3 3-3'/%3E%3C/svg%3E\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.15rem center',
                }}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className="relative inline-flex h-9 items-center gap-1.5 px-2 text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-900"
                aria-label="Open filters"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 6h16" />
                  <path d="M7 12h10" />
                  <path d="M10 18h4" />
                </svg>
                Filter
                {activeFilterCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="hidden h-9 px-2 text-xs font-medium text-neutral-500 underline-offset-4 transition-colors hover:text-neutral-900 hover:underline sm:inline-flex sm:items-center"
              >
                Size Guide
              </button>
            </div>
          </div>

          {searchOpen ? (
            <div className="mt-4">
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search kids styles…"
                autoFocus
                className="w-full border-0 border-b border-neutral-200 bg-transparent py-2.5 text-[16px] text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
              />
            </div>
          ) : null}

          <div className="mt-5 -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {GENDER_OPTIONS.map((option) => {
              const active = genderFilter === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGenderFilter(option.value)}
                  className={`shrink-0 px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'text-neutral-900 underline decoration-neutral-900 decoration-1 underline-offset-8'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          {visibleProducts.length ? (
            <ProductListingGrid className="mt-8">
              {visibleProducts.map((product, index) => (
                <AarongProductCard
                  key={product.id}
                  product={product}
                  href={`/kids/${product.slug}`}
                  prefetchModule={prefetchKidsProductDetail}
                  priority={index < 4}
                  isInWishlist={isInWishlist(String(product.id))}
                  onToggleWishlist={(item) => handleToggleWishlist(item as KidsOversizedTeeProduct)}
                />
              ))}
            </ProductListingGrid>
          ) : (
            <div className="mt-16 py-10 text-center">
              <p className="text-sm text-neutral-500">No matching styles</p>
              <button
                type="button"
                onClick={() => {
                  setGenderFilter('all')
                  setSizeFilter('all')
                  setSortBy('newest')
                  setSearchQuery('')
                }}
                className="mt-4 text-xs font-medium text-neutral-900 underline underline-offset-4"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>

      {filterDrawerOpen ? (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close filters"
            onClick={() => setFilterDrawerOpen(false)}
          />
          <aside className="luxury-sheet-up absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto overscroll-contain bg-white px-4 pb-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))] pt-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-0 sm:h-full sm:max-h-none sm:w-[min(22rem,100vw)] sm:border-l sm:border-neutral-100 sm:pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">Filters</p>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
              >
                Close
              </button>
            </div>

            <div className="mt-6">
              <p className="text-xs font-medium tracking-wide text-neutral-500">Size</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSizeFilter('all')}
                  className={`px-1 py-1.5 text-xs font-medium transition-colors ${
                    sizeFilter === 'all'
                      ? 'text-neutral-900 underline decoration-neutral-900 decoration-1 underline-offset-8'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  All
                </button>
                {KIDS_OVERSIZED_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSizeFilter(size)}
                    className={`px-1 py-1.5 text-xs font-medium transition-colors ${
                      sizeFilter === size
                        ? 'text-neutral-900 underline decoration-neutral-900 decoration-1 underline-offset-8'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setFilterDrawerOpen(false)
                setSizeGuideOpen(true)
              }}
              className="mt-6 text-xs font-medium text-neutral-700 underline underline-offset-4 sm:hidden"
            >
              Size Guide
            </button>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSizeFilter('all')
                  setSearchQuery('')
                }}
                className="flex-1 py-3 text-xs font-medium text-neutral-600"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(false)}
                className="flex-1 bg-neutral-900 py-3 text-xs font-semibold text-white"
              >
                Show {visibleProducts.length} results
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {sizeGuideOpen ? (
        <Suspense fallback={null}>
          <KidsSizeGuideModal onClose={() => setSizeGuideOpen(false)} />
        </Suspense>
      ) : null}
    </section>
  )
}
