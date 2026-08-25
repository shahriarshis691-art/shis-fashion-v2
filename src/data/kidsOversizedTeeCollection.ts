import { formatBDT } from '../utils/currency'
import type { ShopProduct } from './shopData'

export type KidsGenderCategory = 'Kids Boy' | 'Kids Girl' | 'Unisex'

export const KIDS_OVERSIZED_SIZES = ['4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'] as const

export const KIDS_COLOR_PALETTE = {
  gold: '#D4AF37',
  navy: '#2C3E50',
  beige: '#F5F5DC',
  black: '#1F1F1F',
  brown: '#5D4037',
  sage: '#9CAF88',
  white: '#FFFFFF',
} as const

export const KIDS_COLOR_LABELS: Record<string, string> = {
  '#D4AF37': 'Gold',
  '#2C3E50': 'Navy',
  '#F5F5DC': 'Beige',
  '#1F1F1F': 'Black',
  '#5D4037': 'Earth Brown',
  '#9CAF88': 'Sage',
  '#FFFFFF': 'White',
}

export interface KidsOversizedTeeProduct extends ShopProduct {
  genderCategory: KidsGenderCategory
  colorHexes: string[]
  originalPrice: string
  inStock: boolean
  newest: boolean
  bestseller?: boolean
}

/** Age / height / chest reference for oversized kids tees. */
export const KIDS_SIZE_GUIDE_ROWS = [
  { size: '4-5Y', age: '4–5 yrs', heightIn: '41–45"', heightCm: '104–114 cm', chestIn: '22–24"', chestCm: '56–61 cm' },
  { size: '6-7Y', age: '6–7 yrs', heightIn: '45–50"', heightCm: '114–127 cm', chestIn: '24–26"', chestCm: '61–66 cm' },
  { size: '8-9Y', age: '8–9 yrs', heightIn: '50–54"', heightCm: '127–137 cm', chestIn: '26–28"', chestCm: '66–71 cm' },
  { size: '10-11Y', age: '10–11 yrs', heightIn: '54–58"', heightCm: '137–147 cm', chestIn: '28–30"', chestCm: '71–76 cm' },
  { size: '12-13Y', age: '12–13 yrs', heightIn: '58–62"', heightCm: '147–157 cm', chestIn: '30–32"', chestCm: '76–81 cm' },
] as const

/**
 * Unique Kid-Hero designs only (duplicates removed from listing):
 * Alternates below are used only as hover/secondary gallery angles.
 */
const UNIQUE_KIDS_HEROES = [
  'Kid-Hero-01.png',
  'Kid-Hero-03.png',
  'Kid-Hero-05.png',
  'Kid-Hero-06.png',
  'Kid-Hero-07.png',
  'Kid-Hero-08.png',
  'Kid-Hero-10.png',
  'Kid-Hero-11.png',
] as const

const HOVER_ALTERNATES: Partial<Record<(typeof UNIQUE_KIDS_HEROES)[number], string>> = {
  'Kid-Hero-01.png': 'Kid-Hero-02.png',
  'Kid-Hero-03.png': 'Kid-Hero-04.png',
  'Kid-Hero-08.png': 'Kid-Hero-13.png',
}

const kidsHeroImage = (fileName: string) => `/images/products/kids/${fileName}`

function tee(
  index: number,
  fileName: (typeof UNIQUE_KIDS_HEROES)[number],
  name: string,
  genderCategory: KidsGenderCategory,
  price: number,
  originalPrice: number,
  colors: string[],
  options: { newest?: boolean; bestseller?: boolean; stock?: number } = {},
): KidsOversizedTeeProduct {
  const image = kidsHeroImage(fileName)
  const hoverFile = HOVER_ALTERNATES[fileName]
  const galleryImages = hoverFile ? [image, kidsHeroImage(hoverFile)] : [image]
  const stock = options.stock ?? 24

  return {
    id: `kids-oversized-tee-${index}`,
    slug: `kids-oversized-tee-${index}`,
    name,
    category: 'kids',
    genderCategory,
    price: formatBDT(price),
    comparePrice: formatBDT(originalPrice),
    originalPrice: formatBDT(originalPrice),
    brand: 'SHIS Fashion',
    image,
    galleryImages,
    description: 'Premium heavy cotton oversized drop-shoulder tee designed for modern kids.',
    sizes: [...KIDS_OVERSIZED_SIZES],
    colors: colors.map((hex) => KIDS_COLOR_LABELS[hex] ?? hex),
    colorHexes: colors,
    stock,
    featured: index <= 4,
    newArrival: Boolean(options.newest),
    newest: Boolean(options.newest),
    bestseller: Boolean(options.bestseller),
    inStock: stock > 0,
  }
}

