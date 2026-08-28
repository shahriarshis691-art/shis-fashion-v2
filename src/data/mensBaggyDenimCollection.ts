import { formatBDT } from '../utils/currency'
import type { ShopProduct } from './shopData'

export const MENS_BAGGY_DENIM_SIZES = ['28', '30', '32', '34', '36'] as const
export const MENS_BAGGY_DENIM_LISTING_PATH = '/men?sub=denim'
const MENS_BAGGY_IMAGE_DIR = '/collections/mens-baggy'

export interface MensBaggyDenimProduct extends ShopProduct {
  sku: string
  fit: 'Baggy' | 'Wide Leg' | 'Loose'
  fabric: string
  tags: string[]
  inStock: boolean
}

function baggyImage(index: number) {
  return `${MENS_BAGGY_IMAGE_DIR}/mens-baggy${index}.jpg`
}

function createBaggyJean(
  index: number,
  slug: string,
  name: string,
  sku: string,
  price: number,
  colors: string[],
  description: string,
  options: {
    fit?: MensBaggyDenimProduct['fit']
    fabric?: string
    featured?: boolean
    newArrival?: boolean
    stock?: number
    comparePrice?: number
  } = {},
): MensBaggyDenimProduct {
  const image = baggyImage(index)
  const stock = options.stock ?? 18

  return {
    id: `mens-baggy-${index}`,
    sku,
    slug,
    name,
    price: formatBDT(price),
    comparePrice: options.comparePrice ? formatBDT(options.comparePrice) : undefined,
    category: 'denim',
    brand: 'SHIS Fashion',
    image,
    galleryImages: [image],
    description,
    sizes: [...MENS_BAGGY_DENIM_SIZES],
    colors,
    stock,
    featured: options.featured ?? false,
    newArrival: options.newArrival ?? true,
    fit: options.fit ?? 'Baggy',
    fabric: options.fabric ?? 'Cotton Denim',
    tags: ['baggy', 'men', 'denim'],
    inStock: stock > 0,
  }
}

/** Static men's baggy denim edit — images in `/public/collections/mens-baggy/`. */
export const mensBaggyDenimCollectionProducts: MensBaggyDenimProduct[] = [
  createBaggyJean(
    2,
    'acid-wash-baggy-jeans',
    'Acid Wash Baggy Jeans',
    'SHIS-MB-002',
    2590,
    ['Acid Wash Blue'],
    'Vintage-inspired acid wash baggy jeans with a soft hand-feel and roomy skate silhouette.',
    { fit: 'Baggy', featured: true, stock: 16, comparePrice: 2990 },
  ),
  createBaggyJean(
    3,
    'wide-leg-skate-jeans',
    'Wide Leg Skate Jeans',
    'SHIS-MB-003',
    2690,
    ['Mid Blue'],
    'Wide-leg skate jeans with a clean mid-blue wash and structured fall from hip to hem.',
    { fit: 'Wide Leg', featured: true, newArrival: true, stock: 14, comparePrice: 3090 },
  ),
  createBaggyJean(
    4,
    'charcoal-baggy-denim-jeans',
    'Charcoal Baggy Denim Jeans',
    'SHIS-MB-004',
    2390,
    ['Charcoal'],
    'Dark charcoal baggy denim with a matte finish — versatile for night edits and casual layers.',
    { fit: 'Baggy', stock: 20 },
  ),
  createBaggyJean(
    5,
    'stonewash-loose-fit-jeans',
    'Stonewash Loose Fit Jeans',
    'SHIS-MB-005',
    2290,
    ['Stonewash'],
    'Light stonewash loose-fit jeans with breathable cotton denim and an easy everyday rise.',
    { fit: 'Loose', newArrival: true, stock: 19, comparePrice: 2690 },
  ),
  createBaggyJean(
    6,
    'y2k-skater-baggy-jeans',
    'Y2K Skater Baggy Jeans',
    'SHIS-MB-006',
    2550,
    ['Vintage Blue'],
    'Y2K-inspired skater baggy jeans with a faded vintage wash and roomy tapered fall.',
    { fit: 'Baggy', featured: true, newArrival: true, stock: 17, comparePrice: 2950 },
  ),
  createBaggyJean(
    7,
    'retro-straight-baggy-denim',
    'Retro Straight Baggy Denim',
    'SHIS-MB-007',
    2450,
    ['Classic Blue'],
    'American retro straight baggy denim with a clean wash and everyday streetwear ease.',
    { fit: 'Loose', stock: 18, comparePrice: 2850 },
  ),
  createBaggyJean(
    8,
    'korean-wide-leg-denim-jeans',
    'Korean Wide Leg Denim Jeans',
    'SHIS-MB-008',
    2650,
    ['Soft Blue'],
    'Korean-inspired wide-leg denim with a soft blue wash and fluid, fashion-forward drape.',
    { fit: 'Wide Leg', featured: true, newArrival: true, stock: 15, comparePrice: 3050 },
  ),
  createBaggyJean(
    9,
    'streetwear-loose-fit-jeans',
    'Streetwear Loose Fit Jeans',
    'SHIS-MB-009',
    2350,
    ['Light Indigo'],
    'Loose-fit streetwear jeans in light indigo — breathable cotton denim for all-day wear.',
    { fit: 'Loose', stock: 21, comparePrice: 2750 },
  ),
  createBaggyJean(
    10,
    'vintage-skater-baggy-jeans',
    'Vintage Skater Baggy Jeans',
    'SHIS-MB-010',
    2590,
    ['Faded Indigo'],
    'Vintage skater baggy jeans with a washed indigo finish and oversized skate silhouette.',
    { fit: 'Baggy', featured: true, stock: 13, comparePrice: 2990 },
  ),
  createBaggyJean(
    11,
    'spring-straight-wide-leg-jeans',
    'Spring Straight Wide Leg Jeans',
    'SHIS-MB-011',
    2490,
    ['Soft Stone'],
    'Straight-to-wide spring denim with a soft stone wash and relaxed seasonal comfort.',
    { fit: 'Wide Leg', newArrival: true, stock: 16, comparePrice: 2890 },
  ),
  createBaggyJean(
    12,
    'premium-baggy-denim-jeans',
    'Premium Baggy Denim Jeans',
    'SHIS-MB-012',
    2690,
    ['Deep Indigo'],
    'Premium baggy denim in deep indigo with a refined finish and generous everyday fit.',
    { fit: 'Baggy', featured: true, stock: 12, comparePrice: 3190 },
  ),
]

