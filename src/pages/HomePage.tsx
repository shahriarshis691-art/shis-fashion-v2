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
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/80">
                  {homepageContent.heroEyebrow || 'SHIS FASHION'}
                </p>
                <h1 className="mt-2 text-h1 text-white">{homepageContent.heroTitle}</h1>
                <p className="mt-3 text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
                  {homepageContent.heroSubtitle}
                </p>
                <div className="mt-5">
                  <Link
                    to={homepageContent.heroPrimaryLink ?? '/shop'}
                    className="ui-interactive inline-flex items-center border border-white bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-white/90"
                  >
                    {homepageContent.heroCta || 'Shop now'}
                  </Link>
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

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {categoryStrips.map((item, index) => (
              <motion.article
                key={item.label}
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

          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((item, index) => {
              const productImage = normalizeCatalogImageUrl(getManagedImageEntries(item, 1)[0]?.url ?? '', 900, 1125)
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
    </div>
  )
}
