import { getTaxonomyLabelForSlug } from '../data/categoryTaxonomy'

const SITE_URL = 'https://www.shisfashion.com'
const DEFAULT_TITLE = 'SHIS Fashion Bangladesh | Premium Oversized T-Shirts, Polo Shirts & Denim'
const DEFAULT_DESCRIPTION = 'Shop premium oversized T-shirts, Polo Shirts, Denim and Fashion Essentials from SHIS Fashion Bangladesh. Premium quality. Fast Delivery. Cash on Delivery available.'
const DEFAULT_KEYWORDS = 'SHIS Fashion, Bangladesh Fashion, Oversized T Shirt Bangladesh, Premium Polo Shirt, Denim, Fashion Store Bangladesh'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

interface SeoMetadata {
  title: string
  description: string
  keywords?: string
  canonicalPath: string
  ogImage?: string
  type?: string
  robots?: string
  schema?: Array<Record<string, unknown>>
}

interface ProductSeoInput {
  name: string
  description: string
  slug: string
  category: string
  image: string
  price: string
  comparePrice?: string
  brand?: string
  stock: number
}

interface ApplySeoOptions {
  title?: string
  description?: string
  keywords?: string
  schemas?: Array<Record<string, unknown>>
  image?: string
  ogImage?: string
  type?: string
  robots?: string
  canonicalPath?: string
  schema?: Array<Record<string, unknown>>
}

interface RuntimeSeoEntry {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
}

interface RuntimeSeoOverrides {
  home?: RuntimeSeoEntry
  shop?: RuntimeSeoEntry
  oversized?: RuntimeSeoEntry
}

let runtimeSeoOverrides: RuntimeSeoOverrides = {}

export function setRuntimeSeoOverrides(overrides?: RuntimeSeoOverrides) {
  runtimeSeoOverrides = overrides ?? {}
}

function getRuntimeOverride(pathname: string): RuntimeSeoEntry | undefined {
  const normalizedPath = normalizePath(pathname)
  if (normalizedPath === '/') {
    return runtimeSeoOverrides.home
  }

  if (normalizedPath === '/shop') {
    return runtimeSeoOverrides.shop
  }

  if (
    normalizedPath === '/shop/oversized-tee'
    || normalizedPath === '/collections/oversized-tee'
    || normalizedPath === '/oversized-tee'
  ) {
    return runtimeSeoOverrides.oversized
  }

  return undefined
}

function normalizePath(pathname: string) {
  const [pathOnly] = pathname.split('?')
  const cleanPath = pathOnly?.split('#')[0] ?? '/'
  if (!cleanPath.startsWith('/')) {
    return `/${cleanPath}`
  }

  return cleanPath === '/' ? '/' : cleanPath.replace(/\/+$/, '') || '/'
}

function isRecognizedStorefrontPath(pathname: string) {
  const knownExact = new Set([
    '/',
    '/shop',
    '/shop/new-arrivals',
    '/new-arrivals',
    '/shop/best-sellers',
    '/best-sellers',
    '/about',
    '/brands',
    '/contact',
    '/privacy',
    '/terms',
    '/track-order',
    '/sale',
    '/women',
    '/sarees',
    '/men',
    '/men/half-shirts',
    '/men/panjabi',
    '/men/polos',
    '/men/pants',
    '/collections/oversized-tee',
    '/oversized-tee',
    '/kids',
    '/cart',
    '/checkout',
    '/order-success',
    '/founder',
  ])

  if (knownExact.has(pathname) || pathname.startsWith('/admin') || pathname.startsWith('/shis-admin')) {
    return true
  }

  return pathname.startsWith('/shop/')
    || pathname.startsWith('/collections/')
    || pathname.startsWith('/product/')
    || pathname.startsWith('/brands/')
    || pathname.startsWith('/kids/')
    || pathname.startsWith('/sarees/')
}

function createCanonicalUrl(pathname: string) {
  const normalizedPath = normalizePath(pathname)
  return `${SITE_URL}${normalizedPath === '/' ? '/' : normalizedPath}`
}

