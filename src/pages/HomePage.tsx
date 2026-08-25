import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import LuxuryImage from '../components/common/LuxuryImage'
import { Hero } from '../components/home/Hero'
import { homeCategoryItems } from '../data/homeCategories'
import { categoryStripCover, categoryStripCovers } from '../data/featuredCollectionCovers'
import { brandEntries } from '../data/brandShowcase'
import { googleAnalytics } from '../services/googleAnalytics'
import { incidentAlerts } from '../services/incidentAlerts'
import {
  isLiveHomepageBackend,
  subscribeToAdminBrands,
  subscribeToHomepageContent,
  subscribeToProducts,
  type AdminBrand,
  type HomepageCategorySection,
  type HomepageCategorySections,
  type AdminProduct,
  type HomepageContent,
} from '../firebase/adminService'
import { CATALOG_IMAGE_PLACEHOLDER, normalizeCatalogImageUrl, pickPreferredCategoryCoverUrl } from '../utils/media'
import { useRecentlyViewed } from '../context/RecentlyViewedContext'
import { mapAdminProductToShopProduct } from '../utils/productMapper'
import { useListingWishlist } from '../hooks/useListingWishlist'

const fallbackCategoryStrips = [
  { key: 'women', label: 'Women', href: '/women', order: 10, image: categoryStripCovers.saree, imagePosition: 'center top' },
  { key: 'saree', label: 'Saree', href: '/sarees', order: 15, image: categoryStripCovers.saree, imagePosition: 'center top' },
  { key: 'men', label: 'Men', href: '/men', order: 20, image: categoryStripCovers.men, imagePosition: 'center top' },
  { key: 'denim', label: 'Denim', href: '/men?sub=denim', order: 25, image: categoryStripCovers.denim, imagePosition: 'center top' },
  { key: 'kids', label: 'Kids', href: '/kids', order: 30, image: homeCategoryItems.find((item) => item.key === 'kids')?.image ?? '', imagePosition: homeCategoryItems.find((item) => item.key === 'kids')?.imagePosition ?? 'center' },
  { key: 'western', label: 'Western', href: '/women?sub=tunic', order: 40, image: homeCategoryItems.find((item) => item.key === 'western')?.image ?? '', imagePosition: homeCategoryItems.find((item) => item.key === 'western')?.imagePosition ?? 'center' },
  { key: 'sale', label: 'HALF SHIRT', href: '/collections/half-shirt', order: 50, image: categoryStripCovers.men, imagePosition: 'center top' },
  { key: 'new-arrivals', label: 'OVERSIZE TEE', href: '/shop?category=men&sub=oversized-tee', order: 60, image: homeCategoryItems.find((item) => item.key === 'couples')?.image ?? '', imagePosition: homeCategoryItems.find((item) => item.key === 'couples')?.imagePosition ?? 'center' },
] as const

const categoryStripCardImage = {
  width: 960,
  height: 1200,
  aspectClassName: 'aspect-[3/4]',
  imgClassName: 'h-full w-full object-cover object-[center_top]',
} as const

