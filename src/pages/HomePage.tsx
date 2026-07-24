import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Container from '../components/ui/Container'
import { homeCategoryItems } from '../data/homeCategories'
import { brandEntries } from '../data/brandShowcase'
import { googleAnalytics } from '../services/googleAnalytics'
import { incidentAlerts } from '../services/incidentAlerts'
import {
  subscribeToHomepageContent,
  subscribeToProducts,
  type HomepageCategorySection,
  type AdminProduct,
  type HomepageContent,
} from '../firebase/adminService'
import { getProductImage, isDemoImageUrl, normalizeCatalogImageUrl } from '../utils/media'

const fallbackCategoryStrips = [
  { key: 'women', label: 'Women', href: '/women', order: 10, image: homeCategoryItems.find((item) => item.key === 'womens')?.image ?? '' },
  { key: 'men', label: 'Men', href: '/men', order: 20, image: homeCategoryItems.find((item) => item.key === 'mens')?.image ?? '' },
  { key: 'kids', label: 'Kids', href: '/kids', order: 30, image: homeCategoryItems.find((item) => item.key === 'kids')?.image ?? '' },
  { key: 'western', label: 'Western', href: '/women?sub=tunic', order: 40, image: homeCategoryItems.find((item) => item.key === 'western')?.image ?? '' },
  { key: 'sale', label: 'Sale', href: '/sale', order: 50, image: homeCategoryItems.find((item) => item.key === 'denim')?.image ?? '' },
  { key: 'new-arrivals', label: 'New Arrivals', href: '/shop/new-arrivals', order: 60, image: homeCategoryItems.find((item) => item.key === 'couples')?.image ?? '' },
] as const

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
  heroImageTitle: 'Homepage hero image',
  heroImageDescription: 'Main hero visual used for the opening section of the homepage.',
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
      label: 'Sale',
      href: '/sale',
      enabled: true,
      order: 50,
      coverImage: homeCategoryItems.find((item) => item.key === 'denim')?.image ?? '',
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

const defaultProducts: AdminProduct[] = [
  {
    id: 'seed-atelier-oversized-tee',
    name: 'Atelier Oversized Tee',
    price: '৳ 9,800',
    stock: 12,
    sizes: ['S', 'M', 'L'],
    colors: ['Ivory', 'Black'],
    description: 'Relaxed fit with a premium ribbed finish.',
    category: 'oversized-tee',
    images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80'],
    videos: [],
    featured: true,
    newArrival: true,
    hero: false,
  },
]

const IMAGE_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"%3E%3Crect width="1200" height="1200" fill="%23f6f6f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="%23808080"%3ESHIS Fashion%3C/text%3E%3C/svg%3E'

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function productHref(product: AdminProduct) {
  return `/shop/${product.category}/${slugify(product.name)}`
}

function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.src = IMAGE_PLACEHOLDER
}

function hasValidSectionHref(section: HomepageCategorySection) {
  return section.href.trim().startsWith('/')
}

