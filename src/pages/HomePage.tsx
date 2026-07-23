import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Container from '../components/ui/Container'
import { homeCategoryItems } from '../data/homeCategories'
import {
  subscribeToHomepageContent,
  subscribeToProducts,
  type AdminProduct,
  type HomepageContent,
} from '../firebase/adminService'
import { getManagedImageEntries, isDemoImageUrl, normalizeCatalogImageUrl } from '../utils/media'

const lockedCategoryLinks = [
  { label: 'Women', href: '/women' },
  { label: 'Men', href: '/men' },
  { label: 'Kids', href: '/kids' },
  { label: 'Sale', href: '/sale' },
  { label: 'New Arrivals', href: '/shop/new-arrivals' },
]

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

function isSectionEnabled(content: HomepageContent, key: string) {
  const matched = content.sections.find((section) => section.key === key)
  return matched?.enabled ?? true
}

export default function HomePage() {
  const [homepageContent, setHomepageContent] = useState<HomepageContent>(defaultHomepage)
  const [products, setProducts] = useState<AdminProduct[]>(defaultProducts)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterMessage, setNewsletterMessage] = useState('')

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
    const contentImages = homepageContent.shopByCategories ?? []

    return lockedCategoryLinks.map((item, index) => {
      const fallback = homeCategoryItems[index]?.image ?? ''
      const fromContent = contentImages[index]?.image ?? ''
      const image = normalizeCatalogImageUrl(fromContent || fallback, 1200, 900)

      return {
        ...item,
        image,
      }
    })
  }, [homepageContent.shopByCategories])

  const newArrivals = useMemo(() => {
    const flagged = products.filter((product) => product.newArrival)
    return (flagged.length ? flagged : products).slice(0, 8)
  }, [products])

  const bestSellers = useMemo(() => {
    const flagged = products.filter((product) => product.featured)
    return (flagged.length ? flagged : products).slice(0, 6)
  }, [products])

  const featuredCollections = useMemo(() => {
    const configured = homepageContent.featuredCollectionPages.filter((page) =>
      Boolean(page?.slug?.trim() && page?.title?.trim()),
    )

    if (configured.length) {
      return configured.slice(0, 3)
    }

    return homepageContent.categories.slice(0, 3).map((category, index) => {
      const slug = category.href?.split('/').filter(Boolean).pop() || `collection-${index + 1}`
      return {
        slug,
        title: category.title,
        subtitle: category.caption,
        description: category.caption,
        href: category.href || `/collections/${slug}`,
        images: [category.image || categoryStrips[index]?.image || heroImage],
        relatedCategorySlugs: [],
      }
    })
  }, [categoryStrips, heroImage, homepageContent.categories, homepageContent.featuredCollectionPages])

  const handleNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newsletterEmail.trim()) {
      setNewsletterMessage('Please enter your email to subscribe.')
      return
    }

    setNewsletterMessage('Thank you. You are now on the SHIS Fashion list.')
    setNewsletterEmail('')
  }

  return (
    <div className="bg-white pb-20 sm:pb-24 lg:pb-28">
      {isSectionEnabled(homepageContent, 'hero') ? (
        <section className="border-b border-black/10 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pt-6">
          <Container>
            <div className="relative overflow-hidden rounded-[1.8rem] bg-black sm:rounded-[2.2rem]">
              <div className="relative aspect-[4/5] min-h-[24rem] sm:aspect-[16/10] sm:min-h-[30rem] lg:min-h-[38rem]">
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
                  <div className="absolute inset-0 bg-[linear-gradient(145deg,#1a1a1a,#434343)]" />
                )}

                <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(0,0,0,0.68)_8%,rgba(0,0,0,0.36)_48%,rgba(0,0,0,0.1)_100%)]" />

                <Container className="relative z-10 flex h-full items-end pb-10 pt-16 sm:items-center sm:py-0">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="max-w-[18rem] sm:max-w-[30rem]"
                  >
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/80">
                      {homepageContent.heroEyebrow || 'SHIS FASHION'}
                    </p>
                    <h1 className="mt-3 font-[var(--font-display)] text-[2.2rem] leading-[0.9] text-white sm:text-[3.5rem] lg:text-[4.5rem]">
                      {homepageContent.heroTitle}
                    </h1>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-white/86 sm:text-base">
                      {homepageContent.heroSubtitle}
                    </p>
                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <Link
                        to={homepageContent.heroPrimaryLink ?? '/shop'}
                        className="ui-interactive inline-flex items-center rounded-full border border-white bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90"
                      >
                        {homepageContent.heroCta || 'Shop now'}
                      </Link>
                      <Link
                        to={homepageContent.heroSecondaryLink ?? '/shop/new-arrivals'}
                        className="ui-interactive inline-flex items-center rounded-full border border-white/55 px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors duration-300 hover:border-white hover:bg-white/10"
                      >
                        {homepageContent.heroSecondaryCta || 'Explore arrivals'}
                      </Link>
                    </div>
                  </motion.div>
                </Container>
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      <section className="px-4 pt-14 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
        <Container>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/55">Category edit</p>
              <h2 className="mt-2 font-[var(--font-display)] text-[2rem] leading-none text-black sm:text-[2.6rem]">Shop by Category</h2>
            </div>
            <Link to="/shop" className="ui-interactive text-[11px] font-semibold uppercase tracking-[0.18em] text-black/70 transition-colors hover:text-black">
              View all products
            </Link>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {categoryStrips.map((item, index) => (
              <motion.article
                key={item.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <Link to={item.href} className="group block">
                  <div className="relative aspect-[11/14] overflow-hidden rounded-[1.1rem] bg-black/5">
                    <img
                      src={item.image || IMAGE_PLACEHOLDER}
                      alt={item.label}
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 48vw, 20vw"
                      onError={handleImageError}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4 flex items-center justify-between text-white">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">{item.label}</span>
                      <span aria-hidden className="text-lg leading-none">→</span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </Container>
      </section>

      {isSectionEnabled(homepageContent, 'newArrivals') ? (
        <section className="px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <Container>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/55">
                  {homepageContent.newArrivalsEyebrow ?? 'New arrivals'}
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-[2rem] leading-none text-black sm:text-[2.6rem]">
                  {homepageContent.newArrivalsTitle ?? 'New Arrivals'}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-black/70">{homepageContent.newArrivalsSubtitle}</p>
              </div>
              <Link
                to="/shop/new-arrivals"
                className="ui-interactive text-[11px] font-semibold uppercase tracking-[0.18em] text-black/70 transition-colors hover:text-black"
              >
                Shop now
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {newArrivals.map((item, index) => {
                const productImage = normalizeCatalogImageUrl(getManagedImageEntries(item, 1)[0]?.url ?? '', 900, 1125)
                const toneClass = isDemoImageUrl(productImage) ? 'shis-media-tone' : ''

                return (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                  >
                    <Link to={productHref(item)} className="group block">
                      <div className="overflow-hidden rounded-[1rem] border border-black/8 bg-white">
                        <div className="aspect-[4/5] overflow-hidden bg-black/5">
                          <img
                            src={productImage || IMAGE_PLACEHOLDER}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                            onError={handleImageError}
                            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.04] ${toneClass}`}
                          />
                        </div>
                        <div className="p-3.5">
                          <h3 className="line-clamp-1 text-[0.92rem] font-medium text-black">{item.name}</h3>
                          <p className="mt-1.5 text-sm font-semibold text-black">{item.price}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                )
              })}
            </div>
          </Container>
        </section>
      ) : null}

      {isSectionEnabled(homepageContent, 'bestSellers') ? (
        <section className="px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <Container>
            <div className="rounded-[1.6rem] border border-black/10 bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] p-5 sm:p-7 lg:p-9">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/55">
                    {homepageContent.bestSellerEyebrow ?? 'Best sellers'}
                  </p>
                  <h2 className="mt-2 font-[var(--font-display)] text-[1.9rem] leading-none text-black sm:text-[2.4rem]">
                    {homepageContent.featuredTitle ?? 'Most-loved pieces'}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-black/70">{homepageContent.featuredSubtitle}</p>
                </div>
                <Link to="/shop" className="ui-interactive text-[11px] font-semibold uppercase tracking-[0.18em] text-black/70 hover:text-black">
                  Explore shop
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {bestSellers.map((item, index) => {
                  const productImage = normalizeCatalogImageUrl(getManagedImageEntries(item, 1)[0]?.url ?? '', 900, 1125)
                  return (
                    <motion.article
                      key={`featured-${item.id}`}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.35, delay: index * 0.04 }}
                    >
                      <Link
                        to={productHref(item)}
                        className="group grid grid-cols-[5.2rem_1fr] gap-3 rounded-xl border border-black/10 bg-white p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-black/30"
                      >
                        <div className="aspect-square overflow-hidden rounded-lg bg-black/5">
                          <img
                            src={productImage || IMAGE_PLACEHOLDER}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            onError={handleImageError}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                          />
                        </div>
                        <div className="flex min-w-0 flex-col justify-center">
                          <p className="line-clamp-1 text-sm font-medium text-black">{item.name}</p>
                          <p className="mt-1 text-sm font-semibold text-black">{item.price}</p>
                        </div>
                      </Link>
                    </motion.article>
                  )
                })}
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      {isSectionEnabled(homepageContent, 'featuredCollection') ? (
        <section className="px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <Container>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/55">
                  {homepageContent.featuredCollectionEyebrow ?? 'Featured collections'}
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-[2rem] leading-none text-black sm:text-[2.6rem]">
                  {homepageContent.featuredCollectionTitle ?? 'Editorial Collections'}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-black/70">{homepageContent.featuredCollectionSubtitle}</p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {featuredCollections.map((collection, index) => {
                const image = normalizeCatalogImageUrl(collection.images?.[0] ?? '', 1100, 1400)
                const resolvedHref = collection.href?.trim() ? collection.href : `/collections/${collection.slug}`
                return (
                  <motion.article
                    key={collection.slug}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                  >
                    <Link to={resolvedHref} className="group block overflow-hidden rounded-[1.2rem] border border-black/10 bg-white">
                      <div className="aspect-[4/5] overflow-hidden bg-black/5">
                        <img
                          src={image || IMAGE_PLACEHOLDER}
                          alt={collection.title}
                          loading="lazy"
                          decoding="async"
                          onError={handleImageError}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                      </div>
                      <div className="p-4 sm:p-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/55">Collection</p>
                        <h3 className="mt-2 font-[var(--font-display)] text-[1.6rem] leading-none text-black">{collection.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-black/70">{collection.subtitle || collection.description}</p>
                      </div>
                    </Link>
                  </motion.article>
                )
              })}
            </div>
          </Container>
        </section>
      ) : null}

      {isSectionEnabled(homepageContent, 'brandPromise') ? (
        <section className="px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <Container>
            <div className="grid gap-6 rounded-[1.5rem] border border-black/10 bg-[#f8f8f8] p-6 sm:p-8 lg:grid-cols-2 lg:gap-10 lg:p-10">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/55">
                  {homepageContent.brandPromiseEyebrow ?? 'Our promise'}
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-[2rem] leading-none text-black sm:text-[2.5rem]">
                  {homepageContent.brandPromiseTitle ?? 'Quality, comfort, and consistency.'}
                </h2>
              </div>
              <div>
                <p className="text-sm leading-7 text-black/75">
                  {homepageContent.brandPromiseDescription ??
                    'SHIS Fashion focuses on better materials, thoughtful fits, and clean detailing to make everyday style easier.'}
                </p>
                <div className="mt-5 rounded-xl border border-black/10 bg-white p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/55">
                    {homepageContent.brandSignatureLabel ?? 'SHIS Signature'}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-black/75">
                    {homepageContent.brandSignatureText ??
                      'Minimal design language, balanced proportions, and soft everyday luxury.'}
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>
      ) : null}

      <section className="px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
            className="rounded-[1.5rem] border border-black/10 bg-white p-6 sm:p-8 lg:p-10"
          >
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/55">Newsletter</p>
              <h2 className="mt-2 font-[var(--font-display)] text-[2rem] leading-none text-black sm:text-[2.6rem]">
                Join the SHIS insiders list
              </h2>
              <p className="mt-3 text-sm leading-7 text-black/70">
                Early access to weekly drops, limited edits, and private offers curated for your wardrobe.
              </p>
            </div>

            <form onSubmit={handleNewsletterSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">Email</label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-full border border-black/20 px-5 py-3 text-sm text-black outline-none transition-colors duration-300 focus:border-black sm:max-w-sm"
              />
              <button
                type="submit"
                className="ui-interactive inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors duration-300 hover:bg-black/90"
              >
                Subscribe
              </button>
            </form>
            {newsletterMessage ? <p className="mt-3 text-xs text-black/65">{newsletterMessage}</p> : null}
          </motion.div>
        </Container>
      </section>
    </div>
  )
}