function uniqueCategoryStrips<T extends { key: string }>(items: T[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = item.key.trim().toLowerCase()
    if (!key || seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function isDenimCategoryStrip(item: { key: string; label: string; href: string }) {
  const key = item.key.trim().toLowerCase()
  const label = item.label.trim().toLowerCase()
  const href = item.href.trim().toLowerCase()
  return key === 'denim' || label === 'denim' || href.includes('sub=denim')
}

function uniqueVisibleCategoryStrips<T extends { key: string; label: string; href: string }>(items: T[]) {
  const uniqueByKey = uniqueCategoryStrips(items)
  const hasCanonicalDenim = uniqueByKey.some((item) => item.key === 'denim')
  let keptDenim = false

  return uniqueByKey.filter((item) => {
    if (!isDenimCategoryStrip(item)) {
      return true
    }

    if (hasCanonicalDenim) {
      return item.key === 'denim'
    }

    if (keptDenim) {
      return false
    }

    keptDenim = true
    return true
  })
}

const defaultHomepage: HomepageContent = {
  navbarBrandPrimary: 'Shis',
  navbarBrandSecondary: 'Fashion',
  navbarSearchPlaceholder: 'Search products',
  heroEyebrow: 'SHIS FASHION',
  heroTitle: 'Crafted for Everyday Elegance.',
  heroSubtitle:
    'Contemporary Bangladeshi wardrobe essentials with refined fabrics, calm silhouettes, and comfort you can wear from morning to midnight.',
  heroCta: 'Shop now',
  heroPrimaryLink: '/shop?category=women&sub=oversized-tee',
  heroSecondaryCta: 'See new arrivals',
  heroSecondaryLink: '/shop/new-arrivals',
  heroImage: '/hero/main-hero-image2.jpg',
  heroImageTitle: 'The Monsoon Saree Collection',
  heroImageDescription: 'Homepage hero banner for The Monsoon Saree Collection.',
  heroVideo: '',
  bannerImage: '',
  bannerImageTitle: 'Featured banner image',

  bannerImageDescription: 'Editorial banner image used in the brand promise section.',
  categories: [
    { title: 'Winter', caption: 'Winter.', href: '/collections/winter' },
    { title: 'Summer', caption: 'Summer.', href: '/collections/summer' },
    { title: 'Everyday Wear', caption: 'Everyday wear.', href: '/collections/everyday-wear' },
  ],
  featuredCollectionPages: [],
  shopByCategories: homeCategoryItems.map((item) => ({
    title: item.name,
    href: item.href,
    image: item.image,
  })),
  categorySections: {
    women: {
      key: 'women',
      label: 'Women',
      href: '/women',
      enabled: true,
      order: 10,
      coverImage: categoryStripCovers.saree,
      images: [],
      updatedAt: null,
    },
    saree: {
      key: 'saree',
      label: 'Saree',
      href: '/sarees',
      enabled: true,
      order: 15,
      coverImage: categoryStripCovers.saree,
      images: [],
      updatedAt: null,
    },
    men: {
      key: 'men',
      label: 'Men',
      href: '/men',
      enabled: true,
      order: 20,
      coverImage: categoryStripCovers.men,
      images: [],
      updatedAt: null,
    },
    denim: {
      key: 'denim',
      label: 'Denim',
      href: '/men?sub=denim',
      enabled: true,
      order: 25,
      coverImage: categoryStripCovers.denim,
      images: [],
      updatedAt: null,
    },
    kids: {
      key: 'kids',
      label: 'Kids',
      href: '/kids',
      enabled: true,
      order: 30,
      coverImage: homeCategoryItems.find((item) => item.key === 'kids')?.image ?? '',
      images: [],
      updatedAt: null,
    },
    western: {
      key: 'western',
      label: 'Western',
      href: '/women?sub=tunic',
      enabled: true,
      order: 40,
      coverImage: homeCategoryItems.find((item) => item.key === 'western')?.image ?? '',
      images: [],
      updatedAt: null,
    },
    sale: {
      key: 'sale',
      label: 'HALF SHIRT',
      href: '/collections/half-shirt',
      enabled: true,
      order: 50,
      coverImage: categoryStripCovers.men,
      images: [],
      updatedAt: null,
    },
    'new-arrivals': {
      key: 'new-arrivals',
      label: 'OVERSIZE TEE',
      href: '/shop?category=men&sub=oversized-tee',
      enabled: true,
      order: 60,
      coverImage: homeCategoryItems.find((item) => item.key === 'couples')?.image ?? '',
      images: [],
      updatedAt: null,
    },
  },
  featuredCollectionEyebrow: 'Featured collections',
  featuredCollectionTitle: 'Designed for modern Bangladeshi wardrobes',
  featuredCollectionSubtitle: '',
  newArrivalsEyebrow: 'Latest edit',
  newArrivalsTitle: 'New arrivals, curated weekly',
  newArrivalsSubtitle: 'Fresh additions selected for comfort, quality, and a polished finish.',
  bestSellerEyebrow: 'Best sellers',
  featuredTitle: 'Most-loved pieces',
  featuredSubtitle: 'Timeless staples our customers reorder for fit, fabric, and comfort.',
  brandPromiseEyebrow: 'Our promise',
  brandPromiseTitle: 'Quality, comfort, and consistency.',
  brandPromiseDescription:
    'SHIS Fashion focuses on better materials, thoughtful fits, and clean detailing to make everyday style easier.',
  brandSignatureLabel: 'SHIS Signature',
  brandSignatureText: 'Minimal design language, balanced proportions, and soft everyday luxury.',
  footerBrandTitle: 'Modern essentials for Bangladesh',
  footerDescription:
    'A calm shopping experience with clear styling, dependable quality, and mobile-first checkout convenience.',
  footerContactEmail: 'shisfashion18@gmail.com',
  footerContactPhone: '+88 01887848304',
  footerContactAddress: 'Mirpur, Dhaka',
  footerBottomText: 'Built for comfortable browsing, confident choices, and repeat wear.',
  freeDeliveryThreshold: 3000,
  sections: [
    { key: 'hero', label: 'Hero', enabled: true, order: 0 },
    { key: 'featuredCollection', label: 'Featured collection', enabled: true, order: 1 },
    { key: 'newArrivals', label: 'New arrivals', enabled: true, order: 2 },
    { key: 'bestSellers', label: 'Best sellers', enabled: true, order: 3 },
    { key: 'brandPromise', label: 'Brand promise', enabled: true, order: 4 },
  ],
}

const IMAGE_PLACEHOLDER = CATALOG_IMAGE_PLACEHOLDER

function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.removeAttribute('srcset')
  event.currentTarget.src = IMAGE_PLACEHOLDER
}

function hasValidSectionHref(section: HomepageCategorySection) {
  return section.href.trim().startsWith('/')
}

export default function HomePage() {
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(defaultHomepage)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [brands, setBrands] = useState<AdminBrand[]>([])
  const [isBrandPanelOpen, setIsBrandPanelOpen] = useState(false)
  const lastSectionIntegritySignalRef = useRef('')
  const { items: recentlyViewedItems } = useRecentlyViewed()
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content, meta) => {
      if (isLiveHomepageBackend() && (meta?.source === 'local-seed' || meta?.source === 'local-storage-sync')) {
        return
      }

      console.info('[homepage] applied', {
        source: meta?.source ?? 'unknown',
        path: meta?.path ?? 'settings/homepage',
        sareeCoverImage: content.categorySections?.saree?.coverImage || '(empty)',
      })
      setHomepageContent(content)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => setProducts(nextProducts))
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToAdminBrands((nextBrands) => setBrands(nextBrands))
    return unsubscribe
  }, [])

  const categoryStrips = useMemo(() => {
    const sections: Partial<HomepageCategorySections> = homepageContent.categorySections ?? {}
    const hasLiveSections = Object.keys(sections).length > 0

    const strips = uniqueCategoryStrips([...fallbackCategoryStrips])
      .filter((fallback) => {
        if (!hasLiveSections) {
          return true
        }

        const section = sections[fallback.key]
        return section ? section.enabled : true
      })
      .sort((left, right) => {
        const leftOrder = sections[left.key]?.order ?? left.order
        const rightOrder = sections[right.key]?.order ?? right.order
        return leftOrder - rightOrder
      })
      .map((fallback) => {
        const section = sections[fallback.key]
        const liveLabel = section?.label?.trim() || fallback.label
        const liveHref = section?.href?.trim() || fallback.href
        const liveLooksLikeDenim = liveLabel.toLowerCase() === 'denim' || liveHref.toLowerCase().includes('sub=denim')
        const resolvedCover = pickPreferredCategoryCoverUrl(
          section?.coverImage,
          section?.images,
          fallback.image || categoryStripCover(fallback.key, ''),
        )

        return {
          key: fallback.key,
          label: fallback.key !== 'denim' && liveLooksLikeDenim ? fallback.label : liveLabel,
          href: fallback.key !== 'denim' && liveLooksLikeDenim ? fallback.href : liveHref,
          image: normalizeCatalogImageUrl(resolvedCover, categoryStripCardImage.width, categoryStripCardImage.height),
          imagePosition: fallback.imagePosition,
        }
      })

    return uniqueVisibleCategoryStrips(strips)
  }, [homepageContent.categorySections])

  useEffect(() => {
    const sectionEntries = Object.values(homepageContent.categorySections ?? {})
    if (!sectionEntries.length) {
      return
    }

    const enabledSections = sectionEntries.filter((section) => section.enabled)
    const invalidSections = enabledSections.filter((section) =>
      !hasValidSectionHref(section) || !section.coverImage.trim(),
    )
    const duplicateOrderValues = enabledSections
      .map((section) => section.order)
      .filter((order, index, values) => values.indexOf(order) !== index)
    const hasNoVisibleSection = enabledSections.length === 0

    if (!invalidSections.length && !duplicateOrderValues.length && !hasNoVisibleSection) {
      lastSectionIntegritySignalRef.current = ''
      return
    }

    const integrityKey = [
      invalidSections.map((section) => section.key).sort().join(','),
      duplicateOrderValues.sort((left, right) => left - right).join(','),
      hasNoVisibleSection ? 'no-visible' : 'has-visible',
    ].join('|')

    if (lastSectionIntegritySignalRef.current === integrityKey) {
      return
    }

    lastSectionIntegritySignalRef.current = integrityKey

    googleAnalytics.trackEvent('homepage_category_section_integrity_issue', {
      invalid_section_count: invalidSections.length,
      invalid_section_keys: invalidSections.map((section) => section.key).join(','),
      duplicate_order_values: duplicateOrderValues.join(','),
      has_no_visible_section: hasNoVisibleSection,
      path: window.location.pathname,
    })

    incidentAlerts.notify({
      source: 'homepage-category-sections',
      message: `Section integrity issue detected (invalid=${invalidSections.length}, duplicates=${duplicateOrderValues.length}, noVisible=${hasNoVisibleSection})`,
      fatal: false,
    })
  }, [homepageContent.categorySections])

  const heroEnabled = homepageContent.sections.find((section) => section.key === 'hero')?.enabled !== false
  const shopByCategoryEnabled = homepageContent.sections.find((section) => section.key === 'featuredCollection')?.enabled !== false

  const featuredBrands = useMemo(
    () => {
      const preferredSlugs = ['xeroxii', 'ceravo', 'rangkutir']
      const fromLive = preferredSlugs
        .map((slug) => {
          const liveBrand = brands.find((brand) => brand.slug.trim().toLowerCase() === slug)
          if (liveBrand) {
            return {
              id: liveBrand.slug,
              name: liveBrand.name,
              tag: liveBrand.tag,
              summary: liveBrand.summary,
              details: liveBrand.description,
              logo: liveBrand.logo,
              contacts: {
                website: liveBrand.website,
                contact: liveBrand.contactPhone ? `tel:${liveBrand.contactPhone.replace(/\s+/g, '')}` : `mailto:${liveBrand.contactEmail}`,
              },
            }
          }

          return brandEntries.find((brand) => brand.id === slug) ?? null
        })
        .filter((brand): brand is NonNullable<typeof brand> => Boolean(brand))

      const extraLive = brands
        .filter((brand) => !preferredSlugs.includes(brand.slug.trim().toLowerCase()))
        .slice(0, Math.max(0, 6 - fromLive.length))
        .map((liveBrand) => ({
          id: liveBrand.slug,
          name: liveBrand.name,
          tag: liveBrand.tag,
          summary: liveBrand.summary,
          details: liveBrand.description,
          logo: liveBrand.logo,
          contacts: {
            website: liveBrand.website,
            contact: liveBrand.contactPhone ? `tel:${liveBrand.contactPhone.replace(/\s+/g, '')}` : `mailto:${liveBrand.contactEmail}`,
          },
        }))

      return [...fromLive, ...extraLive]
    },
    [brands],
  )

  useEffect(() => {
    if (!isBrandPanelOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsBrandPanelOpen(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isBrandPanelOpen])

  return (
    <div className="bg-white pb-12">
      {heroEnabled ? <Hero /> : null}

      {shopByCategoryEnabled ? (
      <section id="featured-collections" className="scroll-mt-20 bg-white py-6 sm:py-14">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          {/* Header */}
          <div className="text-center mb-5 sm:mb-10">
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">
              {homepageContent.featuredCollectionEyebrow ?? 'Featured collections'}
            </p>
            <h2
              className="mt-1 text-xl sm:text-2xl md:text-3xl font-normal tracking-[0.2em] text-neutral-900 uppercase"
              style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif" }}
            >
              {homepageContent.featuredCollectionTitle?.trim() || 'SHOP BY CATEGORY'}
            </h2>
          </div>

          {/* 2-Column Tall Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {categoryStrips.map((item) => {
              const displayLabel = item.label

              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className="flex flex-col items-center group w-full cursor-pointer"
                  aria-label={`${displayLabel} collection`}
                >
                  <div className="relative w-full aspect-[3/4] overflow-hidden bg-neutral-100 rounded-none">
                    <img
                      src={item.image || CATALOG_IMAGE_PLACEHOLDER}
                      alt={displayLabel}
                      width={categoryStripCardImage.width}
                      height={categoryStripCardImage.height}
                      className="w-full h-full object-cover object-[center_top] rounded-none group-hover:scale-105 transition-transform duration-500 ease-out"
                      style={item.imagePosition ? { objectPosition: item.imagePosition } : undefined}
                      loading="lazy"
                      decoding="async"
                      onError={handleImageError}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-3 pt-8 text-center">
                      <span className="text-xs sm:text-sm font-semibold tracking-[0.15em] text-white uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
                        {displayLabel}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
      ) : null}

      {homepageContent.sections.find((section) => section.key === 'brandPromise')?.enabled !== false ? (
        <section className="py-12 sm:py-16">
              <Container>
                <p className="text-caption uppercase tracking-[0.14em] text-black/55">
                  {homepageContent.brandPromiseEyebrow ?? 'Our promise'}
                </p>
                <h2 className="mt-1 text-h2 text-black">{homepageContent.brandPromiseTitle ?? 'Quality, comfort, and consistency.'}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-black/70">
                  {homepageContent.brandPromiseDescription}
                </p>
                {homepageContent.bannerImage ? (
                  <div className="mt-5">
                    <LuxuryImage
                      src={homepageContent.bannerImage}
                      alt={homepageContent.bannerImageTitle || 'SHIS Fashion'}
                      width={1400}
                      height={800}
                      sizes="(max-width: 639px) 100vw, 1100px"
                      widths={[640, 960, 1400]}
                      aspectClassName="aspect-[21/9]"
                    />
                  </div>
                ) : null}
                <p className="mt-4 text-sm text-black/70">
                  <span className="font-semibold text-black">{homepageContent.brandSignatureLabel ?? 'SHIS Signature'}. </span>
                  {homepageContent.brandSignatureText}
                </p>
              </Container>
            </section>
      ) : null}

      {products.length > 0 ? (
        <section className="py-12 sm:py-16 bg-neutral-50/50">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            {/* Section Header */}
            <div className="text-center mb-8 sm:mb-12">
              <span className="text-xs tracking-[0.25em] text-neutral-500 uppercase block mb-2 font-medium">
                Curated Selection
              </span>
              <h2
                className="text-xl sm:text-3xl font-normal tracking-[0.2em] text-neutral-900 uppercase"
                style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
              >
                ALL PRODUCTS
              </h2>
            </div>

            {/* Responsive Product Grid */}
            <ProductListingGrid>
              {products.map((product, index) => {
                const mapped = mapAdminProductToShopProduct(product)
                return (
                  <ProductCard
                    key={mapped.id}
                    product={mapped}
                    priority={index < 4}
                    onToggleWishlist={handleToggleWishlist}
                    isInWishlist={isInWishlist(String(mapped.id))}
                  />
                )
              })}
            </ProductListingGrid>

            {/* View All Button */}
            <div className="mt-10 text-center">
              <Link
                to="/shop"
                className="inline-block border border-neutral-900 text-neutral-900 px-8 py-3 text-xs sm:text-sm font-semibold tracking-widest uppercase hover:bg-neutral-900 hover:text-white transition-all duration-300"
              >
                VIEW FULL CATALOG
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {recentlyViewedItems.length > 0 ? (
        <section className="px-3.5 pb-16 pt-6 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24 lg:pt-10">
          <Container>
            <div className="flex items-end justify-between gap-2 border-b border-black/10 pb-2.5">
              <h2 className="text-h2 text-black">Recently Viewed</h2>
              <span className="text-caption uppercase tracking-[0.12em] text-black/55">Continue where you left off</span>
            </div>
            <ProductListingGrid className="mt-5">
              {recentlyViewedItems.slice(0, 4).map((item, index) => (
                <ProductCard
                  key={item.id}
                  product={item.product}
                  priority={index < 4}
                  onToggleWishlist={handleToggleWishlist}
                  isInWishlist={isInWishlist(String(item.product.id))}
                />
              ))}
            </ProductListingGrid>
          </Container>
        </section>
      ) : null}

      {isBrandPanelOpen ? (
        <div
          className="fixed inset-0 z-[80] bg-black/72 px-3 py-3 sm:px-6 sm:py-8"
          role="dialog"
          aria-modal="true"
          aria-label="Brand details"
          onClick={() => setIsBrandPanelOpen(false)}
        >
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col justify-end sm:justify-start">
            <div
              className="max-h-[90vh] overflow-hidden rounded-t-[1.35rem] border border-white/20 bg-[rgba(8,8,8,0.96)] p-3 pb-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:max-h-full sm:rounded-[1.4rem] sm:p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/20 pb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">Our Business Brands</p>
                <button
                  type="button"
                  onClick={() => setIsBrandPanelOpen(false)}
                  className="ui-interactive border border-white/35 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 overflow-y-auto pr-0.5">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featuredBrands.map((brand) => (
                  <article key={brand.id} className="rounded-[1.15rem] border border-white/18 bg-white/8 p-4 backdrop-blur-sm">
                    <div className="aspect-[16/10] overflow-hidden rounded-[0.9rem] border border-white/20 bg-white/95">
                      <img
                        src={brand.logo}
                        alt={`${brand.name} logo`}
                        width={640}
                        height={400}
                        loading="lazy"
                        decoding="async"
                        onError={handleImageError}
                        className="gpu-media h-full w-full object-contain p-3"
                      />
                    </div>

                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">{brand.tag}</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{brand.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/80">{brand.summary}</p>
                    <p className="mt-2 text-sm leading-6 text-white/68">{brand.details}</p>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <a
                        href={brand.contacts.website}
                        target="_blank"
                        rel="noreferrer"
                        className="ui-interactive inline-flex w-full items-center justify-center border border-white bg-white px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-black hover:bg-white/90 sm:w-auto"
                      >
                        Website
                      </a>
                      <a
                        href={brand.contacts.contact}
                        target="_blank"
                        rel="noreferrer"
                        className="ui-interactive inline-flex w-full items-center justify-center border border-white/40 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/10 sm:w-auto"
                      >
                        Contact
                      </a>
                    </div>
                  </article>
                ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
