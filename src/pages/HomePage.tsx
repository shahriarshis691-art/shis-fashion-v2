import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Container from '../components/ui/Container'
import SectionTitle from '../components/ui/SectionTitle'
import ShopByCategorySection from '../components/home/ShopByCategorySection'
import { homeCategoryItems } from '../data/homeCategories'
import { subscribeToHomepageContent, subscribeToProducts, type AdminProduct, type HomepageContent } from '../firebase/adminService'
import { getManagedImageEntries, isDemoImageUrl, normalizeCatalogImageUrl } from '../utils/media'

const defaultHomepage: HomepageContent = {
  navbarBrandPrimary: 'Shis',
  navbarBrandSecondary: 'Fashion',
  navbarSearchPlaceholder: 'Search products',
  heroEyebrow: 'SHIS FASHION',
  heroTitle: 'Style Meets Comfort.',
  heroSubtitle: 'Discover elevated staples designed for modern living, with premium materials and an effortless silhouette that turns every look into a statement.',
  heroCta: 'Shop Collection',
  heroPrimaryLink: '/shop',
  heroSecondaryCta: 'New Arrivals',
  heroSecondaryLink: '/shop/new-arrivals',
  heroImageTitle: 'Homepage hero image',
  heroImageDescription: 'Main hero visual used for the opening section of the homepage.',
  bannerImageTitle: 'Featured banner image',
  bannerImageDescription: 'Editorial banner image used in the brand promise section.',
  categories: [
    { title: 'Tailored Layers', caption: 'Soft authority' },
    { title: 'Everyday Luxe', caption: 'Refined comfort' },
    { title: 'Evening Edit', caption: 'Quiet glamour' },
  ],
  shopByCategories: homeCategoryItems.map((item) => ({
    title: item.name,
    href: item.href,
    image: item.image,
  })),
  featuredCollectionEyebrow: 'Featured collection',
  featuredCollectionTitle: 'Premium categories for every moment',
  featuredCollectionSubtitle: 'A calm, editorial approach to wardrobe essentials designed to feel as luxurious as they look.',
  newArrivalsEyebrow: 'New arrivals',
  newArrivalsTitle: 'Freshly composed for the season',
  newArrivalsSubtitle: 'Newly released pieces with an effortless, sculpted feel.',
  bestSellerEyebrow: 'Best seller',
  featuredTitle: 'The pieces clients return for',
  featuredSubtitle: 'Soft structure, refined texture, and everyday ease in every silhouette.',
  brandPromiseEyebrow: 'Brand promise',
  brandPromiseTitle: 'Luxury that feels personal.',
  brandPromiseDescription: 'SHIS Fashion is shaped by an obsession with texture, ease, and timeless silhouettes that make everyday dressing feel serene and elevated.',
  brandSignatureLabel: 'Signature',
  brandSignatureText: 'Quiet luxury, elevated comfort, and a wardrobe that moves effortlessly from morning to midnight.',
  footerBrandTitle: 'Style Meets Comfort',
  footerDescription: 'A refined digital presence for modern luxury, designed with comfort, clarity, and effortless elegance in mind.',
  footerContactEmail: 'shisfashion18@gmail.com',
  footerContactPhone: '+88 01887848304',
  footerContactAddress: 'Mirpur, Dhaka',
  footerBottomText: 'Crafted for premium, calm, and timeless browsing.',
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

const IMAGE_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"%3E%3Crect width="1200" height="1200" fill="%23f8f5ed"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="%23c9a227"%3ESHIS Fashion%3C/text%3E%3C/svg%3E'

function handleImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.src = IMAGE_PLACEHOLDER
}