/** 8 distinct designs — one card per unique tee graphic. */
export const kidsOversizedTeeProducts: KidsOversizedTeeProduct[] = [
  tee(1, 'Kid-Hero-01.png', 'Kids Our Daily Graphic Oversized Tee', 'Kids Boy', 950, 1290, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.beige], {
    newest: true,
    bestseller: true,
  }),
  tee(2, 'Kid-Hero-03.png', 'Kids Racing Club Oversized Tee', 'Kids Boy', 890, 1250, [KIDS_COLOR_PALETTE.white, KIDS_COLOR_PALETTE.navy], {
    newest: true,
    stock: 3,
  }),
  tee(3, 'Kid-Hero-05.png', 'Kids Jet Stream Oversized Tee', 'Kids Girl', 870, 1220, [KIDS_COLOR_PALETTE.white, KIDS_COLOR_PALETTE.sage], {
    newest: true,
  }),
  tee(4, 'Kid-Hero-06.png', 'Junior Speed Racer Oversized Tee', 'Kids Boy', 980, 1350, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.gold], {
    newest: true,
    bestseller: true,
  }),
  tee(5, 'Kid-Hero-07.png', 'Kids Smile Graphic Oversized Tee', 'Unisex', 920, 1280, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.navy], {
    stock: 4,
  }),
  tee(6, 'Kid-Hero-08.png', 'Kids Anime Action Oversized Tee', 'Kids Boy', 990, 1390, [KIDS_COLOR_PALETTE.white, KIDS_COLOR_PALETTE.black], {
    newest: true,
    bestseller: true,
  }),
  tee(7, 'Kid-Hero-10.png', 'Junior Street Circle Oversized Tee', 'Kids Boy', 940, 1300, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.beige]),
  tee(8, 'Kid-Hero-11.png', 'Kids Number Friends Oversized Tee', 'Unisex', 860, 1200, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.gold], {
    newest: true,
    stock: 5,
  }),
]

export function getKidsDiscountPercent(product: KidsOversizedTeeProduct) {
  const price = Number.parseFloat(String(product.price).replace(/[^0-9.]/g, ''))
  const original = Number.parseFloat(String(product.originalPrice).replace(/[^0-9.]/g, ''))
  if (!original || original <= price || Number.isNaN(price) || Number.isNaN(original)) {
    return 0
  }

  return Math.max(1, Math.round(((original - price) / original) * 100))
}

export function getKidsBadge(product: KidsOversizedTeeProduct): string | null {
  if (typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5) {
    return `Only ${product.stock} Left`
  }
  if (product.bestseller) {
    return 'Bestseller'
  }
  if (product.newest || product.newArrival) {
    return 'New Arrival'
  }
  return null
}

export function getKidsProductBySlug(slug: string): KidsOversizedTeeProduct | undefined {
  const normalized = decodeURIComponent(slug).trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return kidsOversizedTeeProducts.find((product) => product.slug.toLowerCase() === normalized)
}

export const KIDS_PRODUCT_FABRIC = 'Premium heavy cotton (soft hand-feel, breathable, everyday durable)'
export const KIDS_PRODUCT_CARE = [
  'Machine wash cold, gentle cycle',
  'Wash inside out with similar colours',
  'Do not bleach',
  'Tumble dry low or hang dry',
  'Warm iron inside out if needed',
] as const

export const KIDS_TRUST_BADGES = [
  'Cash on Delivery',
  'Easy Exchange',
  '24–72h Delivery',
  'Phone Confirmation',
] as const