export function isMensBaggyDenimProduct(
  product: Pick<ShopProduct, 'name' | 'slug' | 'category'> & { tags?: string[] },
) {
  const tags = (product.tags ?? []).map((tag) => tag.trim().toLowerCase())
  if (tags.includes('baggy') && (tags.includes('men') || tags.includes('denim'))) {
    return true
  }

  const text = [product.name, product.slug, product.category].join(' ').toLowerCase()
  if (!/denim|jean|baggy/.test(text)) {
    return false
  }

  return /baggy|wide[\s_-]?leg|loose[\s_-]?fit|skate[\s_-]?jean|mens?-?baggy/.test(text)
}

export function isDenimProduct(
  product: Pick<ShopProduct, 'name' | 'slug' | 'category'> & { tags?: string[] },
) {
  const tags = (product.tags ?? []).map((tag) => tag.trim().toLowerCase())
  if (
    tags.includes('womens-baggy')
    || (tags.includes('baggy') && (tags.includes('women') || tags.includes("women's")))
  ) {
    return false
  }

  const text = [product.name, product.slug, product.category].join(' ').toLowerCase()
  if (/womens?-?baggy|women'?s\s+baggy|ladies?\s+baggy/.test(text)) {
    return false
  }

  if (tags.includes('denim') || tags.includes('baggy')) {
    return true
  }

  return /\bdenim\b|\bjeans?\b|\bbaggy\b/.test(text)
}

export function getMensBaggyDenimProductBySlug(slug: string): MensBaggyDenimProduct | undefined {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return mensBaggyDenimCollectionProducts.find(
    (product) =>
      product.slug === normalized ||
      String(product.id) === normalized ||
      product.sku.toLowerCase() === normalized,
  )
}

export function mergeMensBaggyDenimCatalog(liveProducts: ShopProduct[]): ShopProduct[] {
  const taken = new Set(
    liveProducts.map((product) => product.slug.trim().toLowerCase()).filter(Boolean),
  )

  const extras = mensBaggyDenimCollectionProducts.filter(
    (product) => !taken.has(product.slug.toLowerCase()),
  )

  return extras.length ? [...liveProducts, ...extras] : liveProducts
}
