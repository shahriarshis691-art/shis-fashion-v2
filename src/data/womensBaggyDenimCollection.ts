import { formatBDT } from '../utils/currency'
import { filterListingProducts } from '../utils/listingProducts'
import type { ShopProduct } from './shopData'

export const WOMENS_BAGGY_DENIM_SIZES = ['26', '28', '30', '32', '34'] as const
export const WOMENS_BAGGY_TEE_SIZES = ['S', 'M', 'L', 'XL'] as const
export const WOMENS_BAGGY_DENIM_LISTING_PATH = '/women/womens-baggy'
export const WOMENS_BAGGY_HERO_IMAGE = '/hero/womens-baggy/womens-jeans-listing.png'
export const WOMENS_BAGGY_HERO_IMAGE_FALLBACK = '/hero/womens-baggy/womens-jeans-listing.png.jpeg'
export const WOMENS_BAGGY_HERO_WIDTH = 3072
export const WOMENS_BAGGY_HERO_HEIGHT = 2048
export const WOMENS_BAGGY_COVER_IMAGE = WOMENS_BAGGY_HERO_IMAGE

const WOMENS_BAGGY_IMAGE_DIR = '/collections/womens-baggy'

export interface WomensBaggyDenimProduct extends ShopProduct {
  sku: string
  fit: 'Baggy' | 'Wide Leg' | 'Loose' | 'Relaxed Wide-Leg'
  fabric: string
  tags: string[]
  inStock: boolean
  subCategory?: string
  originalPrice?: string
}

function womensBaggySrc(filename: string) {
  return `${WOMENS_BAGGY_IMAGE_DIR}/${encodeURIComponent(filename)}`
}

interface WomensBaggyJeanEntry {
  id: string
  slug: string
  name: string
  sku: string
  filename: string
  galleryFilenames?: string[]
  price: number
  originalPrice: number
  colors: string[]
  description: string
  fit?: WomensBaggyDenimProduct['fit']
  fabric?: string
  stock?: number
  featured?: boolean
  newArrival?: boolean
}

interface WomensBaggyTeeEntry {
  id: string
  slug: string
  name: string
  sku: string
  filename: string
  price: number
  originalPrice: number
  colors: string[]
  description: string
  fabric?: string
  stock?: number
  featured?: boolean
  newArrival?: boolean
}

function createWomensBaggyJean(entry: WomensBaggyJeanEntry): WomensBaggyDenimProduct {
  const image = womensBaggySrc(entry.filename)
  const galleryImages = [
    image,
    ...(entry.galleryFilenames ?? []).map(womensBaggySrc),
  ].filter((src, index, all) => all.indexOf(src) === index)
  const originalPrice = formatBDT(entry.originalPrice)
  const stock = entry.stock ?? 16

  return {
    id: entry.id,
    sku: entry.sku,
    slug: entry.slug,
    name: entry.name,
    price: formatBDT(entry.price),
    comparePrice: originalPrice,
    originalPrice,
    category: 'women',
    subCategory: 'baggy',
    brand: 'SHIS Fashion',
    image,
    galleryImages,
    description: entry.description,
    sizes: [...WOMENS_BAGGY_DENIM_SIZES],
    colors: entry.colors,
    stock,
    featured: entry.featured ?? true,
    newArrival: entry.newArrival ?? true,
    fit: entry.fit ?? 'Baggy',
    fabric: entry.fabric ?? 'Cotton Denim',
    tags: ['baggy', 'women', 'womens-baggy', 'denim'],
    inStock: true,
  }
}