function toTitleCase(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function getCollectionTitle(slug: string) {
  if (!slug) {
    return 'Collection'
  }

  if (slug === 'half-shirt' || slug === 'half-shirts') {
    return "Men's Half Shirt Collection"
  }

  if (slug === 'men-pants' || slug === 'mens-pants' || slug === 'pants') {
    return "Men's Pants Collection"
  }

  if (slug === 'oversized-tee' || slug === 'oversize-tee') {
    return 'Oversized Tee Collection'
  }

  if (slug === 'kids-oversized-tee' || slug === 'kids') {
    return 'Kids Oversized Collection'
  }

  return `${toTitleCase(slug)} Collection`
}

function buildBreadcrumbItems(pathname: string) {
  const normalizedPath = normalizePath(pathname)
  const segments = normalizedPath.split('/').filter(Boolean)
  const items = [{ name: 'Home', item: `${SITE_URL}/` }]

  if (segments.length === 0) {
    return items
  }

  if (segments[0] === 'shop') {
    items.push({ name: 'Shop', item: `${SITE_URL}/shop` })
    if (segments[1] && segments[1] !== 'new-arrivals' && segments[1] !== 'best-sellers') {
      items.push({ name: getTaxonomyLabelForSlug(segments[1]) || toTitleCase(segments[1]), item: `${SITE_URL}${normalizedPath}` })
    }

    if (segments[1] === 'new-arrivals') {
      items.push({ name: 'New Arrivals', item: `${SITE_URL}${normalizedPath}` })
    }

    if (segments[1] === 'best-sellers') {
      items.push({ name: 'Best Sellers', item: `${SITE_URL}${normalizedPath}` })
    }

    return items
  }

  if (segments[0] === 'collections') {
    items.push({ name: 'Collections', item: `${SITE_URL}/shop` })
    items.push({ name: getCollectionTitle(segments[1] ?? ''), item: `${SITE_URL}${normalizedPath}` })
    return items
  }

  if (segments[0] === 'about') {
    items.push({ name: 'About', item: `${SITE_URL}/about` })
    return items
  }

  if (segments[0] === 'contact') {
    items.push({ name: 'Contact', item: `${SITE_URL}/contact` })
    return items
  }

  if (segments[0] === 'brands') {
    items.push({ name: 'Brands', item: `${SITE_URL}/brands` })
    return items
  }

  if (segments[0] === 'privacy') {
    items.push({ name: 'Privacy Policy', item: `${SITE_URL}/privacy` })
    return items
  }

  if (segments[0] === 'terms') {
    items.push({ name: 'Terms', item: `${SITE_URL}/terms` })
    return items
  }

  if (segments[0] === 'track-order') {
    items.push({ name: 'Track Order', item: `${SITE_URL}/track-order` })
    return items
  }

  if (segments[0] === 'sale') {
    items.push({ name: 'Sale', item: `${SITE_URL}/sale` })
    return items
  }

  if (segments[0] === 'women') {
    items.push({ name: 'Women', item: `${SITE_URL}/women` })
    return items
  }

  if (segments[0] === 'men') {
    items.push({ name: 'Men', item: `${SITE_URL}/men` })
    if (segments[1] === 'half-shirts') {
      items.push({ name: 'Half Shirts', item: `${SITE_URL}/men/half-shirts` })
    }
    if (segments[1] === 'panjabi') {
      items.push({ name: 'Panjabi', item: `${SITE_URL}/men/panjabi` })
    }
    if (segments[1] === 'polos' || segments[1] === 'polo') {
      items.push({ name: 'Polos', item: `${SITE_URL}/men/polos` })
    }
    if (segments[1] === 'pants') {
      items.push({ name: 'Pants', item: `${SITE_URL}/men/pants` })
    }
    return items
  }

  if (segments[0] === 'kids') {
    items.push({ name: 'Kids', item: `${SITE_URL}/kids` })
    if (segments[1]) {
      items.push({ name: toTitleCase(segments[1].replace(/-/g, ' ')), item: `${SITE_URL}${normalizedPath}` })
    }
    return items
  }

  if (segments[0] === 'sarees' || segments[0] === 'saree') {
    items.push({ name: 'Sarees', item: `${SITE_URL}/sarees` })
    if (segments[1]) {
      items.push({ name: toTitleCase(segments[1].replace(/-/g, ' ')), item: `${SITE_URL}${normalizedPath}` })
    }
    return items
  }

  if (segments[0] === 'new-arrivals') {
    items.push({ name: 'New Arrivals', item: `${SITE_URL}/shop/new-arrivals` })
    return items
  }

  if (segments[0] === 'oversized-tee') {
    items.push({ name: 'Oversized Tee', item: `${SITE_URL}/collections/oversized-tee` })
    return items
  }

  if (segments[0] === 'cart') {
    items.push({ name: 'Cart', item: `${SITE_URL}/cart` })
    return items
  }

  if (segments[0] === 'checkout') {
    items.push({ name: 'Checkout', item: `${SITE_URL}/checkout` })
    return items
  }

  if (segments[0] === 'order-success') {
    items.push({ name: 'Order Success', item: `${SITE_URL}/order-success` })
    return items
  }

  return items
}

function buildBaseSchemas(pathname: string, canonicalUrl: string, metadata: SeoMetadata) {
  const breadcrumbItems = buildBreadcrumbItems(pathname)
  const schemas: Array<Record<string, unknown>> = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'SHIS Fashion',
      url: SITE_URL,
      logo: `${SITE_URL}/shis-logo.svg`,
      sameAs: ['https://www.facebook.com/shisfashion', 'https://www.instagram.com/shisfashion', 'https://wa.me/8801887848304'],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        telephone: '+8801887848304',
        areaServed: 'BD',
        availableLanguage: ['en'],
      },
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'BD',
        addressLocality: 'Dhaka',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'SHIS Fashion',
      url: SITE_URL,
      description: metadata.description,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/shop?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: metadata.title,
      description: metadata.description,
      url: canonicalUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: 'SHIS Fashion',
        url: SITE_URL,
      },
    },
  ]

  if (breadcrumbItems.length > 1) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.item,
      })),
    })
  }

  if (pathname === '/' || pathname === '/shop') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'SHIS Fashion Bangladesh',
      url: canonicalUrl,
      description: metadata.description,
      image: DEFAULT_OG_IMAGE,
    })
  }

  if (['/women', '/men', '/kids', '/sarees'].includes(pathname)) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: metadata.title,
      url: canonicalUrl,
      description: metadata.description,
      image: DEFAULT_OG_IMAGE,
    })
  }

  if (pathname.startsWith('/collections/')) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: metadata.title,
      url: canonicalUrl,
      description: metadata.description,
      image: DEFAULT_OG_IMAGE,
    })
  }

  return schemas
}

