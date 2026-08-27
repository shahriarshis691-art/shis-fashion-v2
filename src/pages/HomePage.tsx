import { useEffect, useMemo, useRef, useState } from 'react'
import Container from '../components/ui/Container'
import LuxuryImage from '../components/common/LuxuryImage'
import { Hero } from '../components/home/Hero'
import ShopByCategorySection from '../components/home/ShopByCategorySection'
import { homeCategoryItems } from '../data/homeCategories'
import { SEGMENT_HUB_COVERS } from '../data/categoryHubCovers'
import { categoryStripCover, categoryStripCovers } from '../data/featuredCollectionCovers'
import { googleAnalytics } from '../services/googleAnalytics'
import { incidentAlerts } from '../services/incidentAlerts'
import {
  isLiveHomepageBackend,
  subscribeToHomepageContent,
  type HomepageCategorySection,
  type HomepageCategorySections,
  type HomepageContent,
} from '../firebase/adminService'
import { normalizeCatalogImageUrl, pickPreferredCategoryCoverUrl } from '../utils/media'

const fallbackCategoryStrips = [
  { key: 'women', label: 'Women', href: '/women', order: 10, image: categoryStripCovers.saree, imagePosition: 'center top' },
  { key: 'saree', label: 'Saree', href: '/sarees', order: 15, image: categoryStripCovers.saree, imagePosition: 'center top' },
  { key: 'men', label: 'Men', href: '/men', order: 20, image: categoryStripCovers.men, imagePosition: 'center top' },
  { key: 'denim', label: 'Denim', href: '/men?sub=denim', order: 25, image: categoryStripCovers.denim, imagePosition: 'center top' },
  { key: 'kids', label: 'KID', href: '/kids', order: 30, image: SEGMENT_HUB_COVERS.kids, imagePosition: 'center top' },
  { key: 'western', label: "WOMEN'S BAGGY", href: '/women/womens-baggy', order: 40, image: categoryStripCovers.western, imagePosition: 'center top' },
  { key: 'sale', label: 'HALF SHIRTS', href: '/men/half-shirts', order: 50, image: categoryStripCovers['half-shirts'], imagePosition: 'center top' },
  { key: 'new-arrivals', label: 'OVERSIZED TEE', href: '/collections/oversized-tee', order: 60, image: categoryStripCovers['oversized-tee'], imagePosition: 'center top' },
] as const

const categoryStripCardImage = {
  width: 960,
  height: 1200,
} as const

