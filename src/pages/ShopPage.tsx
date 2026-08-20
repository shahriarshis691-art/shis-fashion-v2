import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import { type ShopProduct } from '../data/shopData'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { googleAnalytics } from '../services/googleAnalytics'
import { incidentAlerts } from '../services/incidentAlerts'
import { metaPixel } from '../services/metaPixel'
import { useWishlist } from '../context/WishlistContext'
import {
  subscribeToProducts,
  type AdminProduct,
} from '../firebase/adminService'
import { parseBDT } from '../utils/currency'
import {
  type ShopSegment,
  SEGMENT_TABS,
  getSegmentDescription,
  getSubcategoriesForSegment,
  matchesSegmentByAlias,
  matchesSubcategoryByAlias,
  resolveCanonicalSubcategorySlug,
  getDedicatedListingFromPath,
  getDedicatedListingPath,
} from '../data/categoryTaxonomy'

type SortOption = 'popular' | 'new' | 'price-low' | 'price-high'

const LISTING_PAGE_SIZE = 24

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

function normalizeProductCategory(category: string) {
  const raw = category.trim().toLowerCase()
  if (!raw) {
    return raw
  }

  const canonical = resolveCanonicalSubcategorySlug(raw)
  if (canonical !== raw) {
    return canonical
  }

  if (/(kids?|children|child|baby|babies|toddler|mini)/.test(raw)) {
    return 'kids'
  }

  return raw
}

