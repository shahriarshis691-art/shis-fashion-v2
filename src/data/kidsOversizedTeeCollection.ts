import { formatBDT } from '../utils/currency'
import type { ShopProduct } from './shopData'

export type KidsGenderCategory = 'Kids Boy' | 'Kids Girl' | 'Unisex'

export const KIDS_OVERSIZED_SIZES = ['4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'] as const

export const KIDS_COLOR_PALETTE = {
  navy: '#2C3E50',
  gold: '#D4AF37',
  brown: '#5D4037',
  black: '#1F1F1F',
  beige: '#F5F5DC',
} as const

export const KIDS_COLOR_LABELS: Record<string, string> = {
  '#2C3E50': 'Navy',
  '#D4AF37': 'Gold',
  '#5D4037': 'Earth Brown',
  '#1F1F1F': 'Black',
  '#F5F5DC': 'Beige',
}

export interface KidsOversizedTeeProduct extends ShopProduct {
  genderCategory: KidsGenderCategory
  colorHexes: string[]
  originalPrice: string
  inStock: boolean
  newest: boolean
}

const IMG = {
  a: 'https://res.cloudinary.com/oynk45cl/image/upload/f_auto,q_auto,c_fill,g_auto,w_960,h_1280/733499845_122185741844748051_3566784808270551668_n_2_z9zzsr',
  b: '/hero/effortless-elegance-tee.png',
  c: '/collections/men-category.webp',
  d: '/hero/hero-premium-casual-shirt.webp',
} as const

function tee(
  index: number,
  name: string,
  genderCategory: KidsGenderCategory,
  price: number,
  originalPrice: number,
  colors: string[],
  image: string,
  newest = false,
): KidsOversizedTeeProduct {
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
    description: 'Premium heavy cotton oversized drop-shoulder tee for modern kids.',
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
  tee(1, 'Kids Vintage Acid Wash Oversized Tee', 'Unisex', 790, 1150, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.beige], IMG.a, true),
  tee(2, 'Junior Retro Graphic Drop-Shoulder Tee', 'Kids Boy', 850, 1190, [KIDS_COLOR_PALETTE.navy, KIDS_COLOR_PALETTE.gold], IMG.b, true),
  tee(3, 'Kids Relaxed Fit Earth Brown Tee', 'Unisex', 720, 1090, [KIDS_COLOR_PALETTE.brown, KIDS_COLOR_PALETTE.beige], IMG.c),
  tee(4, 'Urban Minimalist Oversized Tee - Olive Mood', 'Kids Boy', 780, 1120, [KIDS_COLOR_PALETTE.navy, KIDS_COLOR_PALETTE.black], IMG.d, true),
  tee(5, 'Kids Soft Pastel Drop-Shoulder Tee', 'Kids Girl', 690, 1050, [KIDS_COLOR_PALETTE.beige, KIDS_COLOR_PALETTE.gold], IMG.a),
  tee(6, 'Street Classic Boxy Kids Tee', 'Kids Boy', 760, 1100, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.navy, KIDS_COLOR_PALETTE.beige], IMG.b, true),
  tee(7, 'Kids Heritage Script Oversized Tee', 'Unisex', 810, 1180, [KIDS_COLOR_PALETTE.brown, KIDS_COLOR_PALETTE.black], IMG.c),
  tee(8, 'Junior Cloud Soft Heavy Cotton Tee', 'Kids Girl', 740, 1110, [KIDS_COLOR_PALETTE.beige, KIDS_COLOR_PALETTE.navy], IMG.d, true),
  tee(9, 'Kids Acid Wash Shadow Oversized Tee', 'Kids Boy', 880, 1250, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.brown], IMG.a),
  tee(10, 'Modern Kids Everyday Drop Tee', 'Unisex', 650, 990, [KIDS_COLOR_PALETTE.navy, KIDS_COLOR_PALETTE.beige], IMG.b),
  tee(11, 'Kids Golden Hour Graphic Tee', 'Kids Girl', 830, 1200, [KIDS_COLOR_PALETTE.gold, KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.beige], IMG.c, true),
  tee(12, 'Junior Structured Soft Box Tee', 'Kids Boy', 770, 1130, [KIDS_COLOR_PALETTE.navy, KIDS_COLOR_PALETTE.brown], IMG.d),
  tee(13, 'Kids Minimal Line Art Oversized Tee', 'Unisex', 710, 1080, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.beige], IMG.a, true),
  tee(14, 'Petite Urban Relaxed Kids Tee', 'Kids Girl', 730, 1095, [KIDS_COLOR_PALETTE.beige, KIDS_COLOR_PALETTE.brown], IMG.b),
  tee(15, 'Kids Bold Contrast Drop-Shoulder Tee', 'Kids Boy', 890, 1290, [KIDS_COLOR_PALETTE.navy, KIDS_COLOR_PALETTE.gold, KIDS_COLOR_PALETTE.black], IMG.c, true),
  tee(16, 'Signature Kids Soft Luxe Oversized Tee', 'Unisex', 950, 1350, [KIDS_COLOR_PALETTE.black, KIDS_COLOR_PALETTE.beige, KIDS_COLOR_PALETTE.brown], IMG.d, true),
]

export function getKidsDiscountPercent(product: KidsOversizedTeeProduct) {
  const price = Number.parseFloat(String(product.price).replace(/[^0-9.]/g, ''))
  const original = Number.parseFloat(String(product.originalPrice).replace(/[^0-9.]/g, ''))
  if (!original || original <= price || Number.isNaN(price) || Number.isNaN(original)) {
    return 0
  }

  return Math.max(1, Math.round(((original - price) / original) * 100))
}
