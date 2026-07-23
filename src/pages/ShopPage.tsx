import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import { type ShopProduct } from '../data/shopData'
import {
  subscribeToProducts,
  type AdminProduct,
} from '../firebase/adminService'
import { parseBDT } from '../utils/currency'
import { getManagedImageEntries } from '../utils/media'
import { getWishlistKeys, toWishlistKey } from '../utils/wishlist'

type ShopSegment = 'all' | 'women' | 'men' | 'kids'
type SortOption = 'popular' | 'new' | 'price-low' | 'price-high'

interface ProductFilters {
  inStockOnly: boolean
  newOnly: boolean
}

interface SegmentTab {
  key: ShopSegment
  label: string
  path: string
}

const segmentTabs: SegmentTab[] = [
  { key: 'women', label: 'Women', path: '/women' },
  { key: 'men', label: 'Men', path: '/men' },
  { key: 'kids', label: 'Kids', path: '/kids' },
  { key: 'all', label: 'All', path: '/shop' },
]

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'popular', label: 'Popular' },
  { value: 'new', label: 'New' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
]

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function mapProduct(product: AdminProduct): ShopProduct {
  const imageEntries = getManagedImageEntries(product, 1)

  return {
    id: product.id,
    slug: slugify(product.name),
    name: product.name,
    price: product.price,
    category: product.category,
    image: imageEntries[0]?.url ?? '',
    description: product.description,
    galleryImages: imageEntries.map((entry) => entry.url).filter(Boolean),
    stock: product.stock,
    featured: product.featured,
    newArrival: product.newArrival,
    discount: product.stock <= 5 ? 'Low stock' : undefined,
  }
}

function normalizeSegmentFromPath(pathname: string): ShopSegment {
  if (pathname === '/women') {
    return 'women'
  }

  if (pathname === '/men') {
    return 'men'
  }

  if (pathname === '/kids') {
    return 'kids'
  }

  return 'all'
}

function normalizeSegmentFromQuery(rawSegment: string | null): ShopSegment {
  if (!rawSegment) {
    return 'all'
  }

  const value = rawSegment.trim().toLowerCase()
  if (value === 'women') {
    return 'women'
  }

  if (value === 'men') {
    return 'men'
  }

  if (value === 'kids') {
    return 'kids'
  }

  return 'all'
}

function segmentMatchesProduct(segment: ShopSegment, category: string) {
  if (segment === 'all') {
    return true
  }

  const normalizedCategory = category.trim().toLowerCase()

  if (segment === 'women') {
    return ['womens', 'women', 'dress', 'western', 'couples'].some((token) => normalizedCategory.includes(token))
  }

  if (segment === 'men') {
    return ['mens', 'men', 'shirt', 'denim', 'oversized', 'unisex'].some((token) => normalizedCategory.includes(token))
  }

  return ['kids', 'kid', 'children'].some((token) => normalizedCategory.includes(token))
}

function segmentHeading(segment: ShopSegment) {
  if (segment === 'women') {
    return {
      title: 'Women',
      description: 'Editorial silhouettes and daily essentials tailored for modern women.',
    }
  }

  if (segment === 'men') {
    return {
      title: 'Men',
      description: 'Refined men\'s edits focused on comfort, fit, and repeat wear.',
    }
  }

  if (segment === 'kids') {
    return {
      title: 'Kids',
      description: 'Soft, practical, and polished pieces for active little wardrobes.',
    }
  }

  return {
    title: 'Shop All',
    description: 'Explore all available products across women, men, and kids.',
  }
}

function getLegacyCategorySlug(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  if (parts[0] !== 'shop' || parts.length < 2) {
    return null
  }

  const slug = parts[1]?.trim().toLowerCase() ?? ''
  if (!slug || slug === 'new-arrivals') {
    return null
  }

  return slug
}

