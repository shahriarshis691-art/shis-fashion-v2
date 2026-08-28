import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import { type ShopProduct } from '../data/shopData'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { mergeHalfShirtCatalog } from '../data/halfShirtCollection'
import {
  isDenimProduct,
  mergeMensBaggyDenimCatalog,
} from '../data/mensBaggyDenimCollection'
import {
  WOMENS_BAGGY_HERO_IMAGE,
  WOMENS_BAGGY_HERO_IMAGE_FALLBACK,
  isWomensBaggyDenimProduct,
  mergeWomensBaggyDenimCatalog,
} from '../data/womensBaggyDenimCollection'
import {
  isOversizedTeeProduct,
  mergeOversizedTeeCatalog,
  shouldExcludeOversizedTeeFromMenListing,
  shouldExcludeOversizedTeeFromWomenListing,
} from '../data/oversizedTeeCollection'
import {
  WESTERN_LISTING_FILTER_OPTIONS,
  matchesWesternListingFilter,
  mergeWesternOutfitsCatalog,
  westernOutfitsCollectionProducts,
  type WesternListingFilter,
} from '../data/westernOutfitsCollection'
import {
  KURTI_PAGE_SIZE,
  getKurtiListingProducts,
  mergeKurtisCatalog,
} from '../data/kurtisCollection'
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

type SortOption = 'featured' | 'popular' | 'new' | 'price-low' | 'price-high' | 'best-selling'

interface ProductFilters {
  inStockOnly: boolean
  newOnly: boolean
}

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'new', label: 'New Arrivals' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
]

const MEN_ONLY_CATEGORY_SLUGS = new Set([
  'shirts',
  'half-shirts',
  'polos',
  'panjabi',
  't-shirts',
  'pants',
  'jackets',
])

const MEN_EXCLUSION_KEYWORDS = [
  'men',
  "men's",
  'mens',
  'man',
  "man's",
  'half-shirt',
  'half shirt',
  'panjabi',
  'mens-denim',
  "men's denim",
  'mens shirt',
  "men's shirt",
  'menswear',
]

const WOMEN_INCLUSION_KEYWORDS = [
  'women',
  "women's",
  'womens',
  'female',
  'saree',
  'sari',
  'kurti',
  'three piece',
  'three-piece',
  '3 piece',
  '3-piece',
  'salwar',
  'salwar kameez',
  'women tee',
  "women's tee",
  'womens tee',
  'western',
]