function MobileProductGrid({ products }: { products: AdminProduct[] }) {
  const [visibleCount, setVisibleCount] = useState(() => Math.min(9, products.length))
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const displayedProducts = products.slice(0, visibleCount)
  const canLoadMore = visibleCount < products.length

  useEffect(() => {
    if (!canLoadMore || !sentinelRef.current) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + 6, products.length))
        }
      },
      { rootMargin: '160px 0px' }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [canLoadMore, products.length])

  return (
    <div className="mt-7 sm:hidden">
      <div className="grid grid-cols-3 gap-2.5">
        {displayedProducts.map((item, index) => {
          const productImage = normalizeCatalogImageUrl(getManagedImageEntries(item, 1)[0]?.url ?? '', 520, 650)
          const toneClass = isDemoImageUrl(productImage) ? 'shis-media-tone' : ''

          return (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
            >
              <Link
                to={productHref(item)}
                className="group block overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
                aria-label={item.name}
              >
                <div className="aspect-[4/5] overflow-hidden bg-[var(--color-bg)]">
                  <img
                    src={productImage || IMAGE_PLACEHOLDER}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    onError={handleImageError}
                    className={`h-full w-full object-cover transition duration-300 group-hover:scale-[1.02] ${toneClass}`}
                  />
                </div>
                <div className="px-2 pb-2 pt-2.5">
                  <h3 className="line-clamp-1 text-[11px] font-medium tracking-[0.01em] text-[var(--color-text)]">{item.name}</h3>
                  <p className="mt-1 text-[11px] font-semibold tracking-[0.02em] text-[var(--color-accent)]">{item.price}</p>
                </div>
              </Link>
            </motion.article>
          )
        })}
      </div>
      {canLoadMore ? <div ref={sentinelRef} className="h-8" aria-hidden /> : null}
    </div>
  )
}