export default function ShopPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)

  const [products, setProducts] = useState<ShopProduct[]>([])
  const [ready, setReady] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [filters, setFilters] = useState<ProductFilters>({
    inStockOnly: false,
    newOnly: false,
  })
  const [wishlistKeys, setWishlistKeys] = useState<string[]>([])

  const querySegment = normalizeSegmentFromQuery(searchParams.get('segment'))
  const searchQuery = (searchParams.get('q') ?? '').trim().toLowerCase()
  const wishlistOnly = searchParams.get('wishlist') === '1'
  const activeSegment = normalizeSegmentFromPath(location.pathname) !== 'all'
    ? normalizeSegmentFromPath(location.pathname)
    : querySegment
  const legacyCategorySlug = getLegacyCategorySlug(location.pathname)

  useEffect(() => {
    const unsubscribeProducts = subscribeToProducts((nextProducts) => {
      setProducts(nextProducts.map(mapProduct))
      setReady(true)
    })

    return () => {
      unsubscribeProducts()
    }
  }, [])

  useEffect(() => {
    if (!isFilterSheetOpen) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isFilterSheetOpen])

  useEffect(() => {
    const syncWishlist = () => setWishlistKeys(getWishlistKeys())
    syncWishlist()
    window.addEventListener('wishlist:updated', syncWishlist)
    return () => window.removeEventListener('wishlist:updated', syncWishlist)
  }, [])

  const heading = segmentHeading(activeSegment)
  const legacyHeading = legacyCategorySlug
    ? {
      title: legacyCategorySlug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
      description: 'Category listing curated for quick mobile browsing.',
    }
    : null

  const visibleProducts = useMemo(() => {
    const bySegment = products.filter((product) => segmentMatchesProduct(activeSegment, product.category))

    const byLegacyCategory = legacyCategorySlug
      ? bySegment.filter((product) => product.category.trim().toLowerCase().includes(legacyCategorySlug))
      : bySegment

    const byFilter = byLegacyCategory.filter((product) => {
      if (filters.inStockOnly && (product.stock ?? 0) <= 0) {
        return false
      }

      if (filters.newOnly && !product.newArrival) {
        return false
      }

      return true
    })

    const bySearch = searchQuery
      ? byFilter.filter((product) => {
        const searchableText = `${product.name} ${product.description} ${product.category}`.toLowerCase()
        return searchableText.includes(searchQuery)
      })
      : byFilter

    const byWishlist = wishlistOnly
      ? bySearch.filter((product) => wishlistKeys.includes(toWishlistKey(product)))
      : bySearch

    if (sortBy === 'new') {
      return [...byWishlist].sort(
        (left, right) => Number(Boolean(right.newArrival)) - Number(Boolean(left.newArrival)),
      )
    }

    if (sortBy === 'price-low') {
      return [...byWishlist].sort((left, right) => parseBDT(left.price) - parseBDT(right.price))
    }

    if (sortBy === 'price-high') {
      return [...byWishlist].sort((left, right) => parseBDT(right.price) - parseBDT(left.price))
    }

    return [...byWishlist].sort(
      (left, right) =>
        Number(Boolean(right.featured)) - Number(Boolean(left.featured)) ||
        (right.stock ?? 0) - (left.stock ?? 0),
    )
  }, [
    activeSegment,
    filters.inStockOnly,
    filters.newOnly,
    legacyCategorySlug,
    products,
    searchQuery,
    sortBy,
    wishlistKeys,
    wishlistOnly,
  ])

  return (
    <section className="bg-white px-3.5 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-20 lg:pt-10">
      <Container>
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">SHIS Listing</p>
            <h1 className="mt-1 text-h1 text-black">{legacyHeading?.title ?? heading.title}</h1>
            <p className="mt-3 max-w-2xl text-body text-black/72">{legacyHeading?.description ?? heading.description}</p>
          </div>

          <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {segmentTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setFilters({ inStockOnly: false, newOnly: false })
                  navigate(tab.path)
                }}
                className={`ui-interactive whitespace-nowrap border-b px-0.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  activeSegment === tab.key
                    ? 'border-black text-black'
                    : 'border-transparent text-black/65 hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <Link
              to="/sale"
              className="ui-interactive whitespace-nowrap border-b border-transparent px-0.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/65 hover:text-black"
            >
              Sale
            </Link>
            <Link
              to="/shop/new-arrivals"
              className="ui-interactive whitespace-nowrap border-b border-transparent px-0.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/65 hover:text-black"
            >
              New Arrivals
            </Link>
          </div>

          <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">
              {visibleProducts.length} products
            </p>

            <div className="hidden items-center gap-2 sm:flex">
              <label htmlFor="desktop-sort" className="text-caption uppercase tracking-[0.12em] text-black/55">
                Sort
              </label>
              <select
                id="desktop-sort"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="border border-black/20 px-2.5 py-1.5 text-xs text-black outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              className="ui-interactive border border-black/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-black sm:hidden"
            >
              Filter & Sort
            </button>
          </div>

          {searchQuery || wishlistOnly ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-black/10 pb-2">
              {searchQuery ? (
                <p className="text-caption uppercase tracking-[0.12em] text-black/55">
                  Search: "{searchQuery}"
                </p>
              ) : null}
              {wishlistOnly ? (
                <Link
                  to="/shop"
                  className="ui-interactive border border-black/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/80 hover:text-black"
                >
                  Wishlist only (clear)
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        {!ready ? (
          <div className="py-12 text-center text-sm text-black/55">Loading collection...</div>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-x-2 gap-y-5 sm:grid-cols-3 sm:gap-x-3 sm:gap-y-6 lg:grid-cols-4 lg:gap-x-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {ready && visibleProducts.length === 0 ? (
          <div className="mt-8 border border-dashed border-black/20 px-4 py-10 text-center">
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">No products found</p>
            <p className="mt-2 text-sm text-black/70">
              {wishlistOnly
                ? 'Your wishlist is empty for this segment. Add products with the heart icon.'
                : 'Try another filter combination.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setFilters({ inStockOnly: false, newOnly: false })
                setSortBy('popular')
              }}
              className="ui-interactive mt-4 border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white"
            >
              Reset filters
            </button>
          </div>
        ) : null}
      </Container>

      <AnimateMobileSheet
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </section>
  )
}

function AnimateMobileSheet({
  open,
  onClose,
  sortBy,
  onSortChange,
  filters,
  onFiltersChange,
}: {
  open: boolean
  onClose: () => void
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
  filters: ProductFilters
  onFiltersChange: (value: ProductFilters) => void
}) {
  return (
    <motion.div>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close filter panel"
            className="fixed inset-0 z-40 bg-black/40 sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.22 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-xl border-t border-black/15 bg-white px-4 pb-6 pt-4 sm:hidden"
          >
            <div className="mx-auto max-w-7xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-black">Filter & Sort</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="ui-interactive text-xs uppercase tracking-[0.12em] text-black/65 hover:text-black"
                >
                  Close
                </button>
              </div>

              <div>
                <p className="text-caption uppercase tracking-[0.12em] text-black/55">Sort by</p>
                <div className="mt-2 grid gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onSortChange(option.value)}
                      className={`ui-interactive flex items-center justify-between border px-3 py-2 text-sm ${
                        sortBy === option.value
                          ? 'border-black bg-black text-white'
                          : 'border-black/15 text-black hover:bg-black/5'
                      }`}
                    >
                      <span>{option.label}</span>
                      {sortBy === option.value ? <span aria-hidden>✓</span> : null}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-caption uppercase tracking-[0.12em] text-black/55">Filters</p>
                <div className="mt-2 grid gap-2">
                  <label className="flex items-center justify-between border border-black/15 px-3 py-2 text-sm text-black">
                    <span>In stock only</span>
                    <input
                      type="checkbox"
                      checked={filters.inStockOnly}
                      onChange={(event) =>
                        onFiltersChange({
                          ...filters,
                          inStockOnly: event.target.checked,
                        })
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between border border-black/15 px-3 py-2 text-sm text-black">
                    <span>New arrivals only</span>
                    <input
                      type="checkbox"
                      checked={filters.newOnly}
                      onChange={(event) =>
                        onFiltersChange({
                          ...filters,
                          newOnly: event.target.checked,
                        })
                      }
                    />
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="ui-interactive mt-5 w-full border border-black bg-black py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-white"
              >
                Apply
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </motion.div>
  )
}
