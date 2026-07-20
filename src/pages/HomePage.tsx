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
  { label: 'Nationwide delivery', value: 'Fast dispatch across Bangladesh' },
  { label: 'Premium finishing', value: 'Built for repeat wear and clean structure' },
  { label: 'COD checkout', value: 'Simple ordering with delivery confirmation' },
  { label: 'Direct support', value: 'Quick help through phone and WhatsApp' },
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
    { title: 'Winter', caption: 'Winter.', href: '/collections/winter' },
    { title: 'Summer', caption: 'Summer.', href: '/collections/summer' },
    { title: 'Everyday Wear', caption: 'Everyday wear.', href: '/collections/everyday-wear' },
  ],
  featuredCollectionPages: [
    {
      slug: 'winter',
      title: 'Winter Collection',
      subtitle: 'Layer-ready staples',
      description: 'Cold-season essentials with premium texture and clean tailoring.',
      href: '/collections/winter',
      images: [
        'https://images.unsplash.com/photo-1516822003754-cca485356ecb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=1200&q=80',
      ],
      relatedCategorySlugs: ['denim', 'mens-shirt', 'western-outfits'],
    },
    {
      slug: 'summer',
      title: 'Summer Collection',
      subtitle: 'Breathable premium edits',
      description: 'Lightweight silhouettes designed for warm days and evening plans.',
      href: '/collections/summer',
      images: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1464863979621-258859e62245?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1503342452485-86ff0a5a2f6f?auto=format&fit=crop&w=1200&q=80',
      ],
      relatedCategorySlugs: ['unisex-tee', 'womens-dresses', 'oversized-tee'],
    },
    {
      slug: 'everyday-wear',
      title: 'Everyday Wear',
      subtitle: 'Daily go-to luxury',
      description: 'Reliable daily pieces balancing comfort, polish, and movement.',
      href: '/collections/everyday-wear',
      images: [
        'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80',
      ],
      relatedCategorySlugs: ['oversized-tee', 'couples', 'kids'],
    },
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

