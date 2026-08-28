import { formatBDT } from '../utils/currency'
import type { ShopProduct } from './shopData'

export interface MensShirtProduct extends ShopProduct {
  sku: string
  subCategory: 'shirts'
  fabric: string
  tags: string[]
  inStock: boolean
}

export const MENS_SHIRT_SIZES = ['M', 'L', 'XL', 'XXL'] as const
const MENS_SHIRT_IMAGE_DIR = '/collections/full=shirts'

function shirtImage(filename: string) {
  return `${MENS_SHIRT_IMAGE_DIR}/${filename}.png`
}

function createMensShirt(
  index: number,
  filename: string,
  slug: string,
  name: string,
  sku: string,
  price: number,
  comparePrice: number,
  colors: string[],
  description: string,
  options: {
    fabric?: string
    featured?: boolean
    newArrival?: boolean
    stock?: number
  } = {},
): MensShirtProduct {
  const image = shirtImage(filename)
  const stock = options.stock ?? 16

  return {
    id: `mens-shirt-${String(index).padStart(2, '0')}`,
    sku,
    slug,
    name,
    price: formatBDT(price),
    comparePrice: formatBDT(comparePrice),
    category: 'men',
    subCategory: 'shirts',
    brand: 'SHIS Fashion',
    image,
    galleryImages: [image],
    description,
    sizes: [...MENS_SHIRT_SIZES],
    colors,
    stock,
    featured: options.featured ?? true,
    newArrival: options.newArrival ?? true,
    fabric: options.fabric ?? 'Cotton',
    tags: ['shirts', 'men', 'full-shirts'],
    inStock: true,
  }
}

/** Static men's full-shirt edit — images in `/public/collections/full=shirts/`. */
export const mensShirtCollectionProducts: MensShirtProduct[] = [
  createMensShirt(
    1,
    '64a33855-1f44-470a-bfc0-ce02135a94eb',
    'navy-blue-mandarin-collar-shirt',
    'Navy Blue Mandarin Collar Shirt',
    'SHIS-MS-001',
    1450,
    2150,
    ['Navy Blue'],
    'A clean navy mandarin-collar shirt with a refined everyday drape for smart-casual wear.',
    { fabric: 'Cotton', stock: 18 },
  ),
  createMensShirt(
    2,
    '72d32a26-0458-48bc-a2ea-a3f81f6eeb24',
    'beige-khaki-casual-button-down-shirt',
    'Beige Khaki Casual Button-Down Shirt',
    'SHIS-MS-002',
    1490,
    2190,
    ['Beige', 'Khaki'],
    'Warm beige-khaki button-down with an easy collar and breathable casual structure.',
    { fabric: 'Cotton', stock: 16 },
  ),
  createMensShirt(
    3,
    '78fe0eb3-d79f-4470-9269-d8d375ea2c67',
    'pastel-pink-casual-shirt',
    'Pastel Pink Casual Shirt',
    'SHIS-MS-003',
    1550,
    2250,
    ['Pastel Pink'],
    'Soft pastel pink casual shirt with a light hand-feel for warm-weather polish.',
    { fabric: 'Cotton', stock: 15 },
  ),
  createMensShirt(
    4,
    '7131c1a9-6333-4b56-84b3-6ad6b8c0390b',
    'olive-green-linen-cotton-shirt',
    'Olive Green Linen Cotton Shirt',
    'SHIS-MS-004',
    1590,
    2290,
    ['Olive Green'],
    'Olive green linen-cotton shirt with a relaxed collar and breathable everyday ease.',
    { fabric: 'Linen Cotton', stock: 14 },
  ),
  createMensShirt(
    5,
    'c4c28e17-5096-4217-8cc8-e81ddd408e1d',
    'grey-white-grid-check-casual-shirt',
    'Grey White Grid Check Casual Shirt',
    'SHIS-MS-005',
    1650,
    2350,
    ['Grey', 'White'],
    'Grey-and-white grid check casual shirt with a crisp collar for versatile daily wear.',
    { fabric: 'Cotton', stock: 17 },
  ),
  createMensShirt(
    6,
    'c5374993-6bcd-4563-952c-5c2b75a8ad54',
    'dark-teal-indigo-mandarin-collar-shirt',
    'Dark Teal Indigo Mandarin Collar Shirt',
    'SHIS-MS-006',
    1750,
    2390,
    ['Dark Teal', 'Indigo'],
    'Deep teal-indigo mandarin-collar shirt with a structured front and calm evening presence.',
    { fabric: 'Cotton', stock: 13 },
  ),
  createMensShirt(
    7,
    'f10ed88f-2fe5-42b5-a248-4cf426f929ac',
    'sky-blue-oxford-shirt',
    'Sky Blue Formal Casual Oxford Shirt',
    'SHIS-MS-007',
    1850,
    2450,
    ['Sky Blue'],
    'Sky blue oxford shirt with a classic collar, cut for both formal and casual days.',
    { fabric: 'Oxford Cotton', featured: true, stock: 16 },
  ),
]

const SHIRT_CATEGORY_SLUGS = new Set(['shirts', 'mens-shirt', 'casual-shirt', 'casual-shirts', 'full-shirts'])

export function isMensShirtProduct(
  product: Pick<ShopProduct, 'name' | 'slug' | 'category'> & {
    tags?: string[]
    subCategory?: string
  },
) {
  const category = product.category.trim().toLowerCase()
  const subCategory = (product.subCategory ?? '').trim().toLowerCase()
  const tags = (product.tags ?? []).map((tag) => tag.trim().toLowerCase())
  const text = [product.name, product.slug, category, subCategory, tags.join(' ')].join(' ').toLowerCase()

  if (/half[\s_-]?shirts?/.test(text) || category === 'half-shirts' || subCategory === 'half-shirts') {
    return false
  }

  return (
    subCategory === 'shirts'
    || SHIRT_CATEGORY_SLUGS.has(subCategory)
    || SHIRT_CATEGORY_SLUGS.has(category)
    || tags.some((tag) => SHIRT_CATEGORY_SLUGS.has(tag) || tag === 'shirts')
  )
}

export function getMensShirtProductBySlug(slug: string): MensShirtProduct | undefined {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return mensShirtCollectionProducts.find(
    (product) =>
      product.slug === normalized ||
      String(product.id) === normalized ||
      product.sku.toLowerCase() === normalized,
  )
}

export function mergeMensShirtCatalog(liveProducts: ShopProduct[]): ShopProduct[] {
  const taken = new Set(
    liveProducts.map((product) => product.slug.trim().toLowerCase()).filter(Boolean),
  )

  const extras = mensShirtCollectionProducts.filter(
    (product) => !taken.has(product.slug.toLowerCase()),
  )

  return extras.length ? [...liveProducts, ...extras] : liveProducts
}
