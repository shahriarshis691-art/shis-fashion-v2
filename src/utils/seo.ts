const SITE_URL = 'https://www.shisfashion.com'
const DEFAULT_TITLE = 'SHIS Fashion | Premium Fashion Brand in Bangladesh'
const DEFAULT_DESCRIPTION = 'Shop premium oversized t-shirts, polos, shirts, denim and modern fashion at SHIS Fashion Bangladesh.'
const DEFAULT_KEYWORDS = 'SHIS Fashion, Bangladesh Fashion, Oversized T Shirt Bangladesh, Premium Polo Shirt, Denim, Fashion Store Bangladesh'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`

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
  schema?: Array<Record<string, unknown>>
}

function normalizePath(pathname: string) {
  const [pathOnly] = pathname.split('?')
  const cleanPath = pathOnly?.split('#')[0] ?? '/'
  if (!cleanPath.startsWith('/')) {
    return `/${cleanPath}`
  }

  return cleanPath === '/' ? '/' : cleanPath.replace(/\/+$/, '') || '/'
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
      items.push({ name: toTitleCase(segments[1]), item: `${SITE_URL}${normalizedPath}` })
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
    return items
  }

  if (segments[0] === 'kids') {
    items.push({ name: 'Kids', item: `${SITE_URL}/kids` })
    return items
  }

  if (segments[0] === 'new-arrivals') {
    items.push({ name: 'New Arrivals', item: `${SITE_URL}/shop/new-arrivals` })
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
      name: 'SHIS Fashion',
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
      name: 'SHIS Fashion',
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price: numericPrice,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
      itemCondition: 'https://schema.org/NewCondition',
    },
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
      title: 'Shop SHIS Fashion | Premium T-Shirts, Polo Shirts & Denim',
      description: 'Browse premium oversized t-shirts, polos, shirts, denim, and modern essentials at SHIS Fashion Bangladesh.',
      keywords: DEFAULT_KEYWORDS,
      canonicalPath: '/shop',
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/shop/new-arrivals') {
    return {
      title: 'New Arrivals | SHIS Fashion',
      description: 'Explore the latest oversized essentials, polos, shirts, and denim arrivals from SHIS Fashion.',
      keywords: DEFAULT_KEYWORDS,
      canonicalPath: '/shop/new-arrivals',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/new-arrivals') {
    return {
      title: 'New Arrivals | SHIS Fashion',
      description: 'Explore the latest oversized essentials, polos, shirts, and denim arrivals from SHIS Fashion.',
      keywords: DEFAULT_KEYWORDS,
      canonicalPath: '/shop/new-arrivals',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/shop/best-sellers') {
    return {
      title: 'Best Sellers | SHIS Fashion',
      description: 'Shop best-selling oversized tees, polo shirts, denim, and premium fashion essentials from SHIS Fashion.',
      keywords: DEFAULT_KEYWORDS,
      canonicalPath: '/shop/best-sellers',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/about') {
    return {
      title: 'About SHIS Fashion',
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
      title: 'Our Brands | SHIS Fashion',
      description: 'Discover the signature brands and fashion stories behind SHIS Fashion.',
      keywords: 'SHIS Fashion brands, Bangladesh fashion',
      canonicalPath: '/brands',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/contact') {
    return {
      title: 'Contact SHIS Fashion',
      description: 'Contact SHIS Fashion for support, WhatsApp orders, and premium fashion inquiries.',
      keywords: 'Contact SHIS Fashion, Bangladesh fashion support',
      canonicalPath: '/contact',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/privacy') {
    return {
      title: 'Privacy Policy | SHIS Fashion',
      description: 'Read SHIS Fashion privacy practices for website visitors, customers, and order support.',
      keywords: 'SHIS Fashion privacy policy',
      canonicalPath: '/privacy',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/terms') {
    return {
      title: 'Terms & Conditions | SHIS Fashion',
      description: 'Review SHIS Fashion terms and conditions for orders, delivery, and customer support.',
      keywords: 'SHIS Fashion terms and conditions',
      canonicalPath: '/terms',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/sale') {
    return {
      title: 'Sale | SHIS Fashion',
      description: 'Shop premium fashion sale items from SHIS Fashion with fast delivery and COD.',
      keywords: 'SHIS Fashion sale, Bangladesh fashion sale',
      canonicalPath: '/sale',
      ogImage: DEFAULT_OG_IMAGE,
      type: pageType,
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/women') {
    return {
      title: 'Women | SHIS Fashion',
      description: 'Shop women\'s fashion essentials from SHIS Fashion designed for modern comfort and premium daily styling.',
      keywords: 'Women fashion Bangladesh, SHIS women collection, premium women wear',
      canonicalPath: '/women',
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/men') {
    return {
      title: 'Men | SHIS Fashion',
      description: 'Explore men\'s premium polos, oversized tees, shirts, and denim from SHIS Fashion.',
      keywords: 'Men fashion Bangladesh, SHIS men collection, premium men wear',
      canonicalPath: '/men',
      ogImage: DEFAULT_OG_IMAGE,
      type: 'collection',
      robots: 'index,follow',
    }
  }

  if (normalizedPath === '/kids') {
    return {
      title: 'Kids | SHIS Fashion',
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
      title: 'Cart | SHIS Fashion',
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
      title: 'Checkout | SHIS Fashion',
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
      title: 'Order Confirmed | SHIS Fashion',
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
    return {
      title: `${toTitleCase(lastSegment)} | SHIS Fashion`,
      description: 'Explore premium fashion essentials from SHIS Fashion with quality craftsmanship and fast delivery.',
      keywords: DEFAULT_KEYWORDS,
      canonicalPath: normalizedPath,
      ogImage: DEFAULT_OG_IMAGE,
      type: 'product',
      robots: 'index,follow',
    }
  }

  if (normalizedPath.startsWith('/collections/')) {
    const slug = normalizedPath.split('/').filter(Boolean).at(-1) ?? 'collection'
    return {
      title: `${getCollectionTitle(slug)} | SHIS Fashion`,
      description: 'Discover premium fashion collections from SHIS Fashion designed for modern style and comfort.',
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
  const mergedSchemas = options?.schema ?? options?.schemas ?? []
  const mergedMetadata = {
    ...metadata,
    ...options,
    schema: mergedSchemas,
  }
  const canonicalUrl = createCanonicalUrl(mergedMetadata.canonicalPath)
  const hasSearchQuery = pathname.includes('?q=')
  const effectiveRobots = hasSearchQuery ? 'noindex,follow' : (mergedMetadata.robots ?? 'index,follow')

  document.title = mergedMetadata.title
  upsertMeta('meta[name="description"]', { name: 'description', content: mergedMetadata.description })
  upsertMeta('meta[name="keywords"]', { name: 'keywords', content: mergedMetadata.keywords ?? DEFAULT_KEYWORDS })
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: mergedMetadata.title })
  upsertMeta('meta[property="og:description"]', { property: 'og:description', content: mergedMetadata.description })
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: mergedMetadata.type ?? 'website' })
  upsertMeta('meta[property="og:image"]', { property: 'og:image', content: mergedMetadata.ogImage ?? DEFAULT_OG_IMAGE })
  upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'SHIS Fashion' })
  upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' })
  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: mergedMetadata.title })
  upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: mergedMetadata.description })
  upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: mergedMetadata.ogImage ?? DEFAULT_OG_IMAGE })
  upsertMeta('meta[name="robots"]', { name: 'robots', content: effectiveRobots })
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

export function getSiteUrl() {
  return SITE_URL
}