function getWhatsAppHref(phone?: string) {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (!digits) {
    return 'https://wa.me/8801887848304'
  }

  const normalized = digits.startsWith('88') ? digits : `88${digits}`
  return `https://wa.me/${normalized}`
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
        <h2 className="mt-3 font-sans text-[1.75rem] font-bold leading-[1] text-[var(--color-text)] sm:text-[2.15rem]">{title}</h2>
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
                  <h3 className="line-clamp-1 text-[12px] font-semibold tracking-[0.01em] text-[var(--color-text)]">{item.name}</h3>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold tracking-[0.02em] text-[var(--color-accent)]">{item.price}</p>
                    <span className="rounded-full border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                      {item.stock > 0 ? 'In stock' : 'Sold out'}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text)]/80">View details</p>
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
              <div className="overflow-hidden rounded-[1.35rem] bg-[var(--color-surface)] shadow-[0_14px_30px_rgba(17,17,17,0.08)]">
                <img src={productImage || IMAGE_PLACEHOLDER} alt={item.name} loading="lazy" decoding="async" onError={handleImageError} className={`h-56 w-full object-cover sm:h-64 ${toneClass}`} />
              </div>
              <div className="px-1 pb-1 pt-3.5">
                <h3 className="line-clamp-1 font-sans text-[1rem] font-semibold text-[var(--color-text)]">{item.name}</h3>
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <p className="text-base font-bold leading-none text-[var(--color-text)]">{item.price}</p>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
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
  const heroVideo = homepageContent.heroVideo
  const supportWhatsappHref = useMemo(() => getWhatsAppHref(homepageContent.footerContactPhone), [homepageContent.footerContactPhone])
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
        <section className="px-0 pb-8 pt-0 lg:pb-12">
          <div className="overflow-hidden bg-[#111111]">
            <div className="relative min-h-[23rem] sm:min-h-[31rem] lg:min-h-[36rem]">
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
                  className={`absolute inset-0 h-full w-full object-cover object-center ${isDemoImageUrl(heroImage) ? 'shis-media-tone' : ''}`}
                />
              ) : (
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#0d0d0d,#2c2c2c)]" />
              )}

              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.76)_0%,rgba(10,10,10,0.56)_42%,rgba(10,10,10,0.2)_74%,rgba(10,10,10,0.03)_100%)]" />

              <div className="relative z-10 flex min-h-[23rem] items-center px-5 py-8 sm:min-h-[31rem] sm:px-10 lg:min-h-[36rem] lg:px-12">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="max-w-[14.8rem] sm:max-w-[21rem] lg:max-w-[24rem]"
                >
                  <h1 className="home-hero-title font-sans text-[2.45rem] font-bold leading-[0.9] tracking-[-0.03em] text-white sm:text-[4.1rem] lg:text-[5rem]">{homepageContent.heroTitle}</h1>
                  <div className="mt-6 flex max-w-[12.75rem] flex-col gap-2.5 sm:max-w-none sm:flex-row sm:flex-wrap">
                    <Button
                      to={homepageContent.heroPrimaryLink ?? '/shop'}
                      className="min-w-[11.25rem] rounded-full border-white/10 bg-black/78 px-6 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.24)] backdrop-blur-md hover:border-white/18 hover:bg-black/84 hover:text-white"
                    >
                      {homepageContent.heroCta}
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          <div className="mx-auto mt-3 w-full max-w-7xl px-3 sm:mt-4 sm:px-6 lg:px-8">
            <div className="relative after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-8 after:bg-gradient-to-l after:from-[#090909] after:to-transparent after:content-[''] sm:after:hidden">
              <div className="-mx-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-2.5 sm:overflow-visible sm:px-0 sm:pb-0">
              {serviceHighlights.map((item) => (
                <div key={item.label} className="min-w-[15.2rem] snap-start rounded-[0.95rem] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-2.5 py-2.5 text-center shadow-[0_10px_22px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:min-w-0 sm:rounded-[1.05rem] sm:px-3 sm:py-3">
                  <p className="text-[0.69rem] font-semibold uppercase tracking-[0.11em] text-[var(--color-text)] sm:text-[0.72rem]">{item.label}</p>
                  <p className="mt-1 line-clamp-2 text-[0.68rem] leading-4 text-[var(--color-muted)] sm:text-[0.7rem] sm:leading-5">{item.value}</p>
                </div>
              ))}
              </div>
            </div>
            <p className="mt-1.5 px-1 text-[0.58rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)] sm:hidden">Swipe for more</p>
          </div>
        </section>
      ),
    } : null,
    {
      key: 'shopByCategory',
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
                const categoryHref = category.href || `/collections/${category.title.toLowerCase().replace(/\s+/g, '-')}`

                return (
                  <motion.div key={category.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.25, delay: index * 0.06 }} className="hidden sm:block">
                    <Link to={categoryHref} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]">
                      <Card className="h-full rounded-[1.5rem] transition hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(17,17,17,0.1)]">
                        {categoryImage ? <img src={categoryImage} alt={category.title} loading="lazy" decoding="async" onError={handleImageError} className={`h-28 w-full rounded-[1.25rem] object-cover ${toneClass}`} /> : <div className="h-28 rounded-[1.25rem] bg-[linear-gradient(135deg,rgba(201,162,39,0.22),rgba(17,17,17,0.08))]" />}
                        <h3 className="mt-4 text-lg font-semibold text-[var(--color-text)]">{category.title}</h3>
                        <p className="mt-2 text-sm text-[var(--color-muted)]">{category.caption}</p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">View collection</p>
                      </Card>
                    </Link>
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
            <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] sm:p-8 lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">{homepageContent.brandPromiseEyebrow ?? 'Brand promise'}</p>
              <h2 className="mt-4 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl lg:text-4xl">{homepageContent.brandPromiseTitle ?? 'Luxury that feels personal.'}</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)] sm:text-base sm:leading-8">{homepageContent.brandPromiseDescription ?? 'SHIS Fashion is shaped by an obsession with texture, ease, and timeless silhouettes that make everyday dressing feel serene and elevated.'}</p>
            </div>
          </Container>
        </section>
      ),
    } : null,
    {
      key: 'allProducts',
      order: 5,
      node: (
        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <Container>
            <SectionHeader
              eyebrow="All products"
              title="Browse the full collection"
              description="Scroll through every live product available on SHIS Fashion."
              to="/shop"
              linkLabel="Open shop"
            />
            <ProductRail products={products} />
          </Container>
        </section>
      ),
    },
  ].filter(Boolean) as Array<{ key: string; order: number; node: ReactNode }>

  sectionNodes.sort((left, right) => left.order - right.order)

  return (
    <>
      {sectionNodes.map((section) => <Fragment key={section.key}>{section.node}</Fragment>)}

      <div className="h-20 sm:hidden" aria-hidden />
      <div className="fixed inset-x-3 bottom-3 z-40 sm:hidden">
        <div className="grid grid-cols-2 gap-2 rounded-[1.05rem] border border-white/10 bg-[#0b0b0b]/95 p-2 shadow-[0_14px_34px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <Link to={homepageContent.heroPrimaryLink ?? '/shop'} className="inline-flex items-center justify-center rounded-[0.8rem] border border-white/14 bg-white/6 px-3 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-white">
            Shop collection
          </Link>
          <a href={supportWhatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-[0.8rem] border border-[rgba(210,180,122,0.32)] bg-[rgba(210,180,122,0.12)] px-3 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent)]">
            Size help
          </a>
        </div>
      </div>
    </>
  )
}