function createWomensBaggyTee(entry: WomensBaggyTeeEntry): WomensBaggyDenimProduct {
  const image = womensBaggySrc(entry.filename)
  const originalPrice = formatBDT(entry.originalPrice)
  const stock = entry.stock ?? 20

  return {
    id: entry.id,
    sku: entry.sku,
    slug: entry.slug,
    name: entry.name,
    price: formatBDT(entry.price),
    comparePrice: originalPrice,
    originalPrice,
    category: 'women',
    subCategory: 'baggy',
    brand: 'SHIS Fashion',
    image,
    galleryImages: [image],
    description: entry.description,
    sizes: [...WOMENS_BAGGY_TEE_SIZES],
    colors: entry.colors,
    stock,
    featured: entry.featured ?? true,
    newArrival: entry.newArrival ?? true,
    fit: 'Loose',
    fabric: entry.fabric ?? 'Soft Cotton',
    tags: ['baggy', 'women', 'womens-baggy', 'tee'],
    inStock: stock > 0,
  }
}

/**
 * Static women's baggy catalog — images in `/public/collections/womens-baggy/`.
 * Live Firestore products with matching category/tags still appear via merge.
 */
const womensBaggyJeanEntries: WomensBaggyJeanEntry[] = [
  {
    id: 'womens-baggy-01',
    slug: 'high-waist-vintage-wash-wide-leg-jeans',
    name: 'High-Waist Vintage Wash Wide Leg Jeans',
    sku: 'SHIS-WB-001',
    filename: 'wide leg jeans.jpg',
    price: 2150,
    originalPrice: 2750,
    colors: ['Light Blue'],
    fit: 'Wide Leg',
    description: 'High-waist wide-leg denim with a faded vintage wash and an easy street-ready drape.',
    stock: 18,
    featured: true,
  },
  {
    id: 'womens-baggy-02',
    slug: 'vintage-wash-baggy-jeans-light-blue',
    name: 'Vintage Wash Baggy Jeans',
    sku: 'SHIS-WB-002',
    filename: 'download (16).jpg',
    price: 1890,
    originalPrice: 2490,
    colors: ['Light Blue'],
    fit: 'Baggy',
    description: 'Relaxed light-wash baggy jeans with a vintage finish — built for everyday layering.',
    stock: 15,
  },
  {
    id: 'womens-baggy-03',
    slug: 'dark-indigo-wide-leg-baggy-jeans',
    name: 'Dark Indigo Wide Leg Baggy Jeans',
    sku: 'SHIS-WB-003',
    filename: 'download (17).jpg',
    price: 2050,
    originalPrice: 2650,
    colors: ['Dark Indigo'],
    fit: 'Wide Leg',
    description: 'Dark indigo wide-leg baggy denim with a refined wash and relaxed straight fall.',
    stock: 14,
    featured: true,
  },
  {
    id: 'womens-baggy-04',
    slug: 'classic-light-wash-wide-leg-denim',
    name: 'Classic Light Wash Wide Leg Denim',
    sku: 'SHIS-WB-004',
    filename: 'WhatsApp Image 2026-08-27 at 5.25.01 AM.jpeg',
    price: 1750,
    originalPrice: 2290,
    colors: ['Light Blue'],
    fit: 'Wide Leg',
    description: 'Classic light-wash wide-leg denim with a clean five-pocket finish and everyday ease.',
    stock: 17,
  },
  {
    id: 'womens-baggy-05',
    slug: 'high-waist-frayed-hem-baggy-jeans',
    name: 'High-Waist Frayed Hem Baggy Jeans',
    sku: 'SHIS-WB-005',
    filename: 'WhatsApp Image 2026-08-27 at 5.25.01 AM (1).jpeg',
    price: 1980,
    originalPrice: 2590,
    colors: ['Medium Blue'],
    fit: 'Baggy',
    description: 'Medium-wash baggy jeans with a high-rise waist and raw frayed hems for a vintage edge.',
    stock: 13,
    featured: true,
  },
  {
    id: 'womens-baggy-06',
    slug: 'charcoal-acid-wash-baggy-jeans',
    name: 'Charcoal Acid Wash Baggy Jeans',
    sku: 'SHIS-WB-006',
    filename: 'WhatsApp Image 2026-08-27 at 5.25.01 AM (2).jpeg',
    price: 2250,
    originalPrice: 2890,
    colors: ['Charcoal'],
    fit: 'Baggy',
    description: 'Charcoal acid-wash baggy denim with a retro fade and roomy wide-leg silhouette.',
    stock: 12,
    featured: true,
  },
  {
    id: 'womens-baggy-07',
    slug: 'elastic-drawstring-wide-leg-denim',
    name: 'Elastic Drawstring Wide Leg Denim',
    sku: 'SHIS-WB-007',
    filename: 'WhatsApp Image 2026-08-27 at 5.25.02 AM.jpeg',
    price: 1850,
    originalPrice: 2450,
    colors: ['Soft Blue'],
    fit: 'Wide Leg',
    fabric: 'Soft Cotton Denim',
    description: 'Soft light-wash denim with an elastic drawstring waist and fluid wide-leg comfort.',
    stock: 16,
  },
  {
    id: 'womens-baggy-08',
    slug: 'dark-wash-whiskered-wide-leg-jeans',
    name: 'Dark Wash Whiskered Wide Leg Jeans',
    sku: 'SHIS-WB-008',
    filename: 'WhatsApp Image 2026-08-27 at 5.25.02 AM (1).jpeg',
    price: 2100,
    originalPrice: 2700,
    colors: ['Deep Indigo'],
    fit: 'Wide Leg',
    description: 'Deep indigo wide-leg jeans with vintage whiskering and a relaxed high-rise fit.',
    stock: 14,
  },
  {
    id: 'womens-baggy-09',
    slug: 'soft-wash-drawstring-baggy-pants',
    name: 'Soft Wash Drawstring Baggy Pants',
    sku: 'SHIS-WB-009',
    filename: 'WhatsApp Image 2026-08-27 at 5.25.02 AM (2).jpeg',
    price: 1690,
    originalPrice: 2200,
    colors: ['Light Blue'],
    fit: 'Baggy',
    fabric: 'Soft Cotton Denim',
    description: 'Lightweight drawstring baggy pants in a soft denim wash — easy drape, all-day wear.',
    stock: 19,
    newArrival: true,
  },
  {
    id: 'womens-baggy-10',
    slug: 'seam-detail-frayed-hem-wide-leg-jeans',
    name: 'Seam Detail Frayed Hem Wide Leg Jeans',
    sku: 'SHIS-WB-010',
    filename: 'WhatsApp Image 2026-08-27 at 5.25.03 AM.jpeg',
    price: 2190,
    originalPrice: 2790,
    colors: ['Vintage Blue'],
    fit: 'Wide Leg',
    description: 'Vintage blue wide-leg jeans with front seam detailing and a raw frayed hem.',
    stock: 11,
    featured: true,
  },
  {
    id: 'womens-baggy-11',
    slug: 'light-wash-relaxed-wide-leg-denim',
    name: 'Light Wash Relaxed Wide Leg Denim',
    sku: 'SHIS-WB-011',
    filename: 'WhatsApp Image 2026-08-27 at 5.25.03 AM (1).jpeg',
    price: 1920,
    originalPrice: 2520,
    colors: ['Pale Blue'],
    fit: 'Wide Leg',
    description: 'Pale blue relaxed wide-leg denim with a soft hand-feel and clean high-rise waist.',
    stock: 15,
  },
  {
    id: 'womens-baggy-12',
    slug: 'medium-wash-high-waist-baggy-jeans',
    name: 'Medium Wash High-Waist Baggy Jeans',
    sku: 'SHIS-WB-012',
    filename: 'WhatsApp Image 2026-08-27 at 5.25.03 AM (2).jpeg',
    price: 1880,
    originalPrice: 2480,
    colors: ['Medium Blue'],
    fit: 'Baggy',
    description: 'Medium-wash high-waist baggy jeans with a straight wide leg and premium cotton denim.',
    stock: 16,
  },
  {
    id: 'womens-baggy-13',
    slug: 'studio-vintage-relaxed-wide-leg-baggy-jeans',
    name: 'Studio Vintage Relaxed Wide-Leg Baggy Jeans',
    sku: 'SHIS-WB-013',
    filename: 'download (35).jpg',
    galleryFilenames: [
      '909867930974949942.jpg',
      '909867930974949936.jpg',
      '909867930974949935.jpg',
    ],
    price: 2890,
    originalPrice: 3990,
    colors: ['Medium Blue', 'Light Wash'],
    fit: 'Relaxed Wide-Leg',
    fabric: 'Premium Vintage Denim',
    description: 'Relaxed wide-leg baggy jeans in premium vintage denim — studio looks spanning denim jacket, gingham crop, and alternate wash styling.',
    stock: 14,
    featured: true,
    newArrival: true,
  },
  {
    id: 'womens-baggy-14',
    slug: 'leather-layer-cargo-baggy-denim',
    name: 'Leather-Layer Cargo Baggy Denim',
    sku: 'SHIS-WB-014',
    filename: '722053752806686466.jpg',
    price: 3250,
    originalPrice: 4500,
    colors: ['Vintage Indigo'],
    fit: 'Relaxed Wide-Leg',
    fabric: 'Premium Vintage Denim',
    description: 'Streetwear cargo baggy denim with a relaxed wide-leg fall — leather-jacket layering and utility pockets in a vintage indigo wash.',
    stock: 12,
    featured: true,
    newArrival: true,
  },
  {
    id: 'womens-baggy-15',
    slug: 'college-light-wash-relaxed-baggy-jeans',
    name: 'College Light-Wash Relaxed Baggy Jeans',
    sku: 'SHIS-WB-015',
    filename: 'college trendy outfit.jpg',
    price: 2450,
    originalPrice: 3600,
    colors: ['Light Blue'],
    fit: 'Relaxed Wide-Leg',
    fabric: 'Premium Vintage Denim',
    description: 'Light-wash relaxed wide-leg baggy jeans with a vintage fade — easy college layering over a white tank and open shirt.',
    stock: 15,
    featured: true,
    newArrival: true,
  },
]

