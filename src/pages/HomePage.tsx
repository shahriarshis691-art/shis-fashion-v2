import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Container from '../components/ui/Container'
import ProductCard from '../components/shop/ProductCard'
import ProductListingGrid from '../components/shop/ProductListingGrid'
import HeroBanner, { type HeroMediaItem } from '../components/HeroBanner'
import TrustStrip from '../components/home/TrustStrip'
import Reveal from '../components/common/Reveal'
import LuxuryImage from '../components/common/LuxuryImage'
import { homeCategoryItems } from '../data/homeCategories'
import { categoryStripCover, categoryStripCovers, featuredCollectionCover } from '../data/featuredCollectionCovers'
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
import { slugify } from '../utils/slugify'
import { useListingWishlist } from '../hooks/useListingWishlist'

const fallbackCategoryStrips = [
  { key: 'women', label: 'Women', href: '/women', order: 10, image: homeCategoryItems.find((item) => item.key === 'womens')?.image ?? '', imagePosition: homeCategoryItems.find((item) => item.key === 'womens')?.imagePosition ?? 'center' },
  { key: 'saree', label: 'Saree', href: '/sarees', order: 15, image: homeCategoryItems.find((item) => item.key === 'saree')?.image ?? '', imagePosition: homeCategoryItems.find((item) => item.key === 'saree')?.imagePosition ?? 'center 18%' },
  { key: 'men', label: 'Men', href: '/men', order: 20, image: homeCategoryItems.find((item) => item.key === 'mens')?.image ?? '', imagePosition: homeCategoryItems.find((item) => item.key === 'mens')?.imagePosition ?? 'center' },
  { key: 'denim', label: 'Denim', href: '/men?sub=denim', order: 25, image: categoryStripCovers.denim, imagePosition: 'center' },
  { key: 'kids', label: 'Kids', href: '/kids', order: 30, image: homeCategoryItems.find((item) => item.key === 'kids')?.image ?? '', imagePosition: homeCategoryItems.find((item) => item.key === 'kids')?.imagePosition ?? 'center' },
  { key: 'western', label: 'Western', href: '/women?sub=tunic', order: 40, image: homeCategoryItems.find((item) => item.key === 'western')?.image ?? '', imagePosition: homeCategoryItems.find((item) => item.key === 'western')?.imagePosition ?? 'center' },
  { key: 'sale', label: 'Half Shirt', href: '/men?sub=shirts', order: 50, image: homeCategoryItems.find((item) => item.key === 'oversized-tee')?.image ?? '', imagePosition: homeCategoryItems.find((item) => item.key === 'oversized-tee')?.imagePosition ?? 'center' },
  { key: 'new-arrivals', label: 'New Arrivals', href: '/shop/new-arrivals', order: 60, image: homeCategoryItems.find((item) => item.key === 'couples')?.image ?? '', imagePosition: homeCategoryItems.find((item) => item.key === 'couples')?.imagePosition ?? 'center' },
] as const

const categoryStripCardImage = {
  width: 1200,
  height: 900,
  aspectClassName: 'aspect-[4/3] sm:aspect-[16/10]',
  imgClassName: '!object-contain',
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

const defaultHomepage: HomepageContent = {
  navbarBrandPrimary: 'Shis',
  navbarBrandSecondary: 'Fashion',
  navbarSearchPlaceholder: 'Search products',
  heroEyebrow: 'SHIS FASHION',
  heroTitle: 'Crafted for Everyday Elegance.',
  heroSubtitle:
    'Contemporary Bangladeshi wardrobe essentials with refined fabrics, calm silhouettes, and comfort you can wear from morning to midnight.',
  heroCta: 'Shop now',
  heroPrimaryLink: '/shop',
  heroSecondaryCta: 'See new arrivals',
  heroSecondaryLink: '/shop/new-arrivals',
    heroImage: '',
  heroImageTitle: 'Homepage hero image',
  heroImageDescription: 'Main hero visual used for the opening section of the homepage.',
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
      coverImage: homeCategoryItems.find((item) => item.key === 'womens')?.image ?? '',
      images: [],
      updatedAt: null,
    },
    saree: {
      key: 'saree',
      label: 'Saree',
      href: '/sarees',
      enabled: true,
      order: 15,
      coverImage: '',
      images: [],
      updatedAt: null,
    },
    men: {
      key: 'men',
      label: 'Men',
      href: '/men',
      enabled: true,
      order: 20,
      coverImage: homeCategoryItems.find((item) => item.key === 'mens')?.image ?? '',
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
      label: 'Half Shirt',
      href: '/men?sub=shirts',
      enabled: true,
      order: 50,
      coverImage: homeCategoryItems.find((item) => item.key === 'oversized-tee')?.image ?? '',
      images: [],
      updatedAt: null,
    },
    'new-arrivals': {
      key: 'new-arrivals',
      label: 'New Arrivals',
      href: '/shop/new-arrivals',
      enabled: true,
      order: 60,
      coverImage: homeCategoryItems.find((item) => item.key === 'couples')?.image ?? '',
      images: [],
      updatedAt: null,
    },
  },
  featuredCollectionEyebrow: 'Featured collections',
  featuredCollectionTitle: 'Designed for modern Bangladeshi wardrobes',
  featuredCollectionSubtitle:
    'Minimal, refined, and wearable edits that fit daily life and special moments alike.',
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

