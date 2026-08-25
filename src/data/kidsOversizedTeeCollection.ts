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
}

/**
 * Unique Kid-Hero designs only (duplicates removed):
 * - Kid-Hero-01 kept for black "ourdailykids" graphic (dropped 02, 09)
 * - Kid-Hero-03 kept for white Racing Club graphic (dropped 04)
 * - Kid-Hero-08 kept for white anime graphic (dropped 13)
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

const kidsHeroImage = (fileName: (typeof UNIQUE_KIDS_HEROES)[number]) =>
  `/images/products/kids/${fileName}`

function tee(
  index: number,
  fileName: (typeof UNIQUE_KIDS_HEROES)[number],
  name: string,
  genderCategory: KidsGenderCategory,
  price: number,
  originalPrice: number,
  colors: string[],
  newest = false,
): KidsOversizedTeeProduct {
  const image = kidsHeroImage(fileName)

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
    galleryImages: [image],
    description: 'Premium heavy cotton oversized drop-shoulder tee designed for modern kids.',
    sizes: [...KIDS_OVERSIZED_SIZES],
    colors: colors.map((hex) => KIDS_COLOR_LABELS[hex] ?? hex),
    colorHexes: colors,
    stock: 24,
    featured: index <= 4,
    newArrival: newest,
    newest,
    inStock: true,
  }
}

/** 8 distinct designs — one card per unique tee graphic. */
export const kidsOversizedTeeProducts: KidsOversizedTeeProduct[] = [
  tee(1, 'Kid-Hero-01.png', 'Kids Our Daily Graphic Oversized Tee', 'Kids Boy', 950, 1290, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.beige], true),
  tee(2, 'Kid-Hero-03.png', 'Kids Racing Club Oversized Tee', 'Kids Boy', 890, 1250, [KIDS_COLOR_PALETTE.white, KIDS_COLOR_PALETTE.navy], true),
  tee(3, 'Kid-Hero-05.png', 'Kids Jet Stream Oversized Tee', 'Kids Girl', 870, 1220, [KIDS_COLOR_PALETTE.white, KIDS_COLOR_PALETTE.sage], true),
  tee(4, 'Kid-Hero-06.png', 'Junior Speed Racer Oversized Tee', 'Kids Boy', 980, 1350, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.gold], true),
  tee(5, 'Kid-Hero-07.png', 'Kids Smile Graphic Oversized Tee', 'Unisex', 920, 1280, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.navy]),
  tee(6, 'Kid-Hero-08.png', 'Kids Anime Action Oversized Tee', 'Kids Boy', 990, 1390, [KIDS_COLOR_PALETTE.white, KIDS_COLOR_PALETTE.black], true),
  tee(7, 'Kid-Hero-10.png', 'Junior Street Circle Oversized Tee', 'Kids Boy', 940, 1300, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.beige]),
  tee(8, 'Kid-Hero-11.png', 'Kids Number Friends Oversized Tee', 'Unisex', 860, 1200, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.gold], true),
]

export function getKidsDiscountPercent(product: KidsOversizedTeeProduct) {
  const price = Number.parseFloat(String(product.price).replace(/[^0-9.]/g, ''))
  const original = Number.parseFloat(String(product.originalPrice).replace(/[^0-9.]/g, ''))
  if (!original || original <= price || Number.isNaN(price) || Number.isNaN(original)) {
    return 0
  }

  return Math.max(1, Math.round(((original - price) / original) * 100))
}