export function buildProductSchema(product: ProductSeoInput, pathname: string) {
  const canonicalUrl = createCanonicalUrl(pathname)
  const numericPrice = Number.parseFloat(product.price.replace(/[^\d.]/g, '')) || 0
  const currency = product.price.includes('৳') ? 'BDT' : 'USD'

  const offers: Record<string, unknown> = {
    '@type': 'Offer',
    priceCurrency: currency,
    price: numericPrice,
    availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url: canonicalUrl,
    itemCondition: 'https://schema.org/NewCondition',
  }

  if (product.comparePrice) {
    const numericComparePrice = Number.parseFloat(product.comparePrice.replace(/[^\d.]/g, '')) || 0
    if (numericComparePrice > 0) {
      offers.priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    category: product.category,
    image: product.image || DEFAULT_OG_IMAGE,
    url: canonicalUrl,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'SHIS Fashion',
    },
    offers,
  }
}

export function getRouteMetadata(pathname: string): SeoMetadata {
  const normalizedPath = normalizePath(pathname)
  const pageType = normalizedPath === '/' ? 'website' : 'article'

  if (normalizedPath === '/') {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      keywords: DEFAULT_KEYWORDS,
      canonicalPath: '/',
      ogImage: DEFAULT_OG_IMAGE,
      type: 'website',
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/shop') {
    return {
      title: 'Shop SHIS Fashion Bangladesh | Premium T-Shirts, Polo Shirts & Denim',
      description: 'Browse premium oversized T-shirts, Polo Shirts, Shirts, Denim and women’s and kids fashion at SHIS Fashion Bangladesh.',
      keywords: DEFAULT_KEYWORDS,
      canonicalPath: '/shop',
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/shop/new-arrivals') {
    return {
      title: 'New Arrivals | SHIS Fashion Bangladesh',
      description: 'Explore the latest oversized essentials, polos, shirts, and denim arrivals from SHIS Fashion Bangladesh.',
      keywords: DEFAULT_KEYWORDS,
      canonicalPath: '/shop/new-arrivals',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/new-arrivals') {
    return {
      title: 'New Arrivals | SHIS Fashion Bangladesh',
      description: 'Explore the latest oversized essentials, polos, shirts, and denim arrivals from SHIS Fashion Bangladesh.',
      keywords: DEFAULT_KEYWORDS,
      canonicalPath: '/shop/new-arrivals',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/shop/best-sellers') {
    return {
      title: 'Best Sellers | SHIS Fashion Bangladesh',
      description: 'Shop best-selling oversized tees, polo shirts, denim and premium fashion essentials from SHIS Fashion Bangladesh.',
      keywords: DEFAULT_KEYWORDS,
      canonicalPath: '/shop/best-sellers',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/about') {
    return {
      title: 'About SHIS Fashion Bangladesh',
      description: 'Learn about SHIS Fashion, our premium fashion philosophy and the craftsmanship behind every oversized tee, polo shirt and denim edit.',
      keywords: 'About SHIS Fashion, Bangladesh fashion brand',
      canonicalPath: '/about',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/brands') {
    return {
      title: 'Our Brands | SHIS Fashion Bangladesh',
      description: 'Discover the signature brands and fashion stories behind SHIS Fashion Bangladesh.',
      keywords: 'SHIS Fashion brands, Bangladesh fashion',
      canonicalPath: '/brands',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/contact') {
    return {
      title: 'Contact SHIS Fashion Bangladesh',
      description: 'Contact SHIS Fashion Bangladesh for support, WhatsApp orders, and premium fashion inquiries.',
      keywords: 'Contact SHIS Fashion, Bangladesh fashion support',
      canonicalPath: '/contact',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/privacy') {
    return {
      title: 'Privacy Policy | SHIS Fashion Bangladesh',
      description: 'Read SHIS Fashion Bangladesh privacy practices for website visitors, customers and order support.',
      keywords: 'SHIS Fashion privacy policy',
      canonicalPath: '/privacy',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/terms') {
    return {
      title: 'Terms & Conditions | SHIS Fashion Bangladesh',
      description: 'Review SHIS Fashion Bangladesh terms and conditions for orders, delivery and customer support.',
      keywords: 'SHIS Fashion terms and conditions',
      canonicalPath: '/terms',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/track-order') {
    return {
      title: 'Track Your Order | SHIS Fashion Bangladesh',
      description: 'Look up your SHIS Fashion order status with your order ID and checkout phone number. No account required.',
      keywords: 'SHIS Fashion track order, Bangladesh order status',
      canonicalPath: '/track-order',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/sale') {
    return {
      title: 'Sale | SHIS Fashion Bangladesh',
      description: 'Shop premium fashion sale items from SHIS Fashion Bangladesh with fast delivery and COD.',
      keywords: 'SHIS Fashion sale, Bangladesh fashion sale',
      canonicalPath: '/sale',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/women') {
    return {
      title: 'Women | SHIS Fashion Bangladesh',
      description: 'Shop women\'s fashion essentials from SHIS Fashion Bangladesh designed for modern comfort and premium daily styling.',
      keywords: 'Women fashion Bangladesh, SHIS women collection, premium women wear',
      canonicalPath: '/women',
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/sarees') {
    return {
      title: 'Women\'s Sarees | SHIS Fashion Bangladesh',
      description: 'Shop the SHIS Fashion women\'s saree collection — refined weaves, fluid drapes, and premium everyday luxury with fast delivery and cash on delivery.',
      keywords: 'Saree Bangladesh, SHIS saree, women saree collection, premium saree Dhaka',
      canonicalPath: '/sarees',
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/men') {
    return {
      title: 'Men | SHIS Fashion Bangladesh',
      description: 'Explore men\'s premium polos, oversized tees, shirts, and denim from SHIS Fashion Bangladesh.',
      keywords: 'Men fashion Bangladesh, SHIS men collection, premium men wear',
      canonicalPath: '/men',
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/men/pants' || normalizedPath === '/men/denim') {
    return {
      title: "Men's Pants | SHIS Fashion Bangladesh",
      description: 'Shop men\'s pants from SHIS Fashion Bangladesh — denim, baggy, trousers, cargo, and casual bottom-wear with fast delivery and cash on delivery.',
      keywords: 'mens pants Bangladesh, baggy jeans, denim pants, cargo pants Dhaka, SHIS pants',
      canonicalPath: '/men/pants',
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/men/half-shirts') {
    return {
      title: "Men's Half Shirts | SHIS Fashion Bangladesh",
      description: 'Shop men\'s half shirts from SHIS Fashion Bangladesh — breathable everyday edits with fast delivery and cash on delivery.',
      keywords: 'half shirt Bangladesh, mens half shirt, SHIS half shirts, casual shirt Dhaka',
      canonicalPath: '/men/half-shirts',
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/men/panjabi') {
    return {
      title: "Men's Panjabi | SHIS Fashion Bangladesh",
      description: 'Shop men\'s panjabi from SHIS Fashion Bangladesh — refined occasion and everyday edits with fast delivery and cash on delivery.',
      keywords: 'panjabi Bangladesh, mens panjabi, SHIS panjabi, punjabi Dhaka',
      canonicalPath: '/men/panjabi',
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/men/polos' || normalizedPath === '/men/polo') {
    return {
      title: "Men's Polos | SHIS Fashion Bangladesh",
      description: 'Shop men\'s polo shirts from SHIS Fashion Bangladesh — premium everyday polos with fast delivery and cash on delivery.',
      keywords: 'polo shirt Bangladesh, mens polo, SHIS polo, premium polo Dhaka',
      canonicalPath: '/men/polos',
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/collections/oversized-tee' || normalizedPath === '/oversized-tee' || normalizedPath === '/shop/oversized-tee') {
    return {
      title: 'Oversized Tee Collection | SHIS Fashion Bangladesh',
      description: 'Shop unisex oversized tees for men, women, and all adults. Graphic, vintage, and heavyweight cuts in S–XXL boxy fit from SHIS Fashion Bangladesh.',
      keywords: 'oversized tee Bangladesh, unisex oversized t-shirt, SHIS oversized tee, boxy tee Dhaka',
      canonicalPath: '/collections/oversized-tee',
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/kids') {
    return {
      title: 'Kids | SHIS Fashion Bangladesh',
      description: 'Discover SHIS kids essentials with comfortable fabrics and durable styling for everyday wear.',
      keywords: 'Kids fashion Bangladesh, SHIS kids collection, children wear Bangladesh',
      canonicalPath: '/kids',
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/cart') {
    return {
      title: 'Cart | SHIS Fashion Bangladesh',
      description: 'Review your chosen SHIS Fashion pieces and complete checkout quickly with COD.',
      keywords: 'SHIS Fashion cart',
      canonicalPath: '/cart',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'noindex,nofollow',
    }
  }

  if (normalizedPath === '/checkout') {
    return {
      title: 'Checkout | SHIS Fashion Bangladesh',
      description: 'Complete your SHIS Fashion order with fast checkout and cash on delivery on the Bangladesh store.',
      keywords: 'SHIS Fashion checkout',
      canonicalPath: '/checkout',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'noindex,nofollow',
    }
  }

  if (normalizedPath === '/order-success') {
    return {
      title: 'Order Confirmed | SHIS Fashion Bangladesh',
      description: 'Your SHIS Fashion order has been placed successfully and is being prepared for fast delivery.',
      keywords: 'SHIS Fashion order success',
      canonicalPath: '/order-success',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'noindex,nofollow',
    }
  }

  if (normalizedPath.startsWith('/shop/')) {
    const segments = normalizedPath.split('/').filter(Boolean)
    const lastSegment = segments[segments.length - 1] ?? 'shop'
    const listingLabel = getTaxonomyLabelForSlug(lastSegment) || toTitleCase(lastSegment)

    if (segments.length >= 3) {
      return {
        title: `${toTitleCase(lastSegment)} | SHIS Fashion Bangladesh`,
        description: 'Explore premium fashion essentials from SHIS Fashion Bangladesh with quality craftsmanship and fast delivery.',
        keywords: DEFAULT_KEYWORDS,
        canonicalPath: normalizedPath,
        ogImage: DEFAULT_OG_IMAGE,
        type: 'product',
        robots: 'index,follow',
      }
    }

    return {
      title: `${listingLabel} | SHIS Fashion Bangladesh`,
      description: `Shop ${listingLabel} from SHIS Fashion Bangladesh with quality craftsmanship, fast delivery, and cash on delivery.`,
      keywords: DEFAULT_KEYWORDS,
      canonicalPath: normalizedPath,
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath.startsWith('/collections/')) {
    const slug = normalizedPath.split('/').filter(Boolean).at(-1) ?? 'collection'
    return {
      title: `${getCollectionTitle(slug)} | SHIS Fashion Bangladesh`,
      description: 'Discover premium fashion collections from SHIS Fashion Bangladesh designed for modern style and comfort.',
      keywords: DEFAULT_KEYWORDS,
      canonicalPath: normalizedPath,
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath.startsWith('/admin') || normalizedPath.startsWith('/shis-admin')) {
    return {
      title: 'Admin | SHIS Fashion',
      description: 'SHIS Fashion administration area.',
      keywords: 'SHIS admin',
      canonicalPath: normalizedPath,
      ogImage: DEFAULT_OG_IMAGE,
      type: 'website',
      robots: 'noindex,nofollow',
    }
  }

  if (!isRecognizedStorefrontPath(normalizedPath)) {
    return {
      title: 'Page not found | SHIS Fashion Bangladesh',
      description: 'This SHIS Fashion page is unavailable. Continue shopping the latest collection.',
      keywords: DEFAULT_KEYWORDS,
      canonicalPath: normalizedPath,
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'noindex,nofollow',
    }
  }

  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    canonicalPath: normalizedPath,
    ogImage: DEFAULT_OG_IMAGE,
    type: pageType,
    robots: 'index,follow',
  }
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null

  if (!element) {
    element = document.createElement(selector.startsWith('link') ? 'link' : 'meta') as HTMLMetaElement | HTMLLinkElement
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value))
}

function removeExistingJsonLd() {
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((node) => node.remove())
}

export function applySeoMetadata(pathname: string, options?: ApplySeoOptions) {
  const metadata = getRouteMetadata(pathname)
  const canonicalPath = options?.canonicalPath ?? metadata.canonicalPath
  const canonicalUrl = createCanonicalUrl(canonicalPath)
  const runtimeOverride = getRuntimeOverride(pathname)
  const mergedSchemas = options?.schema ?? options?.schemas ?? []
  const mergedMetadata = {
    ...metadata,
    ...(runtimeOverride ?? {}),
    ...options,
    canonicalPath,
    schema: mergedSchemas,
    robots: options?.robots ?? metadata.robots,
  }

  document.title = mergedMetadata.title
  upsertMeta('meta[name="description"]', { name: 'description', content: mergedMetadata.description })
  upsertMeta('meta[name="keywords"]', { name: 'keywords', content: mergedMetadata.keywords ?? DEFAULT_KEYWORDS })
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: mergedMetadata.title })
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: mergedMetadata.description })
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: mergedMetadata.type ?? 'website' })
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: mergedMetadata.ogImage ?? DEFAULT_OG_IMAGE })
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'SHIS Fashion' })
  upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: 'en_BD' })
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
  upsertMeta('meta[name="twitter:site"]', { name: 'twitter:site', content: '@shisfashion' })
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: mergedMetadata.title })
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: mergedMetadata.description })
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: mergedMetadata.ogImage ?? DEFAULT_OG_IMAGE })
  upsertMeta('meta[name="robots"]', { name: 'robots', content: mergedMetadata.robots ?? 'index,follow' })
  upsertMeta('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl })

  const baseSchemas = buildBaseSchemas(pathname, canonicalUrl, mergedMetadata)
  const schemas = [...baseSchemas, ...(mergedMetadata.schema ?? [])]

  removeExistingJsonLd()

  schemas.forEach((schema) => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)
  })
}

export function applyNotFoundSeo(pathname: string) {
  applySeoMetadata(pathname, {
    title: 'Page not found | SHIS Fashion Bangladesh',
    description: 'This SHIS Fashion page is unavailable. Continue shopping the latest collection.',
    robots: 'noindex,nofollow',
    canonicalPath: pathname,
  })
}

export function getSiteUrl() {
  return SITE_URL
}

export function getCanonicalUrl(pathname: string) {
  return createCanonicalUrl(pathname)
}
