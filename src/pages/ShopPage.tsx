import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import { type ShopProduct } from '../data/shopData'
import { googleAnalytics } from '../services/googleAnalytics'
import {
  subscribeToProducts,
  type AdminProduct,
} from '../firebase/adminService'
import { parseBDT } from '../utils/currency'
import { getManagedImageEntries } from '../utils/media'
import {
  type ShopSegment,
  SEGMENT_TABS,
  getSegmentDescription,
  getSubcategoriesForSegment,
  matchesSegmentByAlias,
  matchesSubcategoryByAlias,
  resolveCanonicalSubcategorySlug,
} from '../data/categoryTaxonomy'

type SortOption = 'popular' | 'new' | 'price-low' | 'price-high'

interface ProductFilters {
  inStockOnly: boolean
  newOnly: boolean
}

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
  if (value === 'women' || value === 'womens') {
    return 'women'
  }

  if (value === 'men' || value === 'mens') {
    return 'men'
  }

  if (value === 'kids' || value === 'kid') {
    return 'kids'
  }

  return 'all'
}

function normalizeSubcategoryFromQuery(
  segment: ShopSegment,
  rawSubcategory: string | null,
) {
  if (!rawSubcategory) {
    return 'all'
  }

  const canonical = resolveCanonicalSubcategorySlug(rawSubcategory)
  if (!canonical || canonical === 'all') {
    return 'all'
  }

  if (segment === 'all') {
    const hasMatchInAnySegment = (['women', 'men', 'kids'] as Array<Exclude<ShopSegment, 'all'>>)
      .some((segmentKey) => getSubcategoriesForSegment(segmentKey).some((item) => item.slug === canonical))

    return hasMatchInAnySegment ? canonical : 'all'
  }

  const segmentSubcategories = getSubcategoriesForSegment(segment)
  const isKnownSubcategory = segmentSubcategories.some((item) => item.slug === canonical)

  return isKnownSubcategory ? canonical : 'all'
}