function isWomenListingProduct(product: ShopProduct) {
  const extendedProduct = product as ShopProduct & {
    gender?: string
    tags?: string[]
  }
  const canonical = resolveCanonicalSubcategorySlug(product.category)
  const womenSlugs = new Set(getSubcategoriesForSegment('women').map((item) => item.slug))
  const normalizedCategory = product.category.trim().toLowerCase()
  const normalizedGender = (extendedProduct.gender ?? '').trim().toLowerCase()
  const normalizedTags = (extendedProduct.tags ?? []).map((tag) => tag.trim().toLowerCase())

  const searchableText = [
    product.category,
    product.name,
    product.slug,
    String(product.id),
    product.description,
    product.image,
    normalizedTags.join(' '),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (matchesSegmentByAlias('kids', product.category)) {
    return false
  }

  if (normalizedGender === 'unisex' || normalizedCategory === 'unisex') {
    return false
  }

  // Unisex / generic oversized tees live only on `/collections/oversized-tee`.
  if (shouldExcludeOversizedTeeFromWomenListing(product)) {
    return false
  }

  if (normalizedCategory === 'men' || normalizedGender === 'men' || normalizedGender === 'male') {
    return false
  }

  if (MEN_ONLY_CATEGORY_SLUGS.has(canonical) && !womenSlugs.has(canonical)) {
    return false
  }

  if (
    MEN_EXCLUSION_KEYWORDS.some((keyword) => searchableText.includes(keyword)) &&
    !WOMEN_INCLUSION_KEYWORDS.some((keyword) => searchableText.includes(keyword))
  ) {
    return false
  }

  const isExplicitWomenByCategory = normalizedCategory === 'women' || normalizedCategory === 'woman'
  const isExplicitWomenByGender = normalizedGender === 'women' || normalizedGender === 'female'
  const isWomenSubcategory = womenSlugs.has(canonical) && canonical !== 'oversized-tee'
  const isDedicatedWomenOversizedTee = isOversizedTeeProduct(product) && !shouldExcludeOversizedTeeFromWomenListing(product)
  const isWomenByAlias = matchesSegmentByAlias('women', product.category) && !isOversizedTeeProduct(product)
  const isWomenByKeyword = WOMEN_INCLUSION_KEYWORDS.some((keyword) => searchableText.includes(keyword))

  return (
    isExplicitWomenByCategory ||
    isExplicitWomenByGender ||
    isWomenSubcategory ||
    isDedicatedWomenOversizedTee ||
    isWomenByAlias ||
    isWomenByKeyword
  )
}

function isMenListingProduct(product: ShopProduct) {
  const extendedProduct = product as ShopProduct & {
    gender?: string
    tags?: string[]
  }
  const normalizedCategory = product.category.trim().toLowerCase()
  const normalizedGender = (extendedProduct.gender ?? '').trim().toLowerCase()

  if (matchesSegmentByAlias('kids', product.category)) {
    return false
  }

  if (normalizedGender === 'unisex' || normalizedCategory === 'unisex') {
    return false
  }

  // Generic unisex oversized tees belong only on the dedicated oversized tee page.
  if (shouldExcludeOversizedTeeFromMenListing(product)) {
    return false
  }

  if (normalizedCategory === 'women' || normalizedGender === 'women' || normalizedGender === 'female') {
    return false
  }

  const isExplicitMenByCategory = normalizedCategory === 'men' || normalizedCategory === 'man'
  const isExplicitMenByGender = normalizedGender === 'men' || normalizedGender === 'male'
  const isDedicatedMenOversizedTee = isOversizedTeeProduct(product) && !shouldExcludeOversizedTeeFromMenListing(product)
  const isMenByAlias = matchesSegmentByAlias('men', product.category) && !isOversizedTeeProduct(product)

  return isExplicitMenByCategory || isExplicitMenByGender || isDedicatedMenOversizedTee || isMenByAlias
}

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

function isHalfShirtProduct(product: ShopProduct) {
  if (matchesSubcategoryByAlias('men', 'half-shirts', product.category)) {
    return true
  }

  const text = [product.name, product.slug, product.category].join(' ').toLowerCase()
  return /half[\s_-]?shirts?/.test(text)
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
            href={/half-shirt/i.test(product.category) ? `/product/${product.slug}` : undefined}
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

  const [products, setProducts] = useState<ShopProduct[]>(() =>
    mergeKurtisCatalog(
      mergeWomensBaggyDenimCatalog(
        mergeMensBaggyDenimCatalog(
          mergeWesternOutfitsCatalog(mergeOversizedTeeCatalog(mergeHalfShirtCatalog([]))),
        ),
      ),
    ),
  )
  const [ready, setReady] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('featured')
  const [westernFilter, setWesternFilter] = useState<WesternListingFilter>('all')
  const [kurtiVisibleCount, setKurtiVisibleCount] = useState(KURTI_PAGE_SIZE)
  const kurtiListingKeyRef = useRef('')
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [draftSortBy, setDraftSortBy] = useState<SortOption>('featured')
  const [draftFilters, setDraftFilters] = useState<ProductFilters>({
    inStockOnly: false,
    newOnly: false,
  })
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
      setProducts(
        mergeKurtisCatalog(
          mergeWomensBaggyDenimCatalog(
            mergeMensBaggyDenimCatalog(
              mergeWesternOutfitsCatalog(
                mergeOversizedTeeCatalog(mergeHalfShirtCatalog(nextProducts.map(mapProduct))),
              ),
            ),
          ),
        ),
      )
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

  const isHalfShirtListing = dedicatedListing?.subcategory === 'half-shirts' ||
    (effectiveSegment === 'men' && effectiveSubcategory === 'half-shirts')

  const halfShirtHeading = isHalfShirtListing
    ? {
      title: "MEN'S HALF SHIRTS",
      description: 'Refined half-shirt edits focused on comfort, fit, and repeat wear.',
    }
    : null

  const isDenimListing = effectiveSegment === 'men' && effectiveSubcategory === 'denim'

  const denimHeading = isDenimListing
    ? {
      title: "MEN'S BAGGY DENIM",
      description: 'Loose, wide-leg, and skate-ready baggy jeans — premium cotton denim in waist sizes 28–36.',
    }
    : null

  const isWomensBaggyListing = dedicatedListing?.subcategory === 'womens-baggy' ||
    (effectiveSegment === 'women' && effectiveSubcategory === 'womens-baggy') ||
    location.pathname.includes('womens-baggy')

  const womensBaggyHeading = isWomensBaggyListing
    ? {
      title: "WOMEN'S BAGGY",
      description: 'Loose and wide-leg baggy jeans for women — premium denim with an easy everyday drape.',
    }
    : null

  const isWesternOutfitsListing = effectiveSegment === 'women' && effectiveSubcategory === 'western-outfits'
  const isKurtiListing = effectiveSegment === 'women' && effectiveSubcategory === 'kurti'

  const westernHeading = isWesternOutfitsListing
    ? {
      title: 'WESTERN OUTFITS',
      description:
        'Women’s western staples — crop tops, casual shirts, tank tops, denim shorts, tailored trousers, and skirts. Clean flat-lay and hangar edits.',
    }
    : null

  const kurtiHeading = isKurtiListing
    ? {
      title: 'KURTI',
      description:
        'Indian women’s kurtis — anarkali, straight, A-line, chikankari, and embroidered styles in breathable cotton, rayon, and festive blends.',
    }
    : null

  const isOversizedTeeListing = effectiveSegment === 'men' && effectiveSubcategory === 'oversized-tee'

  const oversizedTeeHeading = isOversizedTeeListing
    ? {
      title: 'OVERSIZED TEE',
      description: 'An all-inclusive adult collection for Unisex, Men, and Women. Oversized Boxy Fit in S, M, L, XL, and XXL.',
    }
    : null

  const isWomenListing = effectiveSegment === 'women'
  const isMenListing = effectiveSegment === 'men'
  const kurtiCatalogProducts = getKurtiListingProducts()

  const listingPool = isKurtiListing ? kurtiCatalogProducts : products

  const bySegment = isKurtiListing
    ? listingPool
    : products.filter((product) => {
      if (isWomenListing) {
        return isWomenListingProduct(product)
      }
      if (isMenListing) {
        return isMenListingProduct(product)
      }
      return segmentMatchesProduct(effectiveSegment, product.category)
    })

  const bySubcategory = isKurtiListing
    ? listingPool
    : effectiveSubcategory === 'all'
      ? bySegment
      : isHalfShirtListing
        ? bySegment.filter(isHalfShirtProduct)
        : isDenimListing
          ? bySegment.filter(isDenimProduct)
          : isWomensBaggyListing
            ? bySegment.filter(isWomensBaggyDenimProduct)
            : bySegment.filter((product) =>
              matchesSubcategoryByAlias(effectiveSegment, effectiveSubcategory, product.category),
            )

  const byWesternGroup = isWesternOutfitsListing
    ? bySubcategory.filter((product) => matchesWesternListingFilter(product, westernFilter))
    : bySubcategory

  const byFilter = byWesternGroup.filter((product) => {
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

    if (sortBy === 'best-selling') {
      sorted.sort(
        (left, right) =>
          Number(Boolean(right.featured)) - Number(Boolean(left.featured)) ||
          (right.stock ?? 0) - (left.stock ?? 0) ||
          parseBDT(left.price) - parseBDT(right.price),
      )
      return sorted
    }

    sorted.sort(
      (left, right) =>
        Number(Boolean(right.featured)) - Number(Boolean(left.featured)) ||
        Number(Boolean(right.newArrival)) - Number(Boolean(left.newArrival)) ||
        (right.stock ?? 0) - (left.stock ?? 0),
    )
    return sorted
  })()

  const displayedProducts = isKurtiListing
    ? visibleProducts.slice(0, kurtiVisibleCount)
    : visibleProducts

  const canLoadMoreKurtis = isKurtiListing && kurtiVisibleCount < visibleProducts.length

  const kurtiListingKey = `${effectiveSubcategory}|${sortBy}|${filters.inStockOnly}|${filters.newOnly}|${searchQuery}`
  if (kurtiListingKey !== kurtiListingKeyRef.current) {
    kurtiListingKeyRef.current = kurtiListingKey
    if (kurtiVisibleCount !== KURTI_PAGE_SIZE) {
      setKurtiVisibleCount(KURTI_PAGE_SIZE)
    }
  }

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

  const resetAllFilters = () => {
    setFilters({ inStockOnly: false, newOnly: false })
    setDraftFilters({ inStockOnly: false, newOnly: false })
    setSortBy('featured')
    setDraftSortBy('featured')
    clearSearch()
    if (isWomenListing && effectiveSubcategory !== 'all') {
      navigate('/shop?segment=women')
    }
  }

  const openFilterSheet = () => {
    setDraftSortBy(sortBy)
    setDraftFilters(filters)
    setIsFilterSheetOpen(true)
  }

  const applyFilterSheet = () => {
    setSortBy(draftSortBy)
    setFilters(draftFilters)
    setIsFilterSheetOpen(false)
  }

  const navigateWomenSubcategory = (slug: string) => {
    setWesternFilter('all')
    if (slug === 'all') {
      navigate('/shop?segment=women')
      return
    }

    const dedicated = getDedicatedListingPath('women', slug)
    if (dedicated) {
      navigate(dedicated)
      return
    }

    navigate(`/women?sub=${slug}`)
  }

  const activeFilterBadges: Array<{ key: string; label: string; onClear: () => void }> = []
  if (isWomenListing && effectiveSubcategory !== 'all') {
    activeFilterBadges.push({
      key: 'sub',
      label: segmentSubcategories.find((item) => item.slug === effectiveSubcategory)?.label ?? effectiveSubcategory,
      onClear: () => navigate('/shop?segment=women'),
    })
  }
  if (filters.inStockOnly) {
    activeFilterBadges.push({
      key: 'stock',
      label: 'In stock',
      onClear: () => setFilters((current) => ({ ...current, inStockOnly: false })),
    })
  }
  if (filters.newOnly) {
    activeFilterBadges.push({
      key: 'new',
      label: 'New arrivals',
      onClear: () => setFilters((current) => ({ ...current, newOnly: false })),
    })
  }
  if (searchQuery) {
    activeFilterBadges.push({
      key: 'search',
      label: `“${searchQuery}”`,
      onClear: clearSearch,
    })
  }

  if (isInvalidListing) {
    return <NotFoundPage />
  }

  return (
    <section className={`bg-white pb-24 ${isWomensBaggyListing ? 'lg:pb-20' : 'pt-6 lg:pb-20 lg:pt-10'}`}>
      {isWomensBaggyListing ? (
        <div className="listing-hero-frame relative w-full max-w-[100vw] overflow-hidden bg-neutral-100">
          <img
            src={WOMENS_BAGGY_HERO_IMAGE}
            alt="Women's Baggy Jeans — SHIS Fashion"
            width={1536}
            height={1024}
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            draggable={false}
            className="listing-hero-motion gpu-media"
            onError={(event) => {
              const image = event.currentTarget
              if (image.dataset.fallback === 'done') {
                return
              }
              if (image.dataset.fallback !== 'jpeg') {
                image.dataset.fallback = 'jpeg'
                image.src = WOMENS_BAGGY_HERO_IMAGE_FALLBACK
                return
              }
              image.dataset.fallback = 'done'
              image.src = '/og-image.svg'
            }}
          />
        </div>
      ) : null}

      <Container className={isWomensBaggyListing ? 'pt-6 lg:pt-10' : undefined}>
        {/* Breadcrumb */}
        <nav
          id={isWomensBaggyListing ? 'womens-baggy-grid' : undefined}
          className="mb-4 flex scroll-mt-[calc(var(--nav-offset,3.5rem)+0.5rem)] items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-black/55"
        >
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
          <h1 className="text-h1 text-black">{dedicatedListing?.title ?? kurtiHeading?.title ?? westernHeading?.title ?? womensBaggyHeading?.title ?? oversizedTeeHeading?.title ?? denimHeading?.title ?? halfShirtHeading?.title ?? legacyHeading?.title ?? heading.title}</h1>
          <p className="mt-3 max-w-2xl text-body text-black/72">{dedicatedListing?.description ?? kurtiHeading?.description ?? westernHeading?.description ?? womensBaggyHeading?.description ?? oversizedTeeHeading?.description ?? denimHeading?.description ?? halfShirtHeading?.description ?? legacyHeading?.description ?? heading.description}</p>
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

        {isWomenListing ? (
          <div className={`sticky top-[calc(var(--nav-offset,3.5rem)+0.25rem)] z-30 mt-6 border-b border-neutral-100 bg-white/95 py-3 backdrop-blur-md ${
            isWesternOutfitsListing
              ? '-mx-4 px-4 md:-mx-8 md:px-8'
              : '-mx-4 px-4 sm:-mx-8 sm:px-8'
          }`}>
            <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {isWesternOutfitsListing && westernOutfitsCollectionProducts.length > 0 ? (
                WESTERN_LISTING_FILTER_OPTIONS.map((option) => {
                  const active = westernFilter === option.value
                  const label = option.countLabel
                    ? `${option.label} (${westernOutfitsCollectionProducts.length})`
                    : option.label
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setWesternFilter(option.value)}
                      className={`shrink-0 rounded-sm px-3 py-1.5 text-xs font-medium tracking-[0.08em] uppercase transition-colors duration-300 ${
                        active
                          ? 'bg-black text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })
              ) : isWesternOutfitsListing ? (
                <button
                  type="button"
                  className="shrink-0 rounded-sm bg-black px-3 py-1.5 text-xs font-medium tracking-[0.08em] uppercase text-white"
                  disabled
                >
                  Western Outfits
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigateWomenSubcategory('all')}
                    className={`shrink-0 px-3 py-1.5 text-xs font-medium tracking-[0.08em] uppercase transition-colors ${
                      effectiveSubcategory === 'all'
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                    }`}
                  >
                    All
                  </button>
                  {segmentSubcategories.map((sub) => {
                    const active = effectiveSubcategory === sub.slug
                    return (
                      <button
                        key={sub.slug}
                        type="button"
                        onClick={() => navigateWomenSubcategory(sub.slug)}
                        className={`shrink-0 px-3 py-1.5 text-xs font-medium tracking-[0.08em] uppercase transition-colors ${
                          active
                            ? 'bg-black text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                        }`}
                      >
                        {sub.label}
                      </button>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        ) : null}

        {/* Filter Header */}
        <div className="mt-6 flex items-center justify-between border-b border-neutral-100 pb-3 sm:mt-8">
          <button
            type="button"
            onClick={openFilterSheet}
            className="ui-interactive flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 sm:hidden"
            aria-label="Filter & Sort"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6h16" />
              <path d="M4 12h10" />
              <path d="M4 18h6" />
            </svg>
            Filter
            {activeFilterBadges.length ? (
              <span className="inline-flex h-4 min-w-4 items-center justify-center bg-black px-1 text-[10px] font-semibold text-white">
                {activeFilterBadges.length}
              </span>
            ) : null}
          </button>
          <p className="text-xs font-normal text-neutral-400 sm:hidden">
            Showing {visibleProducts.length} {visibleProducts.length === 1 ? 'item' : 'items'}
          </p>

          <div className="hidden flex-wrap items-center gap-4 sm:flex">
            <div className="flex items-center gap-2">
              <label htmlFor="desktop-sort" className="text-xs font-medium text-neutral-400">
                Sort
              </label>
              <select
                id="desktop-sort"
                value={sortBy === 'popular' ? 'featured' : sortBy}
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="bg-transparent text-xs font-medium text-neutral-700 outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden sm:block">
            <p className="text-xs font-normal text-neutral-400">
              Showing {visibleProducts.length} {visibleProducts.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {activeFilterBadges.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeFilterBadges.map((badge) => (
              <button
                key={badge.key}
                type="button"
                onClick={badge.onClear}
                className="inline-flex items-center gap-1.5 border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-700 hover:border-neutral-400"
              >
                {badge.label}
                <span aria-hidden className="text-neutral-400">×</span>
              </button>
            ))}
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-900 underline underline-offset-4"
            >
              Clear all
            </button>
          </div>
        ) : null}

        {/* Product Grid */}
        {!ready && !isKurtiListing && products.length === 0 ? (
          <ProductListingGrid className="mt-4 sm:mt-5" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={`listing-skeleton-${index}`}>
                <div className="studio-media-frame animate-pulse bg-black/5" />
                <div className="mt-2 h-3 w-3/4 animate-pulse bg-black/5" />
                <div className="mt-1.5 h-3 w-1/3 animate-pulse bg-black/5" />
              </div>
            ))}
          </ProductListingGrid>
        ) : isWesternOutfitsListing ? (
          visibleProducts.length > 0 ? (
            <ProductListingGrid className="mt-6">
              {visibleProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  href={`/product/${product.slug}`}
                  variant="studio"
                  priority={index < 4}
                  onToggleWishlist={handleToggleWishlist}
                  isInWishlist={isInWishlist(String(product.id))}
                />
              ))}
            </ProductListingGrid>
          ) : null
        ) : isKurtiListing ? (
          displayedProducts.length > 0 ? (
            <>
              <ProductListingGrid className="mt-6">
                {displayedProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    href={`/product/${product.slug}`}
                    variant="studio"
                    priority={index < 4}
                    onToggleWishlist={handleToggleWishlist}
                    isInWishlist={isInWishlist(String(product.id))}
                  />
                ))}
              </ProductListingGrid>
              {canLoadMoreKurtis ? (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <p className="text-xs tracking-[0.12em] text-neutral-500 uppercase">
                    Showing {displayedProducts.length} of {visibleProducts.length}
                  </p>
                  <button
                    type="button"
                    onClick={() => setKurtiVisibleCount((current) => current + KURTI_PAGE_SIZE)}
                    className="border border-neutral-900 px-8 py-3 text-xs font-semibold tracking-[0.16em] text-neutral-900 uppercase transition-colors hover:bg-neutral-900 hover:text-white"
                  >
                    Load more
                  </button>
                </div>
              ) : null}
            </>
          ) : null
        ) : isWomenListing ? (
          <ProductListingGrid className="mt-6">
            {visibleProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                href={isWomensBaggyDenimProduct(product) ? `/product/${product.slug}` : undefined}
                priority={index < 4}
                onToggleWishlist={handleToggleWishlist}
                isInWishlist={isInWishlist(String(product.id))}
              />
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
            {isWesternOutfitsListing && !searchQuery ? (
              <div className="border border-neutral-200 bg-[#f9f9f9] px-6 py-14 text-center sm:px-10">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                  Western Outfits
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight text-neutral-900 sm:text-3xl">
                  New Western Collection Coming Soon
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
                  We&apos;re preparing a fresh edit of crop tops, shirts, denim, and tailored bottoms. Explore the rest of the store while we finish styling.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/"
                    className="inline-flex min-h-11 items-center justify-center bg-black px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800"
                  >
                    Back to Home
                  </Link>
                  <Link
                    to="/women"
                    className="inline-flex min-h-11 items-center justify-center border border-black px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-black hover:text-white"
                  >
                    Explore Women
                  </Link>
                </div>
              </div>
            ) : isWomensBaggyListing && !searchQuery ? (
              <div className="border border-neutral-200 bg-[#f9f9f9] px-6 py-14 text-center sm:px-10">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                  Women&apos;s Baggy
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight text-neutral-900 sm:text-3xl">
                  Women&apos;s Baggy Jeans Coming Soon
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-neutral-600">
                  We&apos;re preparing a fresh edit of loose and wide-leg baggy jeans for women. Explore the rest of the store while we finish styling.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/"
                    className="inline-flex min-h-11 items-center justify-center bg-black px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-neutral-800"
                  >
                    Back to Home
                  </Link>
                  <Link
                    to="/men?sub=denim"
                    className="inline-flex min-h-11 items-center justify-center border border-black px-5 text-xs font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-black hover:text-white"
                  >
                    Shop Men&apos;s Baggy
                  </Link>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-black/20 px-4 py-10 text-center">
                <p className="text-caption uppercase tracking-[0.14em] text-black/55">{searchQuery ? 'No matching products' : 'No products found'}</p>
                <p className="mt-2 text-sm text-black/70">
                  {searchQuery
                    ? `Nothing matched “${searchQuery}”. Try another search or browse the full collection.`
                    : dedicatedListing ? 'New pieces for this collection are being prepared.' : 'Try another filter combination or clear all filters.'}
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
                    onClick={resetAllFilters}
                    className="ui-interactive border border-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-black hover:text-white"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Container>

      <AnimateMobileSheet
        open={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        sortBy={draftSortBy}
        onSortChange={setDraftSortBy}
        filters={draftFilters}
        onFiltersChange={setDraftFilters}
        onApply={applyFilterSheet}
        onReset={() => {
          setDraftFilters({ inStockOnly: false, newOnly: false })
          setDraftSortBy('featured')
        }}
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
  onApply,
  onReset,
}: {
  open: boolean
  onClose: () => void
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
  filters: ProductFilters
  onFiltersChange: (value: ProductFilters) => void
  onApply: () => void
  onReset: () => void
}) {
  return (
    <div>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close filter panel"
            className="luxury-fade-in fixed inset-0 z-[50] bg-black/40 sm:hidden"
            onClick={onClose}
          />

          <aside className="luxury-sheet-up gpu-media fixed inset-x-0 bottom-0 z-[55] max-h-[85dvh] overflow-y-auto rounded-t-xl border-t border-black/15 bg-white px-4 pt-4 pb-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))] sm:hidden">
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
                        sortBy === option.value || (option.value === 'featured' && sortBy === 'popular')
                          ? 'border-black bg-black text-white'
                          : 'border-black/15 text-black hover:bg-black/5'
                      }`}
                    >
                      <span>{option.label}</span>
                      {sortBy === option.value || (option.value === 'featured' && sortBy === 'popular') ? (
                        <span aria-hidden>✓</span>
                      ) : null}
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

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onReset}
                  className="ui-interactive w-full border border-black/20 bg-white py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-black hover:bg-black/5"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onApply}
                  className="ui-interactive w-full border border-black bg-black py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-white"
                >
                  Apply
                </button>
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  )
}
