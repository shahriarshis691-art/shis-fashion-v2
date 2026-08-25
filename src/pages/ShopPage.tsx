import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import { type ShopProduct } from '../data/shopData'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { googleAnalytics } from '../services/googleAnalytics'
import { incidentAlerts } from '../services/incidentAlerts'
import { metaPixel } from '../services/metaPixel'
import { useListingWishlist } from '../hooks/useListingWishlist'
import {
  subscribeToProducts,
  type AdminProduct,
} from '../firebase/adminService'
import { parseBDT } from '../utils/currency'
import {
  type ShopSegment,
  getSegmentDescription,
  getSubcategoriesForSegment,
  matchesSegmentByAlias,
  matchesSubcategoryByAlias,
  resolveCanonicalSubcategorySlug,
  getDedicatedListingFromPath,
  getDedicatedListingPath,
  isKnownListingSlug,
} from '../data/categoryTaxonomy'
import { getCatalogContentId, getCatalogContentIds } from '../utils/catalogIdentity'
import { applyNotFoundSeo } from '../utils/seo'
import NotFoundPage from './NotFoundPage'

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

interface SubcategoryCarouselProps {
  title?: string
  viewAllHref?: string
  products: ShopProduct[]
  onToggleWishlist: (product: ShopProduct) => void
  isInWishlist: (id: string) => boolean
}

function SubcategoryCarousel({ title, viewAllHref, products, onToggleWishlist, isInWishlist }: SubcategoryCarouselProps) {
  if (!products.length) return null

  return (
    <div className="mb-8 sm:mb-10">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-neutral-900 uppercase">{title}</h3>
          {viewAllHref && (
            <Link to={viewAllHref} className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 hover:text-neutral-900 underline underline-offset-4">
              View All
            </Link>
          )}
        </div>
      )}

      <ProductListingGrid>
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={index < 4}
            onToggleWishlist={onToggleWishlist}
            isInWishlist={isInWishlist(String(product.id))}
          />
        ))}
      </ProductListingGrid>
    </div>
  )
}

