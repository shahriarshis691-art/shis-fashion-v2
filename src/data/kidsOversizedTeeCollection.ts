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
} as const

export const KIDS_COLOR_LABELS: Record<string, string> = {
  '#D4AF37': 'Gold',
  '#2C3E50': 'Navy',
  '#F5F5DC': 'Beige',
  '#1F1F1F': 'Black',
  '#5D4037': 'Earth Brown',
  '#9CAF88': 'Sage',
}

export interface KidsOversizedTeeProduct extends ShopProduct {
  genderCategory: KidsGenderCategory
  colorHexes: string[]
  originalPrice: string
  inStock: boolean
  newest: boolean
}

/** Local kids oversized tee assets: public/images/products/kids/kids-tee-1.jpg … kids-tee-15.jpg */
const kidsTeeImage = (index: number) => `/images/products/kids/kids-tee-${index}.jpg`

function tee(
  index: number,
  name: string,
  genderCategory: KidsGenderCategory,
  price: number,
  originalPrice: number,
  colors: string[],
  newest = false,
): KidsOversizedTeeProduct {
  const image = kidsTeeImage(index)

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
    featured: index <= 6,
    newArrival: newest,
    newest,
    inStock: true,
  }
}

export const kidsOversizedTeeProducts: KidsOversizedTeeProduct[] = [
  tee(1, 'Kids Sage Green Oversized Tee', 'Unisex', 950, 1290, [KIDS_COLOR_PALETTE.sage, KIDS_COLOR_PALETTE.beige], true),
  tee(2, 'Junior Midnight Navy Drop Tee', 'Kids Boy', 890, 1250, [KIDS_COLOR_PALETTE.navy, KIDS_COLOR_PALETTE.black], true),
  tee(3, 'Kids Soft Beige Boxy Tee', 'Kids Girl', 850, 1190, [KIDS_COLOR_PALETTE.beige, KIDS_COLOR_PALETTE.gold], true),
  tee(4, 'Urban Charcoal Kids Oversized Tee', 'Kids Boy', 920, 1280, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.navy]),
  tee(5, 'Petite Earth Brown Relaxed Tee', 'Kids Girl', 870, 1220, [KIDS_COLOR_PALETTE.brown, KIDS_COLOR_PALETTE.beige], true),
  tee(6, 'Kids Golden Hour Graphic Tee', 'Unisex', 980, 1350, [KIDS_COLOR_PALETTE.gold, KIDS_COLOR_PALETTE.black], true),
  tee(7, 'Junior Street Classic Drop Tee', 'Kids Boy', 910, 1270, [KIDS_COLOR_PALETTE.navy, KIDS_COLOR_PALETTE.beige]),
  tee(8, 'Kids Cloud Soft Pastel Tee', 'Kids Girl', 860, 1200, [KIDS_COLOR_PALETTE.beige, KIDS_COLOR_PALETTE.sage], true),
  tee(9, 'Modern Olive Mood Kids Tee', 'Unisex', 940, 1300, [KIDS_COLOR_PALETTE.sage, KIDS_COLOR_PALETTE.navy]),
  tee(10, 'Junior Bold Contrast Oversized Tee', 'Kids Boy', 990, 1390, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.gold], true),
  tee(11, 'Kids Heritage Script Soft Tee', 'Unisex', 880, 1240, [KIDS_COLOR_PALETTE.brown, KIDS_COLOR_PALETTE.black]),
  tee(12, 'Petite Urban Minimal Kids Tee', 'Kids Girl', 900, 1260, [KIDS_COLOR_PALETTE.beige, KIDS_COLOR_PALETTE.navy], true),
  tee(13, 'Kids Acid Wash Shadow Tee', 'Kids Boy', 930, 1310, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.brown]),
  tee(14, 'Junior Soft Luxe Studio Tee', 'Kids Girl', 960, 1330, [KIDS_COLOR_PALETTE.beige, KIDS_COLOR_PALETTE.gold], true),
  tee(15, 'Signature Kids Everyday Drop Tee', 'Unisex', 950, 1320, [KIDS_COLOR_PALETTE.navy, KIDS_COLOR_PALETTE.sage, KIDS_COLOR_PALETTE.black], true),
]

export function getKidsDiscountPercent(product: KidsOversizedTeeProduct) {
  const price = Number.parseFloat(String(product.price).replace(/[^0-9.]/g, ''))
  const original = Number.parseFloat(String(product.originalPrice).replace(/[^0-9.]/g, ''))
  if (!original || original <= price || Number.isNaN(price) || Number.isNaN(original)) {
    return 0
  }

  return Math.max(1, Math.round(((original - price) / original) * 100))
}