const HOMEPAGE_GALLERY_IMAGE = '/homepage/homepage-gellary-image.jpg'
const HOMEPAGE_GALLERY_IMAGE_FALLBACK = '/homepage/homepage-gellary-image.jpg.jpeg'

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
  heroImage: '',
  heroImageTitle: 'Homepage campaign banners',
  heroImageDescription: 'Homepage hero carousel for saree, kids, and denim collections.',
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
      label: 'KID',
      href: '/kids',
      enabled: true,
      order: 30,
      coverImage: SEGMENT_HUB_COVERS.kids,
      images: [],
      updatedAt: null,
    },
    western: {
      key: 'western',
      label: "WOMEN'S BAGGY",
      href: '/women/womens-baggy',
      enabled: true,
      order: 40,
      coverImage: categoryStripCovers.western,
      images: [],
      updatedAt: null,
    },
    sale: {
      key: 'sale',
      label: 'HALF SHIRTS',
      href: '/men/half-shirts',
      enabled: true,
      order: 50,
      coverImage: categoryStripCovers['half-shirts'],
      images: [],
      updatedAt: null,
    },
    'new-arrivals': {
      key: 'new-arrivals',
      label: 'OVERSIZED TEE',
      href: '/collections/oversized-tee',
      enabled: true,
      order: 60,
      coverImage: categoryStripCovers['oversized-tee'],
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

function hasValidSectionHref(section: HomepageCategorySection) {
  return section.href.trim().startsWith('/')
}

export default function HomePage() {
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(defaultHomepage)
  const lastSectionIntegritySignalRef = useRef('')

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
        const isHalfShirtsCard = fallback.key === 'sale'
        const isOversizedTeeCard = fallback.key === 'new-arrivals'
        const isWomensBaggyCard = fallback.key === 'western'
        const resolvedCover = isHalfShirtsCard
          ? categoryStripCovers['half-shirts']
          : isOversizedTeeCard
            ? categoryStripCovers['oversized-tee']
            : isWomensBaggyCard
              ? categoryStripCovers.western
              : pickPreferredCategoryCoverUrl(
                section?.coverImage,
                section?.images,
                fallback.image || categoryStripCover(fallback.key, ''),
              )

        return {
          key: fallback.key,
          label: isHalfShirtsCard
            ? 'HALF SHIRTS'
            : isOversizedTeeCard
              ? 'OVERSIZED TEE'
              : isWomensBaggyCard
                ? "WOMEN'S BAGGY"
                : fallback.key !== 'denim' && liveLooksLikeDenim ? fallback.label : liveLabel,
          href: isHalfShirtsCard
            ? '/men/half-shirts'
            : isOversizedTeeCard
              ? '/collections/oversized-tee'
              : isWomensBaggyCard
                ? '/women/womens-baggy'
                : fallback.key !== 'denim' && liveLooksLikeDenim ? fallback.href : liveHref,
          image: normalizeCatalogImageUrl(resolvedCover, categoryStripCardImage.width, categoryStripCardImage.height),
          imagePosition: fallback.imagePosition,
        }
      })

    return uniqueVisibleCategoryStrips(strips)
  }, [homepageContent.categorySections])

  const hubCategoryItems = useMemo(() => {
    const byKey = new Map(categoryStrips.map((item) => [item.key, item]))
    return (['men', 'women', 'kids'] as const).map((key) => {
      const strip = byKey.get(key)
      const fallbackImage = key === 'kids'
        ? SEGMENT_HUB_COVERS.kids
        : key === 'men'
          ? categoryStripCovers.men
          : categoryStripCovers.saree
      return {
        key,
        name: key === 'women' ? 'Women' : key === 'kids' ? 'KID' : strip?.label || (key === 'men' ? 'Men' : 'KID'),
        href: strip?.href || `/${key}`,
        image: strip?.image || fallbackImage,
        imagePosition: strip?.imagePosition || 'center top',
      }
    })
  }, [categoryStrips])

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
  const brandPromiseEnabled = homepageContent.sections.find((section) => section.key === 'brandPromise')?.enabled !== false

  return (
    <div className="relative isolate bg-white pb-12">
      {heroEnabled ? <Hero content={homepageContent} /> : null}

      {shopByCategoryEnabled ? (
        <ShopByCategorySection
          items={hubCategoryItems}
          eyebrow={homepageContent.featuredCollectionEyebrow ?? 'Featured collections'}
          title={homepageContent.featuredCollectionTitle?.trim() || 'SHOP BY CATEGORY'}
        />
      ) : null}

      <section
        id="homepage-gallery"
        className="relative w-full overflow-hidden bg-neutral-950 min-h-[85vh] md:min-h-0 md:h-[85vh] md:max-h-[850px]"
        aria-label="SHIS Fashion gallery"
      >
        <img
          src={HOMEPAGE_GALLERY_IMAGE}
          alt="SHIS Fashion community gallery"
          width={959}
          height={1280}
          sizes="100vw"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
          onError={(event) => {
            const image = event.currentTarget
            if (image.dataset.fallback === 'done') {
              return
            }
            if (image.dataset.fallback !== 'jpeg') {
              image.dataset.fallback = 'jpeg'
              image.src = HOMEPAGE_GALLERY_IMAGE_FALLBACK
              return
            }
            image.dataset.fallback = 'done'
            image.src = '/og-image.svg'
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-black/25"
          aria-hidden
        />
      </section>

      {brandPromiseEnabled ? (
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
    </div>
  )
}