export default function HomePage() {
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(defaultHomepage)
  const [products, setProducts] = useState<AdminProduct[]>(defaultProducts)
  const [isBrandPanelOpen, setIsBrandPanelOpen] = useState(false)
  const lastSectionIntegritySignalRef = useRef('')

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => setHomepageContent(content))
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => setProducts(nextProducts.length ? nextProducts : defaultProducts))
    return unsubscribe
  }, [])

  const heroImage = normalizeCatalogImageUrl(homepageContent.heroImage ?? '', 1400, 900)

  const categoryStrips = useMemo(() => {
    const sectionEntries = Object.values(homepageContent.categorySections ?? {})

    if (!sectionEntries.length) {
      return fallbackCategoryStrips.map((section) => ({
        key: section.key,
        label: section.label,
        href: section.href,
        image: normalizeCatalogImageUrl(section.image, 1200, 900),
      }))
    }

    return sectionEntries
      .filter((section) => section.enabled)
      .sort((left, right) => left.order - right.order)
      .map((section) => {
        const fallback = fallbackCategoryStrips.find((item) => item.key === section.key)
        const sectionImage = normalizeCatalogImageUrl(fallback?.image || section.coverImage || section.images[0] || '', 1200, 900)

        return {
          key: section.key,
          label: section.label,
          href: section.href,
          image: sectionImage,
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

  const newArrivals = useMemo(() => {
    const flagged = products.filter((product) => product.newArrival)
    return (flagged.length ? flagged : products).slice(0, 8)
  }, [products])

  const featuredBrands = useMemo(
    () => ['xeroxii', 'ceravo', 'rangkutir']
      .map((id) => brandEntries.find((brand) => brand.id === id))
      .filter((brand): brand is NonNullable<typeof brand> => Boolean(brand)),
    [],
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
      <section className="border-b border-black/10">
        <div className="relative overflow-hidden bg-black">
          <div className="relative aspect-[4/5] min-h-[23rem] sm:aspect-[16/9] sm:min-h-[28rem] lg:min-h-[34rem]">
            {heroImage ? (
              <img
                src={heroImage}
                alt={homepageContent.heroImageTitle || 'SHIS Fashion campaign image'}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                sizes="100vw"
                onError={handleImageError}
                className={`absolute inset-0 h-full w-full object-cover ${
                  isDemoImageUrl(heroImage) ? 'shis-media-tone' : ''
                }`}
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#1b1b1b,#454545)]" />
            )}

            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.4)_52%,rgba(0,0,0,0.05)_100%)]" />

            <Container className="relative z-10 flex h-full items-end pb-8 pt-14 sm:items-center sm:py-0">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="max-w-[17rem] sm:max-w-[25rem]"
              >
                <p
                  className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/80"
                  style={{ textShadow: '0 1px 8px rgba(0, 0, 0, 0.4)' }}
                >
                  {homepageContent.heroEyebrow || 'SHIS FASHION'}
                </p>
                <h1
                  className="mt-2 text-h1 text-white"
                  style={{ color: '#ffffff', textShadow: '0 2px 14px rgba(0, 0, 0, 0.45)' }}
                >
                  {homepageContent.heroTitle}
                </h1>
                <p
                  className="mt-3 text-sm leading-6 text-white/85 sm:text-base sm:leading-7"
                  style={{ textShadow: '0 1px 10px rgba(0, 0, 0, 0.42)' }}
                >
                  {homepageContent.heroSubtitle}
                </p>
                <div className="mt-5 flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
                  <Link
                    to={homepageContent.heroPrimaryLink ?? '/shop'}
                    className="ui-interactive inline-flex w-full items-center justify-center border border-white bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-white/90 sm:w-auto"
                  >
                    {homepageContent.heroCta || 'Shop now'}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setIsBrandPanelOpen(true)}
                    className="ui-interactive inline-flex w-full items-center justify-center border border-white/80 bg-black/20 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/10 sm:w-auto"
                  >
                    Explore Our Brands
                  </button>
                </div>
              </motion.div>
            </Container>
          </div>
        </div>
      </section>

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

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {categoryStrips.map((item, index) => (
              <motion.article
                key={item.key}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.22, delay: index * 0.04 }}
              >
                <Link to={item.href} className="group block">
                  <div className="relative aspect-[16/10] overflow-hidden bg-black/5">
                    <img
                      src={item.image || IMAGE_PLACEHOLDER}
                      alt={item.label}
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 48vw, 20vw"
                      onError={handleImageError}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                    <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-white">
                      <span className="text-sm font-semibold uppercase tracking-[0.08em]">{item.label}</span>
                      <span aria-hidden className="text-base leading-none">→</span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </Container>
      </section>

      <section className="pb-8 sm:pb-10">
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

          <div className="mt-4 grid grid-cols-2 gap-x-1.5 gap-y-4 sm:mt-5 sm:grid-cols-3 sm:gap-x-2.5 sm:gap-y-5 lg:grid-cols-4 lg:gap-x-3.5">
            {newArrivals.map((item, index) => {
              const productImage = normalizeCatalogImageUrl(getProductImage(item), 900, 1125)
              const toneClass = isDemoImageUrl(productImage) ? 'shis-media-tone' : ''

              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.22, delay: index * 0.03 }}
                >
                  <Link to={productHref(item)} className="group block">
                    <div className="aspect-[4/5] overflow-hidden bg-black/5">
                      <img
                        src={productImage || IMAGE_PLACEHOLDER}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                        onError={handleImageError}
                        className={`h-full w-full object-cover transition duration-300 group-hover:scale-[1.02] ${toneClass}`}
                      />
                    </div>
                    <div className="pt-2.5">
                      <h3 className="line-clamp-1 text-body font-medium text-black">{item.name}</h3>
                      <p className="mt-1 text-body font-semibold text-black">{item.price}</p>
                    </div>
                  </Link>
                </motion.article>
              )
            })}
          </div>
        </Container>
      </section>

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
                    <div className="overflow-hidden rounded-[0.9rem] border border-white/20 bg-white/95">
                      <img
                        src={brand.logo}
                        alt={`${brand.name} logo`}
                        loading="lazy"
                        decoding="async"
                        onError={handleImageError}
                        className="h-24 w-full object-contain p-3 sm:h-28"
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
