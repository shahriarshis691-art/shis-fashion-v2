import { formatBDT } from '../utils/currency'
import { filterListingProducts } from '../utils/listingProducts'
import type { ShopProduct } from './shopData'

export interface HalfShirtProduct extends ShopProduct {
  fit: 'Regular' | 'Oversized'
  fabric: string
}

const HALF_SHIRT_SIZES = ['M', 'L', 'XL', 'XXL'] as const
const HALF_SHIRT_IMAGE_DIR = '/collections/half-shirts'

function halfShirtImage(index: number) {
  return `${HALF_SHIRT_IMAGE_DIR}/half-shirt-${index}.jpg`
}

function createHalfShirt(
  index: number,
  slug: string,
  name: string,
  price: number,
  colors: string[],
  description: string,
  options: {
    fit?: HalfShirtProduct['fit']
    fabric?: string
    featured?: boolean
    newArrival?: boolean
    stock?: number
  } = {},
): HalfShirtProduct {
  const image = halfShirtImage(index)

  return {
    id: `half-shirt-${index}`,
    slug,
    name,
    price: formatBDT(price),
    category: 'half-shirts',
    brand: 'SHIS Fashion',
    image,
    galleryImages: [image],
    description,
    sizes: [...HALF_SHIRT_SIZES],
    colors,
    stock: options.stock ?? 16,
    featured: options.featured ?? false,
    newArrival: options.newArrival ?? true,
    fit: options.fit ?? 'Regular',
    fabric: options.fabric ?? 'Cotton',
  }
}

export const halfShirtCollectionProducts: HalfShirtProduct[] = [
  createHalfShirt(
    1,
    'ivory-vine-print-half-shirt',
    'Ivory Vine Print Half Shirt',
    1250,
    ['Ivory', 'White'],
    'Crisp ivory cotton with a quiet vine print and an easy half-sleeve drape for warm Dhaka days.',
    { featured: true, newArrival: true, stock: 18 },
  ),
  createHalfShirt(
    2,
    'silver-microcheck-half-shirt',
    'Silver Microcheck Half Shirt',
    1190,
    ['Silver', 'Pale Blue'],
    'Fine microcheck texture in silver-blue with a clean collar and tailored half-sleeve finish.',
    { fabric: 'Cotton Blend', stock: 20 },
  ),
  createHalfShirt(
    3,
    'maroon-geometric-half-shirt',
    'Maroon Geometric Print Half Shirt',
    1290,
    ['Maroon'],
    'Deep maroon cotton with a compact geometric print and a refined everyday camp-collar ease.',
    { featured: true, stock: 14 },
  ),
  createHalfShirt(
    4,
    'mustard-block-print-half-shirt',
    'Mustard Block Print Half Shirt',
    1350,
    ['Mustard'],
    'Warm mustard block print with vertical artisan motifs, cut for considered casual wear.',
    { fabric: 'Cotton', featured: true, stock: 15 },
  ),
  createHalfShirt(
    5,
    'violet-mandala-half-shirt',
    'Violet Mandala Print Half Shirt',
    1390,
    ['Violet'],
    'Tonal violet mandala print on a breathable half-shirt body for evening and weekend edits.',
    { stock: 12 },
  ),
  createHalfShirt(
    6,
    'coral-geo-print-half-shirt',
    'Coral Geo Print Half Shirt',
    1320,
    ['Coral'],
    'Vivid coral ground with a white geometric print, balanced for heat and everyday polish.',
    { featured: true, stock: 17 },
  ),
  createHalfShirt(
    7,
    'sky-twin-pocket-half-shirt',
    'Sky Twin Pocket Half Shirt',
    1450,
    ['Sky Blue'],
    'Clear sky-blue cotton with twin flap pockets and a structured collar for smart-casual days.',
    { fabric: 'Cotton', featured: true, stock: 11 },
  ),
  createHalfShirt(
    8,
    'mist-dotdash-half-shirt',
    'Mist Dotdash Print Half Shirt',
    1220,
    ['Mist Grey'],
    'Soft mist-grey micro print with a single chest pocket and an unforced regular fit.',
    { stock: 19 },
  ),
  createHalfShirt(
    9,
    'indigo-diamond-half-shirt',
    'Indigo Diamond Print Half Shirt',
    1280,
    ['Indigo'],
    'Indigo diamond geometry on a breathable half-sleeve shirt, styled for city heat.',
    { featured: true, stock: 13 },
  ),
  createHalfShirt(
    10,
    'navy-mosaic-half-shirt',
    'Navy Mosaic Print Half Shirt',
    1420,
    ['Navy', 'Coral'],
    'Navy mosaic print with coral and cyan accents, cut for presence without heaviness.',
    { fabric: 'Cotton Blend', featured: true, stock: 10 },
  ),
  createHalfShirt(
    11,
    'ice-cyan-geo-half-shirt',
    'Ice Cyan Geo Half Shirt',
    1260,
    ['Ice Blue', 'White'],
    'White-ground cyan geometry with a clean pointed collar and a light summer hand-feel.',
    { stock: 16 },
  ),
  createHalfShirt(
    12,
    'crimson-stripe-half-shirt',
    'Crimson Stripe Half Shirt',
    1180,
    ['Crimson', 'White'],
    'Fine crimson-and-white vertical stripe with navy inner collar detailing and a chest pocket.',
    { fabric: 'Poplin', newArrival: true, stock: 21 },
  ),
  createHalfShirt(
    13,
    'midnight-kaleidoscope-half-shirt',
    'Midnight Kaleidoscope Half Shirt',
    1380,
    ['Midnight Navy'],
    'Midnight navy kaleidoscope print with a calm drape for evening gatherings and travel.',
    { featured: true, stock: 9 },
  ),
]

export function getHalfShirtProductBySlug(slug: string): HalfShirtProduct | undefined {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return halfShirtCollectionProducts.find((product) => product.slug === normalized || String(product.id) === normalized)
}

export function mergeHalfShirtCatalog(liveProducts: ShopProduct[]): ShopProduct[] {
  const taken = new Set(
    liveProducts.map((product) => product.slug.trim().toLowerCase()).filter(Boolean),
  )

  const extras = halfShirtCollectionProducts.filter((product) => !taken.has(product.slug.toLowerCase()))
  return filterListingProducts(extras.length ? [...liveProducts, ...extras] : liveProducts)
}