function mapProduct(product: AdminProduct): ShopProduct {
  return mapAdminProductToShopProduct(product, {
    category: normalizeProductCategory(product.category),
    discount: product.stock <= 5 ? 'Low stock' : undefined,
  })
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
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const [products, setProducts] = useState<ShopProduct[]>([])
  const [ready, setReady] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [filters, setFilters] = useState<ProductFilters>({
    inStockOnly: false,
    newOnly: false,
  })
  const [loadedByKey, setLoadedByKey] = useState<Record<string, number>>({})
  const lastTrackedListStateRef = useRef('')
  const lastTrackedEmptyStateRef = useRef('')
  const emptyStateKeysSeenRef = useRef<Set<string>>(new Set())
  const didReportEmptyStateSpikeRef = useRef(false)
  const listingStateSnapshotRef = useRef('')
  const didTrackInitialListingStateRef = useRef(false)

  const querySegment = normalizeSegmentFromQuery(searchParams.get('segment'))
  const rawQuerySubcategory = searchParams.get('sub')
  const searchQuery = searchParams.get('q')?.trim() ?? ''
  const dedicatedListing = getDedicatedListingFromPath(location.pathname)
  const pathSegment = dedicatedListing?.segment ?? normalizeSegmentFromPath(location.pathname)
  const activeSegment = pathSegment !== 'all'
    ? pathSegment
    : querySegment
  const legacyCategorySlug = getLegacyCategorySlug(location.pathname)
  const legacySegment = legacyCategorySlug ? getLegacySegmentFromSlug(legacyCategorySlug) : null
  const legacySubcategory = legacyCategorySlug && !legacySegment
    ? resolveCanonicalSubcategorySlug(legacyCategorySlug)
    : null
  const inferredLegacySegment = legacySubcategory ? getSegmentForCanonicalSubcategory(legacySubcategory) : null
  const effectiveSegment = dedicatedListing?.segment ?? legacySegment ?? inferredLegacySegment ?? activeSegment
  const segmentSubcategories = getSubcategoriesForSegment(effectiveSegment)
  const activeSubcategory = dedicatedListing?.subcategory ?? normalizeSubcategoryFromQuery(effectiveSegment, rawQuerySubcategory)
  const effectiveSubcategory = dedicatedListing?.subcategory ?? (legacySubcategory || activeSubcategory)
  const listingKey = `${effectiveSegment}|${effectiveSubcategory}|${sortBy}|${filters.inStockOnly}|${filters.newOnly}|${searchQuery.toLowerCase()}|${location.pathname}`

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

    const rawSegment = params.get('segment')?.trim().toLowerCase() ?? ''
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
        const dedicatedPath = getDedicatedListingPath(inferredLegacySegment, legacySubcategory)
        params.set('sub', legacySubcategory)
        replaceWithCanonical(
          dedicatedPath ?? `/${inferredLegacySegment}`,
          dedicatedPath ? '' : `?${params.toString()}`,
          dedicatedPath ? 'dedicated-collection-route' : 'legacy-subcategory-route',
        )
        return
      }
    }

    const dedicatedPath = getDedicatedListingPath(effectiveSegment, effectiveSubcategory)
    if (dedicatedPath && location.pathname !== dedicatedPath) {
      replaceWithCanonical(dedicatedPath, '', 'dedicated-collection-route')
      return
    }

    if (dedicatedListing) {
      if (rawSegment) {
        params.delete('segment')
        shouldReplace = true
      }
      if (rawQuerySubcategory) {
        params.delete('sub')
        shouldReplace = true
      }
      if (!shouldReplace) {
        return
      }

      replaceWithCanonical(
        location.pathname,
        params.toString() ? `?${params.toString()}` : '',
        'dedicated-collection-canonical',
      )
      return
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
    dedicatedListing,
    effectiveSegment,
    effectiveSubcategory,
    inferredLegacySegment,
    legacyCategorySlug,
    legacySegment,
    legacySubcategory,
    location.pathname,
    location.search,
    navigate,
    pathSegment,
    querySegment,
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

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const bySearch = normalizedSearch
    ? byFilter.filter((product) => (
      [product.name, product.category, product.brand, product.description]
        .some((value) => (value ?? '').toLowerCase().includes(normalizedSearch))
    ))
    : byFilter

  const visibleProducts = (() => {
    const sorted = [...bySearch]
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

  const visibleCount = loadedByKey[listingKey] ?? LISTING_PAGE_SIZE
  const pagedProducts = visibleProducts.slice(0, visibleCount)
  const hasMoreProducts = visibleCount < visibleProducts.length

  useEffect(() => {
    if (!ready) {
      return
    }

    const isOversizedListing = effectiveSubcategory === 'oversized-tee' || location.pathname === '/shop/oversized-tee'
    if (!isOversizedListing) {
      return
    }

    metaPixel.trackViewContent({
      content_name: 'Oversized Tee Listing',
      content_ids: visibleProducts.slice(0, 8).map((product) => String(product.id)),
      content_type: 'product_group',
      value: visibleProducts[0] ? parseBDT(visibleProducts[0].price) : 0,
      currency: 'BDT',
      brand: 'SHIS Fashion',
    })
  }, [effectiveSubcategory, location.pathname, ready, visibleProducts])

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
        brand: product.brand,
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

    emptyStateKeysSeenRef.current.add(emptyStateKey)
    if (!didReportEmptyStateSpikeRef.current && emptyStateKeysSeenRef.current.size >= 3) {
      didReportEmptyStateSpikeRef.current = true
      googleAnalytics.trackEvent('listing_empty_state_spike', {
        unique_empty_states: emptyStateKeysSeenRef.current.size,
        latest_segment: effectiveSegment,
        latest_subcategory: effectiveSubcategory,
        path: location.pathname,
      })

      incidentAlerts.notify({
        source: 'listing-empty',
        message: `Repeated empty listing states detected (${emptyStateKeysSeenRef.current.size})`,
        fatal: false,
      })
    }
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

      const searchQuery = new URLSearchParams(location.search).get('q')?.trim() ?? ''
      const resultCount = visibleProducts.length
      const searchSuccess = resultCount > 0

      googleAnalytics.trackEvent('listing_view', {
        segment: effectiveSegment,
        subcategory: effectiveSubcategory,
        result_count: resultCount,
        search_query: searchQuery || undefined,
        search_success: searchSuccess,
        path: location.pathname,
        search: location.search,
      })

      if (searchQuery) {
        googleAnalytics.trackEvent('search_result_count', {
          search_term: searchQuery,
          result_count: resultCount,
          search_success: searchSuccess,
        })
      }

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
    visibleProducts.length,
  ])

  const navigateWithSubcategory = (subcategory: string) => {
    const dedicatedPath = getDedicatedListingPath(effectiveSegment, subcategory)
    if (dedicatedPath) {
      navigate(dedicatedPath)
      return
    }

    const params = new URLSearchParams(location.search)
    if (subcategory === 'all') {
      params.delete('sub')
    } else {
      params.set('sub', subcategory)
    }

    navigate({
      pathname: dedicatedListing ? `/${effectiveSegment}` : location.pathname,
      search: params.toString() ? `?${params.toString()}` : '',
    })
  }

  const clearSearch = () => {
    const params = new URLSearchParams(location.search)
    params.delete('q')
    navigate({
      pathname: location.pathname,
      search: params.toString() ? `?${params.toString()}` : '',
    })
  }

  const handleToggleWishlist = (product: ShopProduct) => {
    if (isInWishlist(String(product.id))) {
      removeFromWishlist(String(product.id))
      googleAnalytics.trackEvent('wishlist_removed', {
        item_id: String(product.id),
        item_name: product.name,
        item_category: product.category,
        value: parseBDT(product.price),
        currency: 'BDT',
        brand: product.brand,
      })
      return
    }

    addToWishlist(product)
    googleAnalytics.trackEvent('wishlist_added', {
      item_id: String(product.id),
      item_name: product.name,
      item_category: product.category,
      value: parseBDT(product.price),
      currency: 'BDT',
      brand: product.brand,
    })
  }

  return (
    <section className="bg-white px-3.5 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-20 lg:pt-10">
      <Container>
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">{dedicatedListing?.eyebrow ?? 'SHIS Listing'}</p>
            <h1 className="mt-1 text-h1 text-black">{dedicatedListing?.title ?? legacyHeading?.title ?? heading.title}</h1>
            <p className="mt-3 max-w-2xl text-body text-black/72">{dedicatedListing?.description ?? legacyHeading?.description ?? heading.description}</p>
            {searchQuery ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-sm text-black/70">Showing results for “{searchQuery}”</p>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="ui-interactive text-xs font-semibold uppercase tracking-[0.12em] text-black underline underline-offset-4"
                >
                  Clear search
                </button>
              </div>
            ) : null}
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
          <div className="mt-4 grid grid-cols-2 gap-x-1.5 gap-y-4 sm:mt-5 sm:grid-cols-3 sm:gap-x-2.5 sm:gap-y-5 lg:grid-cols-4 lg:gap-x-3.5 tight-mobile-grid product-grid" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`listing-skeleton-${index}`}>
                <div className="aspect-[4/5] animate-pulse bg-black/5" />
                <div className="mt-2 h-3 w-3/4 animate-pulse bg-black/5" />
                <div className="mt-1.5 h-3 w-1/3 animate-pulse bg-black/5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-x-1.5 gap-y-4 sm:mt-5 sm:grid-cols-3 sm:gap-x-2.5 sm:gap-y-5 lg:grid-cols-4 lg:gap-x-3.5 tight-mobile-grid product-grid">
            {pagedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onToggleWishlist={handleToggleWishlist}
                isInWishlist={isInWishlist(String(product.id))}
              />
            ))}
          </div>
        )}

        {ready && hasMoreProducts ? (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setLoadedByKey((current) => ({
                ...current,
                [listingKey]: (current[listingKey] ?? LISTING_PAGE_SIZE) + LISTING_PAGE_SIZE,
              }))}
              className="ui-interactive border border-black px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white"
            >
              Load more
            </button>
          </div>
        ) : null}

        {ready && visibleProducts.length === 0 ? (
          <div className="mt-8">
            <div className="border border-dashed border-black/20 px-4 py-6 text-center">
              <p className="text-caption uppercase tracking-[0.14em] text-black/55">{searchQuery ? 'No matching products' : 'No products found'}</p>
              <p className="mt-2 text-sm text-black/70">
                {searchQuery
                  ? `Nothing matched “${searchQuery}”. Try another search or browse the full collection.`
                  : dedicatedListing ? 'New pieces for this collection are being prepared.' : 'Try another filter combination.'}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="ui-interactive border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white"
                  >
                    Clear search
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ inStockOnly: false, newOnly: false })
                    setSortBy('popular')
                  }}
                  className="ui-interactive border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white"
                >
                  Reset filters
                </button>
              </div>
            </div>
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