export default function ShopPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(location.search)
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()

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
  const emptyStateKeysSeenRef = useRef<Set<string>>(new Set())
  const didReportEmptyStateSpikeRef = useRef(false)
  const listingStateSnapshotRef = useRef('')
  const didTrackInitialListingStateRef = useRef(false)

  const querySegment = normalizeSegmentFromQuery(
    searchParams.get('segment') ?? searchParams.get('category'),
  )
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
  const isInvalidListing = Boolean(legacyCategorySlug && !isKnownListingSlug(legacyCategorySlug))

  useEffect(() => {
    if (!isInvalidListing) {
      return
    }

    applyNotFoundSeo(location.pathname)
  }, [isInvalidListing, location.pathname])

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

    const rawCategory = params.get('category')?.trim().toLowerCase() ?? ''
    if (rawCategory) {
      if (!params.get('segment') && (rawCategory === 'women' || rawCategory === 'men' || rawCategory === 'kids' || rawCategory === 'all')) {
        params.set('segment', rawCategory)
      }
      params.delete('category')
      shouldReplace = true
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
        if (dedicatedPath) {
          params.delete('segment')
          params.delete('sub')
        } else {
          params.set('sub', legacySubcategory)
        }
        replaceWithCanonical(
          dedicatedPath ?? `/${inferredLegacySegment}`,
          params.toString() ? `?${params.toString()}` : '',
          dedicatedPath ? 'dedicated-collection-route' : 'legacy-subcategory-route',
        )
        return
      }
    }

    const dedicatedPath = getDedicatedListingPath(effectiveSegment, effectiveSubcategory)
    if (dedicatedPath && location.pathname !== dedicatedPath) {
      params.delete('segment')
      params.delete('sub')
      replaceWithCanonical(
        dedicatedPath,
        params.toString() ? `?${params.toString()}` : '',
        'dedicated-collection-route',
      )
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

  const isHalfShirtListing =
    effectiveSegment === 'men' &&
    effectiveSubcategory === 'shirts' &&
    rawQuerySubcategory === 'half-shirt'

  const halfShirtHeading = isHalfShirtListing
    ? {
      title: "MEN'S HALF SHIRTS",
      description: 'Refined half-shirt edits focused on comfort, fit, and repeat wear.',
    }
    : null

  const isOversizedTeeListing = effectiveSegment === 'men' && effectiveSubcategory === 'oversized-tee'

  const oversizedTeeHeading = isOversizedTeeListing
    ? {
      title: "MEN'S OVERSIZED TEES",
      description: 'Relaxed silhouettes with elevated texture for everyday impact.',
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
      content_ids: getCatalogContentIds(visibleProducts.slice(0, 8)),
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
    const visibleProductIds = getCatalogContentIds(visibleProducts.slice(0, 12))
    const listStateKey = `${itemListId}|${visibleProductIds.join(',')}`

    if (lastTrackedListStateRef.current === listStateKey) {
      return
    }

    lastTrackedListStateRef.current = listStateKey

    googleAnalytics.viewItemList({
      item_list_id: itemListId,
      item_list_name: itemListName,
      items: visibleProducts.slice(0, 12).map((product) => ({
        item_id: getCatalogContentId(product),
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

  const clearSearch = () => {
    const params = new URLSearchParams(location.search)
    params.delete('q')
    navigate({
      pathname: location.pathname,
      search: params.toString() ? `?${params.toString()}` : '',
    })
  }

  if (isInvalidListing) {
    return <NotFoundPage />
  }

  return (
    <section className="bg-white px-3.5 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-20 lg:pt-10">
      <Container>
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-black/55">
          <Link to="/" className="hover:text-black">Home</Link>
          <span>/</span>
          <span className="text-black">{heading.title}</span>
          {effectiveSubcategory !== 'all' ? (
            <>
              <span>/</span>
              <span className="text-black">{segmentSubcategories.find((s) => s.slug === effectiveSubcategory)?.label ?? effectiveSubcategory}</span>
            </>
          ) : null}
        </nav>

        {/* Header */}
        <div>
          <h1 className="text-h1 text-black">{dedicatedListing?.title ?? oversizedTeeHeading?.title ?? halfShirtHeading?.title ?? legacyHeading?.title ?? heading.title}</h1>
          <p className="mt-3 max-w-2xl text-body text-black/72">{dedicatedListing?.description ?? oversizedTeeHeading?.description ?? halfShirtHeading?.description ?? legacyHeading?.description ?? heading.description}</p>
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

        {/* Filter Header */}
        <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className="ui-interactive flex items-center gap-2 border border-black/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-black sm:hidden"
            aria-label="Filter & Sort"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6h16" />
              <path d="M4 12h10" />
              <path d="M4 18h6" />
            </svg>
            Filter
          </button>
          <p className="text-caption uppercase tracking-[0.14em] text-black/55 sm:hidden">
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

          <div className="hidden sm:block">
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">
              {visibleProducts.length} products
            </p>
          </div>
        </div>

        {/* Subcategory Carousels */}
        {!ready ? (
          <ProductListingGrid className="mt-4 sm:mt-5" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`listing-skeleton-${index}`}>
                <div className="aspect-[3/4] animate-pulse bg-black/5" />
                <div className="mt-2 h-3 w-3/4 animate-pulse bg-black/5" />
                <div className="mt-1.5 h-3 w-1/3 animate-pulse bg-black/5" />
              </div>
            ))}
          </ProductListingGrid>
        ) : (
          (() => {
            const getSubcategoryMeta = (slug: string) => {
              const sub = segmentSubcategories.find((s) => s.slug === slug)
              if (sub) {
                return {
                  label: sub.label.toUpperCase(),
                  href: sub.path ?? `/${effectiveSegment}?sub=${sub.slug}`,
                }
              }
              return {
                label: slug.toUpperCase(),
                href: `/${effectiveSegment}`,
              }
            }

            const productsBySubcategory: Record<string, ShopProduct[]> = {}
            for (const product of visibleProducts) {
              const normalizedCategory = resolveCanonicalSubcategorySlug(product.category)
              const matchedSub = segmentSubcategories.find((sub) =>
                sub.slug === normalizedCategory || sub.aliases.some((alias) => alias.toLowerCase() === normalizedCategory),
              )
              const key = matchedSub?.slug ?? (effectiveSubcategory === 'all' ? 'other' : effectiveSubcategory)
              if (!productsBySubcategory[key]) productsBySubcategory[key] = []
              productsBySubcategory[key].push(product)
            }

            return Object.entries(productsBySubcategory).map(([slug, products]) => {
              const meta = getSubcategoryMeta(slug)
              return (
                <SubcategoryCarousel
                  key={slug}
                  title={effectiveSubcategory === 'all' ? meta.label : undefined}
                  viewAllHref={effectiveSubcategory === 'all' ? meta.href : undefined}
                  products={products}
                  onToggleWishlist={handleToggleWishlist}
                  isInWishlist={isInWishlist}
                />
              )
            })
          })()
        )}

        {ready && visibleProducts.length === 0 ? (
          <div className="mt-8">
            <div className="border border-dashed border-black/20 px-4 py-6 text-center">
              <p className="text-caption uppercase tracking-[0.14em] text-black/55">{searchQuery ? 'No matching products' : 'No products found'}</p>
              <p className="mt-2 text-sm text-black/70">
                {searchQuery
                  ? `Nothing matched “{searchQuery}”. Try another search or browse the full collection.`
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
    <div>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close filter panel"
            className="luxury-fade-in fixed inset-0 z-40 bg-black/40 sm:hidden"
            onClick={onClose}
          />

          <aside className="luxury-sheet-up gpu-media fixed inset-x-0 bottom-0 z-50 rounded-t-xl border-t border-black/15 bg-white px-4 pb-6 pt-4 sm:hidden">
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
          </aside>
        </>
      ) : null}
    </div>
  )
}