function segmentMatchesProduct(segment: ShopSegment, category: string) {
  return matchesSegmentByAlias(segment, category)
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

function getLegacySegmentFromSlug(slug: string): Exclude<ShopSegment, 'all'> | null {
  if (slug === 'women' || slug === 'womens') {
    return 'women'
  }

  if (slug === 'men' || slug === 'mens') {
    return 'men'
  }

  if (slug === 'kids' || slug === 'kid') {
    return 'kids'
  }

  return null
}

function getSegmentForCanonicalSubcategory(subcategorySlug: string): Exclude<ShopSegment, 'all'> | null {
  const matchedSegments = (['women', 'men', 'kids'] as Array<Exclude<ShopSegment, 'all'>>).filter((segmentKey) =>
    getSubcategoriesForSegment(segmentKey).some((item) => item.slug === subcategorySlug),
  )

  if (matchedSegments.length === 1) {
    return matchedSegments[0]
  }

  return null
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
  const lastTrackedListStateRef = useRef('')
  const lastTrackedEmptyStateRef = useRef('')
  const listingStateSnapshotRef = useRef('')
  const didTrackInitialListingStateRef = useRef(false)

  const querySegment = normalizeSegmentFromQuery(searchParams.get('segment'))
  const rawQuerySubcategory = searchParams.get('sub')
  const pathSegment = normalizeSegmentFromPath(location.pathname)
  const activeSegment = pathSegment !== 'all'
    ? pathSegment
    : querySegment
  const legacyCategorySlug = getLegacyCategorySlug(location.pathname)
  const legacySegment = legacyCategorySlug ? getLegacySegmentFromSlug(legacyCategorySlug) : null
  const legacySubcategory = legacyCategorySlug && !legacySegment
    ? resolveCanonicalSubcategorySlug(legacyCategorySlug)
    : null
  const inferredLegacySegment = legacySubcategory ? getSegmentForCanonicalSubcategory(legacySubcategory) : null
  const effectiveSegment = legacySegment ?? inferredLegacySegment ?? activeSegment
  const segmentSubcategories = getSubcategoriesForSegment(effectiveSegment)
  const activeSubcategory = normalizeSubcategoryFromQuery(effectiveSegment, rawQuerySubcategory)
  const effectiveSubcategory = legacySubcategory || activeSubcategory

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
    const params = new URLSearchParams(location.search)
    let shouldReplace = false

    const replaceWithCanonical = (
      pathname: string,
      search: string,
      reason: string,
    ) => {
      googleAnalytics.trackEvent('listing_query_normalized', {
        reason,
        from_path: location.pathname,
        from_search: location.search,
        to_path: pathname,
        to_search: search,
        segment: effectiveSegment,
        subcategory: effectiveSubcategory,
      })

      navigate(
        {
          pathname,
          search,
        },
        { replace: true },
      )
    }

    const rawSegment = searchParams.get('segment')?.trim().toLowerCase() ?? ''
    if (pathSegment !== 'all') {
      if (rawSegment) {
        params.delete('segment')
        shouldReplace = true
      }
    } else if (querySegment === 'all') {
      if (rawSegment) {
        params.delete('segment')
        shouldReplace = true
      }
    } else if (rawSegment !== querySegment) {
      params.set('segment', querySegment)
      shouldReplace = true
    }

    if (legacyCategorySlug && location.pathname.startsWith('/shop/')) {
      if (legacySegment) {
        replaceWithCanonical(
          `/${legacySegment}`,
          params.toString() ? `?${params.toString()}` : '',
          'legacy-segment-route',
        )
        return
      }

      if (legacySubcategory && inferredLegacySegment) {
        params.set('sub', legacySubcategory)
        replaceWithCanonical(
          `/${inferredLegacySegment}`,
          `?${params.toString()}`,
          'legacy-subcategory-route',
        )
        return
      }
    }

    const rawSub = rawQuerySubcategory?.trim().toLowerCase() ?? ''
    if (!rawSub) {
      if (!shouldReplace) {
        return
      }

      replaceWithCanonical(
        location.pathname,
        params.toString() ? `?${params.toString()}` : '',
        'segment-query-canonicalization',
      )
      return
    }

    let normalizationReason = ''
    if (activeSubcategory === 'all') {
      params.delete('sub')
      normalizationReason = 'invalid-sub-for-segment'
    } else if (rawSub !== activeSubcategory) {
      params.set('sub', activeSubcategory)
      normalizationReason = 'legacy-sub-to-canonical-sub'
    } else if (!shouldReplace) {
      return
    }

    replaceWithCanonical(
      location.pathname,
      params.toString() ? `?${params.toString()}` : '',
      normalizationReason || 'mixed-query-canonicalization',
    )
  }, [
    activeSubcategory,
    effectiveSegment,
    effectiveSubcategory,
    inferredLegacySegment,
    legacyCategorySlug,
    legacySegment,
    legacySubcategory,
    location.pathname,
    location.search,
    navigate,
    rawQuerySubcategory,
  ])

  const heading = getSegmentDescription(effectiveSegment)
  const legacyHeading = legacyCategorySlug
    ? {
      title: legacyCategorySlug.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
      description: 'Category listing curated for quick mobile browsing.',
    }
    : null

  const bySegment = products.filter((product) => segmentMatchesProduct(effectiveSegment, product.category))

  const bySubcategory = effectiveSubcategory === 'all'
    ? bySegment
    : bySegment.filter((product) =>
      matchesSubcategoryByAlias(effectiveSegment, effectiveSubcategory, product.category),
    )

  const byFilter = bySubcategory.filter((product) => {
    if (filters.inStockOnly && (product.stock ?? 0) <= 0) {
      return false
    }

    if (filters.newOnly && !product.newArrival) {
      return false
    }

    return true
  })

  const visibleProducts = (() => {
    const sorted = [...byFilter]
    if (sortBy === 'new') {
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
  })()

  useEffect(() => {
    if (!ready || !visibleProducts.length) {
      lastTrackedListStateRef.current = ''
      return
    }

    const itemListId = `${effectiveSegment}:${effectiveSubcategory}`
    const itemListName = legacyHeading?.title ?? heading.title
    const visibleProductIds = visibleProducts.slice(0, 12).map((product) => String(product.id))
    const listStateKey = `${itemListId}|${visibleProductIds.join(',')}`

    if (lastTrackedListStateRef.current === listStateKey) {
      return
    }

    lastTrackedListStateRef.current = listStateKey

    googleAnalytics.viewItemList({
      item_list_id: itemListId,
      item_list_name: itemListName,
      items: visibleProducts.slice(0, 12).map((product) => ({
        item_id: String(product.id),
        item_name: product.name,
        item_category: product.category,
        price: parseBDT(product.price),
        quantity: 1,
      })),
    })
  }, [effectiveSegment, effectiveSubcategory, heading.title, legacyHeading?.title, ready, visibleProducts])

  useEffect(() => {
    if (!ready || visibleProducts.length > 0) {
      lastTrackedEmptyStateRef.current = ''
      return
    }

    const emptyStateKey = [
      effectiveSegment,
      effectiveSubcategory,
      sortBy,
      filters.inStockOnly ? 'stock' : 'all-stock',
      filters.newOnly ? 'new' : 'all-new',
      location.pathname,
      location.search,
    ].join('|')

    if (lastTrackedEmptyStateRef.current === emptyStateKey) {
      return
    }

    lastTrackedEmptyStateRef.current = emptyStateKey

    googleAnalytics.trackEvent('listing_empty_state', {
      segment: effectiveSegment,
      subcategory: effectiveSubcategory,
      sort: sortBy,
      in_stock_only: filters.inStockOnly,
      new_only: filters.newOnly,
      path: location.pathname,
      search: location.search,
    })
  }, [
    effectiveSegment,
    effectiveSubcategory,
    filters.inStockOnly,
    filters.newOnly,
    location.pathname,
    location.search,
    ready,
    sortBy,
    visibleProducts.length,
  ])

  useEffect(() => {
    if (!ready) {
      return
    }

    const listingStateSnapshot = [
      effectiveSegment,
      effectiveSubcategory,
      sortBy,
      filters.inStockOnly ? 'stock' : 'all-stock',
      filters.newOnly ? 'new' : 'all-new',
      location.pathname,
      location.search,
    ].join('|')

    if (!didTrackInitialListingStateRef.current) {
      didTrackInitialListingStateRef.current = true
      listingStateSnapshotRef.current = listingStateSnapshot
      return
    }

    if (listingStateSnapshotRef.current === listingStateSnapshot) {
      return
    }

    listingStateSnapshotRef.current = listingStateSnapshot

    googleAnalytics.trackEvent('listing_state_changed', {
      segment: effectiveSegment,
      subcategory: effectiveSubcategory,
      sort: sortBy,
      in_stock_only: filters.inStockOnly,
      new_only: filters.newOnly,
      path: location.pathname,
      search: location.search,
    })
  }, [
    effectiveSegment,
    effectiveSubcategory,
    filters.inStockOnly,
    filters.newOnly,
    location.pathname,
    location.search,
    ready,
    sortBy,
  ])

  const navigateWithSubcategory = (subcategory: string) => {
    const params = new URLSearchParams(location.search)
    if (subcategory === 'all') {
      params.delete('sub')
    } else {
      params.set('sub', subcategory)
    }

    navigate({
      pathname: location.pathname,
      search: params.toString() ? `?${params.toString()}` : '',
    })
  }

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
            {SEGMENT_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setFilters({ inStockOnly: false, newOnly: false })
                  navigate(tab.path)
                }}
                className={`ui-interactive whitespace-nowrap border-b px-0.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  effectiveSegment === tab.key
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

          {segmentSubcategories.length ? (
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => navigateWithSubcategory('all')}
                className={`ui-interactive whitespace-nowrap border-b px-0.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                  activeSubcategory === 'all'
                    ? 'border-black text-black'
                    : 'border-transparent text-black/65 hover:text-black'
                }`}
              >
                All
              </button>
              {segmentSubcategories.map((subcategory) => (
                <button
                  key={subcategory.slug}
                  type="button"
                  onClick={() => navigateWithSubcategory(subcategory.slug)}
                  className={`ui-interactive whitespace-nowrap border-b px-0.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                    activeSubcategory === subcategory.slug
                      ? 'border-black text-black'
                      : 'border-transparent text-black/65 hover:text-black'
                  }`}
                >
                  {subcategory.label}
                </button>
              ))}
            </div>
          ) : null}

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
            <p className="mt-2 text-sm text-black/70">Try another filter combination.</p>
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