function HomepageProductGrid({ products }: { products: AdminProduct[] }) {
  const { handleToggleWishlist, isInWishlist } = useListingWishlist()

  return (
    <ProductListingGrid className="mt-4 sm:mt-5">
      {products.map((item) => {
        const product = mapAdminProductToShopProduct(item)
        return (
          <ProductCard
            key={item.id}
            product={product}
            onToggleWishlist={handleToggleWishlist}
            isInWishlist={isInWishlist(String(product.id))}
          />
        )
      })}
    </ProductListingGrid>
  )
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

  const heroMedia = useMemo(() => {
    if (!homepageContent.heroImage) {
      return [] as HeroMediaItem[]
    }

    return [{
      type: 'image' as const,
      src: homepageContent.heroImage,
      alt: homepageContent.heroImageTitle || 'SHIS Fashion campaign image',
    }]
  }, [homepageContent.heroImage, homepageContent.heroImageTitle])

  const categoryStrips = useMemo(() => {
    const sections: Partial<HomepageCategorySections> = homepageContent.categorySections ?? {}
    const hasLiveSections = Object.keys(sections).length > 0

    return uniqueCategoryStrips([...fallbackCategoryStrips])
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
        const resolvedCover = pickPreferredCategoryCoverUrl(
          section?.coverImage,
          section?.images,
          fallback.image || categoryStripCover(fallback.key, ''),
        )

        return {
          key: fallback.key,
          label: section?.label || fallback.label,
          href: section?.href || fallback.href,
          image: normalizeCatalogImageUrl(resolvedCover, 1200, 900),
          imagePosition: fallback.imagePosition,
        }
      })
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

  const newArrivals = useMemo(
    () => products.filter((product) => product.newArrival).slice(0, 8),
    [products],
  )

  const bestSellers = useMemo(
    () => products.filter((product) => product.featured).slice(0, 8),
    [products],
  )

  const featuredCollections = useMemo(() => {
    if (homepageContent.featuredCollectionPages.length) {
      return homepageContent.featuredCollectionPages.map((page) => ({
        key: page.slug,
        title: page.title,
        href: page.href || `/collections/${page.slug}`,
        image: normalizeCatalogImageUrl(featuredCollectionCover(page.slug, page.images[0] ?? ''), 1200, 900),
      }))
    }

    return homepageContent.categories.map((category) => {
      const slug = slugify(category.title)
      return {
        key: category.title,
        title: category.title,
        href: category.href || `/collections/${slug}`,
        image: normalizeCatalogImageUrl(featuredCollectionCover(slug, category.image ?? ''), 1200, 900),
      }
    })
  }, [homepageContent.categories, homepageContent.featuredCollectionPages])

  const contentSections = useMemo(
    () => [...homepageContent.sections]
      .filter((section) => section.enabled && section.key !== 'hero')
      .sort((left, right) => left.order - right.order),
    [homepageContent.sections],
  )

  const featuredBrands = useMemo(
    () => ['xeroxii', 'ceravo', 'rangkutir']
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
      .filter((brand): brand is NonNullable<typeof brand> => Boolean(brand)),
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
      <HeroBanner
        media={heroMedia}
        eyebrow={homepageContent.heroEyebrow}
        title={homepageContent.heroTitle}
        subtitle={homepageContent.heroSubtitle}
        cta={homepageContent.heroCta}
        primaryLink={homepageContent.heroPrimaryLink}
        onSecondaryClick={() => setIsBrandPanelOpen(true)}
      />

      <TrustStrip />

      <section className="py-7 sm:py-9">
        <Container>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-caption uppercase tracking-[0.14em] text-black/55">Browse by category</p>
              <h2 className="mt-1 text-h2 text-black">Category Strips</h2>
            </div>
            <Link to="/shop" className="ui-interactive text-caption uppercase tracking-[0.14em] text-black/65 hover:text-black">
              View all
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categoryStrips.map((item, index) => (
              <Reveal key={item.key} as="article" delayMs={index * 40}>
                <Link to={item.href} className="group luxury-tap block">
                  <div className="relative">
                    <LuxuryImage
                      src={item.image}
                      alt={item.label}
                      width={categoryStripCardImage.width}
                      height={categoryStripCardImage.height}
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 48vw, 25vw"
                      widths={[480, 768, 960, 1200]}
                      aspectClassName={categoryStripCardImage.aspectClassName}
                      imgClassName={categoryStripCardImage.imgClassName}
                      objectPosition={item.imagePosition}
                      cinematicFill={item.key === 'saree'}
                      hover
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                    <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-white">
                      <span className="text-sm font-semibold uppercase tracking-[0.08em]">{item.label}</span>
                      <span aria-hidden className="text-base leading-none">→</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {contentSections.map((section) => {
        if (section.key === 'featuredCollection' && featuredCollections.length) {
          return (
            <section key={section.key} className="pb-8 sm:pb-10">
              <Container>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-caption uppercase tracking-[0.14em] text-black/55">
                      {homepageContent.featuredCollectionEyebrow ?? 'Featured collections'}
                    </p>
                    <h2 className="mt-1 text-h2 text-black">{homepageContent.featuredCollectionTitle ?? 'Featured collections'}</h2>
                  </div>
                  <Link to="/shop" className="ui-interactive text-caption uppercase tracking-[0.14em] text-black/65 hover:text-black">
                    View all
                  </Link>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredCollections.map((item, index) => (
                    <Reveal key={item.key} as="article" delayMs={index * 40}>
                      <Link to={item.href} className="group luxury-tap block">
                        <div className="relative">
                          <LuxuryImage
                            src={item.image}
                            alt={item.title}
                            width={1200}
                            height={900}
                            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 48vw, 33vw"
                            widths={[480, 768, 960, 1200]}
                            aspectClassName="aspect-[16/10]"
                            hover
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-white">
                            <span className="text-sm font-semibold uppercase tracking-[0.08em]">{item.title}</span>
                            <span aria-hidden className="text-base leading-none">→</span>
                          </div>
                        </div>
                      </Link>
                    </Reveal>
                  ))}
                </div>
              </Container>
            </section>
          )
        }

        if (section.key === 'newArrivals' && newArrivals.length) {
          return (
            <section key={section.key} className="pb-8 sm:pb-10">
              <Container>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-caption uppercase tracking-[0.14em] text-black/55">
                      {homepageContent.newArrivalsEyebrow ?? 'New arrivals'}
                    </p>
                    <h2 className="mt-1 text-h2 text-black">{homepageContent.newArrivalsTitle ?? 'New Arrivals'}</h2>
                  </div>
                  <Link
                    to="/shop/new-arrivals"
                    className="ui-interactive text-caption uppercase tracking-[0.14em] text-black/65 hover:text-black"
                  >
                    Shop now
                  </Link>
                </div>

                <HomepageProductGrid products={newArrivals} />
              </Container>
            </section>
          )
        }

        if (section.key === 'bestSellers' && bestSellers.length) {
          return (
            <section key={section.key} className="pb-8 sm:pb-10">
              <Container>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-caption uppercase tracking-[0.14em] text-black/55">
                      {homepageContent.bestSellerEyebrow ?? 'Best sellers'}
                    </p>
                    <h2 className="mt-1 text-h2 text-black">{homepageContent.featuredTitle ?? 'Best sellers'}</h2>
                  </div>
                  <Link to="/shop" className="ui-interactive text-caption uppercase tracking-[0.14em] text-black/65 hover:text-black">
                    Shop now
                  </Link>
                </div>

                <HomepageProductGrid products={bestSellers} />
              </Container>
            </section>
          )
        }

        if (section.key === 'brandPromise') {
          return (
            <section key={section.key} className="pb-8 sm:pb-10">
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
          )
        }

        return null
      })}

      {recentlyViewedItems.length > 0 ? (
        <section className="px-3.5 pb-16 pt-6 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24 lg:pt-10">
          <Container>
            <div className="flex items-end justify-between gap-2 border-b border-black/10 pb-2.5">
              <h2 className="text-h2 text-black">Recently Viewed</h2>
              <span className="text-caption uppercase tracking-[0.12em] text-black/55">Continue where you left off</span>
            </div>
            <ProductListingGrid className="mt-5">
              {recentlyViewedItems.slice(0, 4).map((item) => (
                <ProductCard
                  key={item.id}
                  product={item.product}
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