const womensBaggyTeeEntries: WomensBaggyTeeEntry[] = []

export const womensBaggyDenimCollectionProducts: WomensBaggyDenimProduct[] = [
  ...womensBaggyJeanEntries.map(createWomensBaggyJean),
  ...womensBaggyTeeEntries.map(createWomensBaggyTee),
]

export function isWomensBaggyDenimProduct(
  product: Pick<ShopProduct, 'name' | 'slug' | 'category'> & { tags?: string[] },
) {
  const tags = (product.tags ?? []).map((tag) => tag.trim().toLowerCase())
  if (
    tags.includes('womens-baggy')
    || (tags.includes('baggy') && (tags.includes('women') || tags.includes("women's")))
  ) {
    return true
  }

  const text = [product.name, product.slug, product.category].join(' ').toLowerCase()
  if (/mens?-?baggy|men'?s\s+baggy/.test(text)) {
    return false
  }

  return /womens?-?baggy|women'?s\s+baggy|ladies?\s+baggy/.test(text)
    || (/\bbaggy\b/.test(text) && /\bwomen|ladies|female\b/.test(text))
}

export function getWomensBaggyDenimProductBySlug(slug: string): WomensBaggyDenimProduct | undefined {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return womensBaggyDenimCollectionProducts.find(
    (product) =>
      product.slug === normalized ||
      String(product.id) === normalized ||
      product.sku.toLowerCase() === normalized,
  )
}

export function mergeWomensBaggyDenimCatalog(liveProducts: ShopProduct[]): ShopProduct[] {
  const taken = new Set(
    liveProducts.map((product) => product.slug.trim().toLowerCase()).filter(Boolean),
  )

  const extras = womensBaggyDenimCollectionProducts.filter(
    (product) => !taken.has(product.slug.toLowerCase()),
  )

  return filterListingProducts(extras.length ? [...liveProducts, ...extras] : liveProducts)
}
