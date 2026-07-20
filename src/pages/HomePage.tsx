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

const serviceHighlights = [
  { label: 'Free shipping', value: 'On orders over select thresholds' },
  { label: 'Premium quality', value: 'Designed for repeat wear' },
  { label: 'Easy returns', value: '7 day support window' },
  { label: 'Customer support', value: 'Fast response on WhatsApp' },
]

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

function SectionHeader({
  eyebrow,
  title,
  description,
  to,
  linkLabel,
}: {
  eyebrow: string
  title: string
  description?: string
  to?: string
  linkLabel?: string
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">{eyebrow}</p>
        <h2 className="mt-3 text-[2rem] font-bold leading-[0.96] text-[var(--color-text)] sm:text-[2.45rem]">{title}</h2>
        {description ? <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--color-muted)] sm:text-[0.98rem]">{description}</p> : null}
      </div>
      {to && linkLabel ? (
        <Link to={to} className="hidden shrink-0 items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text)] md:inline-flex">
          <span>{linkLabel}</span>
          <span aria-hidden className="text-base leading-none">→</span>
        </Link>
      ) : null}
    </div>
  )
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
    <div className="mt-6 sm:hidden">
      <div className="grid grid-cols-2 gap-3">
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
                <div className="px-2.5 pb-2.5 pt-2.5">
                  <h3 className="line-clamp-1 text-[11px] font-semibold tracking-[0.01em] text-[var(--color-text)]">{item.name}</h3>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold tracking-[0.02em] text-[var(--color-accent)]">{item.price}</p>
                    <span className="rounded-full border border-[var(--color-border)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                      {item.stock > 0 ? 'In stock' : 'Sold out'}
                    </span>
                  </div>
                  <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text)]/80">View details</p>
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
    <div className="-mx-4 mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
      {products.map((item, index) => {
        const productImage = normalizeCatalogImageUrl(getManagedImageEntries(item, 1)[0]?.url ?? '', 900, 1125)
        const toneClass = isDemoImageUrl(productImage) ? 'shis-media-tone' : ''

        return (
          <motion.div key={item.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.25, delay: index * 0.06 }} className="min-w-[15.5rem] snap-start md:min-w-0">
            <Link to={productHref(item)} className="group block overflow-hidden rounded-[1.6rem] bg-transparent">
              <div className="relative overflow-hidden rounded-[1.4rem] bg-[var(--color-surface)] shadow-[0_16px_34px_rgba(17,17,17,0.08)]">
                <img src={productImage || IMAGE_PLACEHOLDER} alt={item.name} loading="lazy" decoding="async" onError={handleImageError} className={`h-56 w-full object-cover sm:h-64 ${toneClass}`} />
                <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/88 text-[#111111] shadow-[0_6px_18px_rgba(17,17,17,0.12)] backdrop-blur-sm">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s-6.7-4.35-9.1-8.06C1.26 10.48 2.3 6.9 5.64 5.58c2.17-.86 4.08-.14 5.36 1.42 1.28-1.56 3.19-2.28 5.36-1.42 3.34 1.32 4.38 4.9 2.74 7.36C18.7 16.65 12 21 12 21Z" />
                  </svg>
                </div>
              </div>
              <div className="px-1 pb-1 pt-3">
                <h3 className="line-clamp-1 text-[1.02rem] font-semibold text-[var(--color-text)]">{item.name}</h3>
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <p className="text-lg font-bold leading-none text-[var(--color-text)]">{item.price}</p>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                    {item.stock > 0 ? 'In stock' : 'Sold out'}
                  </span>
                </div>
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
        <section className="px-4 pb-8 pt-4 sm:px-6 lg:px-8 lg:pb-12 lg:pt-6">
          <Container>
            <div className="overflow-hidden rounded-[2rem] bg-[#090909] shadow-[0_30px_60px_rgba(0,0,0,0.16)]">
              <div className="relative min-h-[27rem] sm:min-h-[34rem] lg:min-h-[38rem]">
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
                    className={`absolute inset-0 h-full w-full object-cover object-[68%_24%] ${isDemoImageUrl(heroImage) ? 'shis-media-tone' : ''}`}
                  />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,#0d0d0d,#2c2c2c)]" />
                )}

                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,9,0.96)_0%,rgba(9,9,9,0.82)_34%,rgba(9,9,9,0.38)_66%,rgba(9,9,9,0.06)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_26%,rgba(255,255,255,0.08),transparent_32%)]" />

                <Container className="relative z-10 flex min-h-[27rem] items-center px-6 py-8 sm:min-h-[34rem] sm:px-10 lg:min-h-[38rem] lg:px-12">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="max-w-[16rem] sm:max-w-[23rem] lg:max-w-[27rem]"
                  >
                    <p className="text-[0.82rem] font-semibold uppercase tracking-[0.34em] text-white/76">{homepageContent.heroEyebrow ?? 'SHIS FASHION'}</p>
                    <h1 className="mt-4 text-[3.35rem] font-bold leading-[0.88] text-white sm:text-[4.7rem] lg:text-[5.7rem]">{homepageContent.heroTitle}</h1>
                    <p className="mt-5 max-w-sm text-base leading-7 text-white/82 sm:text-lg">{homepageContent.heroSubtitle}</p>
                    <div className="mt-7 flex flex-wrap gap-3">
                      <Button
                        to={homepageContent.heroPrimaryLink ?? '/shop'}
                        className="min-w-[11.5rem] rounded-[1rem] border-white bg-white px-7 py-3 text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-[#111111] shadow-[0_16px_32px_rgba(255,255,255,0.12)] hover:border-[#f3ede4] hover:bg-[#f3ede4]"
                      >
                        {homepageContent.heroCta}
                      </Button>
                      <Button
                        to={homepageContent.heroSecondaryLink ?? '/shop/new-arrivals'}
                        variant="secondary"
                        className="min-w-[10rem] rounded-[1rem] border-white/22 bg-white/8 px-6 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm hover:border-white/40 hover:bg-white/12 hover:text-white"
                      >
                        {homepageContent.heroSecondaryCta}
                      </Button>
                    </div>
                    {homepageContent.heroImageDescription ? <p className="mt-5 max-w-xs text-xs leading-6 text-white/58">{homepageContent.heroImageDescription}</p> : null}
                  </motion.div>
                </Container>

                <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/12 bg-black/18 px-4 py-2 backdrop-blur-sm">
                  <span className="h-1.5 w-7 rounded-full bg-white/90" />
                  <span className="h-1.5 w-7 rounded-full bg-white/35" />
                  <span className="h-1.5 w-7 rounded-full bg-white/35" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-3 border-b border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.16))] px-2 py-6 sm:grid-cols-4 sm:px-6 lg:px-10">
              {serviceHighlights.map((item) => (
                <div key={item.label} className="flex min-h-24 flex-col items-center justify-center border-r border-[var(--color-border)] px-3 text-center last:border-r-0 [&:nth-child(2n)]:border-r-0 sm:[&:nth-child(2n)]:border-r sm:[&:last-child]:border-r-0">
                  <p className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-text)]">{item.label}</p>
                  <p className="mt-1 max-w-[11rem] text-[0.72rem] leading-5 text-[var(--color-muted)]">{item.value}</p>
                </div>
              ))}
            </div>
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
        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <Container>
            <SectionTitle
              eyebrow={homepageContent.featuredCollectionEyebrow ?? 'Featured collection'}
              title={homepageContent.featuredCollectionTitle ?? 'Premium categories for every moment'}
              description={homepageContent.featuredCollectionSubtitle ?? 'A calm, editorial approach to wardrobe essentials designed to feel as luxurious as they look.'}
              align="center"
            />
            <MobileProductGrid products={mobileFeaturedProducts} />
            <div className="mt-7 grid gap-3 sm:grid-cols-3 sm:gap-4">
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
        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <Container>
            <SectionHeader
              eyebrow={homepageContent.newArrivalsEyebrow ?? 'New arrivals'}
              title={homepageContent.newArrivalsTitle}
              description={homepageContent.newArrivalsSubtitle}
              to="/shop/new-arrivals"
              linkLabel="View all"
            />
            <ProductRail products={newArrivals} />
            <div className="mt-6 flex md:hidden">
              <Link to="/shop/new-arrivals" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-text)]">
                <span>View all</span>
                <span aria-hidden className="text-base leading-none">→</span>
              </Link>
            </div>
          </Container>
        </section>
      ),
    } : null,
    bestSellersConfig?.enabled !== false ? {
      key: 'bestSellers',
      order: bestSellersConfig?.order ?? 3,
      node: (
        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
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
        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
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