function ProductRail({ products }: { products: AdminProduct[] }) {
  return (
    <div className="mt-8 grid gap-6 grid-cols-2 md:grid-cols-2 xl:grid-cols-4">
      {products.map((item, index) => {
        const productImage = normalizeCatalogImageUrl(getManagedImageEntries(item, 1)[0]?.url ?? '', 900, 1125)
        const toneClass = isDemoImageUrl(productImage) ? 'shis-media-tone' : ''

        return (
          <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.25, delay: index * 0.06 }}>
            <Link to={productHref(item)} className="block overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90">
              <img src={productImage || IMAGE_PLACEHOLDER} alt={item.name} loading="lazy" decoding="async" onError={handleImageError} className={`h-44 w-full object-cover sm:h-56 lg:h-64 ${toneClass}`} />
              <div className="p-4">
                <h3 className="text-base font-semibold text-[var(--color-text)]">{item.name}</h3>
                <p className="mt-2 text-sm font-semibold text-[var(--color-accent)]">{item.price}</p>
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function HomePage() {
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(defaultHomepage)
  const [products, setProducts] = useState<AdminProduct[]>(defaultProducts)

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => setHomepageContent(content))
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToProducts((nextProducts) => setProducts(nextProducts.length ? nextProducts : defaultProducts))
    return unsubscribe
  }, [])

  const featuredProducts = useMemo(() => {
    const flagged = products.filter((product) => product.featured)
    return (flagged.length ? flagged : products).slice(0, 4)
  }, [products])

  const newArrivals = useMemo(() => {
    const flagged = products.filter((product) => product.newArrival)
    return (flagged.length ? flagged : products).slice(0, 4)
  }, [products])

  const bestSellers = useMemo(() => {
    const ranked = [...products].sort((left, right) => right.stock - left.stock)
    return ranked.slice(0, 4)
  }, [products])

  const mobileFeaturedProducts = useMemo(() => {
    const curated = [...newArrivals, ...featuredProducts, ...products]
    const seen = new Set<string>()
    return curated.filter((item) => {
      if (seen.has(item.id)) {
        return false
      }
      seen.add(item.id)
      return true
    })
  }, [featuredProducts, newArrivals, products])

  const heroImage = normalizeCatalogImageUrl(homepageContent.heroImage ?? '', 1400, 900)
  const bannerImage = normalizeCatalogImageUrl(homepageContent.bannerImage ?? '', 1400, 900)
  const heroVideo = homepageContent.heroVideo
  const orderedSections = useMemo(() => [...(homepageContent.sections?.length ? homepageContent.sections : defaultHomepage.sections)].sort((left, right) => left.order - right.order), [homepageContent.sections])
  const sectionMap = useMemo(() => new Map(orderedSections.map((section) => [section.key, section] as const)), [orderedSections])

  const heroConfig = sectionMap.get('hero')
  const featuredCollectionConfig = sectionMap.get('featuredCollection')
  const newArrivalsConfig = sectionMap.get('newArrivals')
  const bestSellersConfig = sectionMap.get('bestSellers')
  const brandPromiseConfig = sectionMap.get('brandPromise')
  const shopByCategoryCards = useMemo(() => {
    const rawItems = homepageContent.shopByCategories?.length
      ? homepageContent.shopByCategories
      : defaultHomepage.shopByCategories

    return rawItems.map((item, index) => ({
      key: `shop-by-${index}`,
      name: item.title || homeCategoryItems[index]?.name || `Category ${index + 1}`,
      href: item.href || homeCategoryItems[index]?.href || '/shop',
      image: item.image || homeCategoryItems[index]?.image || '',
    }))
  }, [homepageContent.shopByCategories])

  const sectionNodes = [
    heroConfig?.enabled !== false ? {
      key: 'hero',
      order: heroConfig?.order ?? 0,
      node: (
        <section className="relative -mt-24 h-[100svh] min-h-[560px] overflow-hidden">
          {heroVideo ? (
            <video
              src={heroVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={heroImage || undefined}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : heroImage ? (
            <img
              src={heroImage}
              alt={homepageContent.heroImageTitle || 'Hero media'}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onError={handleImageError}
              className={`absolute inset-0 h-full w-full object-cover object-[center_22%] ${isDemoImageUrl(heroImage) ? 'shis-media-tone' : ''}`}
            />
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(201,162,39,0.22),rgba(17,17,17,0.2))]" />
          )}

          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,9,0.08)_0%,rgba(9,9,9,0.36)_52%,rgba(9,9,9,0.72)_100%)]" />

          <Container className="relative z-10 flex h-full items-end px-4 pb-8 pt-16 sm:px-6 sm:pb-12 lg:px-8 lg:pb-14">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="max-w-[20rem] sm:max-w-xl"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/90 sm:text-xs">{homepageContent.heroEyebrow ?? 'SHIS FASHION'}</p>
              <h1 className="mt-2 text-[2rem] font-semibold leading-[0.98] tracking-[-0.01em] text-white sm:mt-4 sm:text-5xl lg:text-6xl">{homepageContent.heroTitle}</h1>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/86 sm:mt-5 sm:text-base">{homepageContent.heroSubtitle}</p>
              {homepageContent.heroImageDescription ? <p className="mt-3 max-w-md text-xs leading-6 text-white/70 sm:text-sm">{homepageContent.heroImageDescription}</p> : null}
              <div className="mt-6 flex flex-wrap gap-3 sm:mt-8 sm:gap-4">
                <Button
                  to={homepageContent.heroPrimaryLink ?? '/shop'}
                  className="min-w-[11rem] border-[#ead8b7] bg-[linear-gradient(135deg,#fdf8ee_0%,#f3e7cf_52%,#e9d4ae_100%)] px-7 text-[0.82rem] font-semibold tracking-[0.08em] text-[#2f2516] shadow-[0_14px_32px_rgba(16,12,6,0.25)] hover:border-[#f4e5ca] hover:bg-[linear-gradient(135deg,#fffdf8_0%,#f7edd8_52%,#ecdab9_100%)] hover:text-[#21180d]"
                >
                  {homepageContent.heroCta}
                </Button>
                <Button
                  to={homepageContent.heroSecondaryLink ?? '/shop/new-arrivals'}
                  variant="secondary"
                  className="min-w-[10rem] border-[#f0e4cd]/90 bg-[#f8f1e2]/20 px-6 text-[0.8rem] font-semibold tracking-[0.08em] text-[#fff7e8] backdrop-blur-[2px] hover:border-[#fff2d7] hover:bg-[#fff5e4]/28 hover:text-[#fffaf0]"
                >
                  {homepageContent.heroSecondaryCta}
                </Button>
              </div>
            </motion.div>
          </Container>
        </section>
      ),
    } : null,
    {
      key: 'shopByCategory',
      order: (heroConfig?.order ?? 0) + 0.5,
      node: <ShopByCategorySection items={shopByCategoryCards} />,
    },
    featuredCollectionConfig?.enabled !== false ? {
      key: 'featuredCollection',
      order: featuredCollectionConfig?.order ?? 1,
      node: (
        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <Container>
            <SectionTitle
              eyebrow={homepageContent.featuredCollectionEyebrow ?? 'Featured collection'}
              title={homepageContent.featuredCollectionTitle ?? 'Premium categories for every moment'}
              description={homepageContent.featuredCollectionSubtitle ?? 'A calm, editorial approach to wardrobe essentials designed to feel as luxurious as they look.'}
              align="center"
            />
            <MobileProductGrid products={mobileFeaturedProducts} />
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {homepageContent.categories.map((category, index) => {
                const categoryImage = normalizeCatalogImageUrl(category.image ?? '', 900, 600)
                const toneClass = isDemoImageUrl(categoryImage) ? 'shis-media-tone' : ''

                return (
                  <motion.div key={category.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.25, delay: index * 0.06 }} className="hidden sm:block">
                    <Card className="h-full rounded-[1.5rem]">
                      {categoryImage ? <img src={categoryImage} alt={category.title} loading="lazy" decoding="async" onError={handleImageError} className={`h-28 w-full rounded-[1.25rem] object-cover ${toneClass}`} /> : <div className="h-28 rounded-[1.25rem] bg-[linear-gradient(135deg,rgba(201,162,39,0.22),rgba(17,17,17,0.08))]" />}
                      <h3 className="mt-4 text-lg font-semibold text-[var(--color-text)]">{category.title}</h3>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">{category.caption}</p>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </Container>
        </section>
      ),
    } : null,
    newArrivalsConfig?.enabled !== false ? {
      key: 'newArrivals',
      order: newArrivalsConfig?.order ?? 2,
      node: (
        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <Container>
            <SectionTitle eyebrow={homepageContent.newArrivalsEyebrow ?? 'New arrivals'} title={homepageContent.newArrivalsTitle} description={homepageContent.newArrivalsSubtitle} />
            <ProductRail products={newArrivals} />
          </Container>
        </section>
      ),
    } : null,
    bestSellersConfig?.enabled !== false ? {
      key: 'bestSellers',
      order: bestSellersConfig?.order ?? 3,
      node: (
        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <Container>
            <SectionTitle eyebrow={homepageContent.bestSellerEyebrow ?? 'Best seller'} title={homepageContent.featuredTitle} description={homepageContent.featuredSubtitle} />
            <ProductRail products={featuredProducts.length ? featuredProducts : bestSellers} />
          </Container>
        </section>
      ),
    } : null,
    brandPromiseConfig?.enabled !== false ? {
      key: 'brandPromise',
      order: brandPromiseConfig?.order ?? 4,
      node: (
        <section className="px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <Container>
            <div className="grid gap-8 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
              <div className="order-2 lg:order-1">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">{homepageContent.brandPromiseEyebrow ?? 'Brand promise'}</p>
                <h2 className="mt-4 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl lg:text-4xl">{homepageContent.brandPromiseTitle ?? 'Luxury that feels personal.'}</h2>
                <p className="mt-4 text-sm leading-7 text-[var(--color-muted)] sm:text-base sm:leading-8">{homepageContent.brandPromiseDescription ?? 'SHIS Fashion is shaped by an obsession with texture, ease, and timeless silhouettes that make everyday dressing feel serene and elevated.'}</p>
              </div>
              <div className="order-1 rounded-[1.5rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,rgba(201,162,39,0.16),rgba(255,255,255,0.6))] p-5 sm:p-6 lg:order-2">
                {bannerImage ? <img src={bannerImage} alt={homepageContent.bannerImageTitle || 'Featured banner'} loading="lazy" decoding="async" onError={handleImageError} className={`mb-4 h-44 w-full rounded-[1.25rem] object-cover object-[center_22%] sm:h-48 ${isDemoImageUrl(bannerImage) ? 'shis-media-tone' : ''}`} /> : null}
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">{homepageContent.brandSignatureLabel ?? 'Signature'}</p>
                <p className="mt-3 text-base leading-7 text-[var(--color-text)] sm:text-lg sm:leading-8">{homepageContent.brandSignatureText ?? 'Quiet luxury, elevated comfort, and a wardrobe that moves effortlessly from morning to midnight.'}</p>
                {homepageContent.bannerImageDescription ? <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{homepageContent.bannerImageDescription}</p> : null}
              </div>
            </div>
          </Container>
        </section>
      ),
    } : null,
  ].filter(Boolean).sort((left, right) => left!.order - right!.order) as Array<{ key: string; order: number; node: ReactNode }>

  return (
    <>
      {sectionNodes.map((section) => <Fragment key={section.key}>{section.node}</Fragment>)}
    </>
  )
}
