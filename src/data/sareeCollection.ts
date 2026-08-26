import { formatBDT } from '../utils/currency'
import type { ShopProduct } from './shopData'

export interface SareeProduct extends ShopProduct {
  fabric: string
  blousePiece: string
  inStock: boolean
}

const SAREE_IMAGE_EXT: Record<number, 'jpg' | 'png'> = {
  1: 'jpg',
  2: 'jpg',
  3: 'jpg',
  4: 'jpg',
  5: 'png',
  6: 'png',
  7: 'png',
}

function sareeImage(index: number) {
  const ext = SAREE_IMAGE_EXT[index] ?? 'jpg'
  return `/saree/saree.${index}.${ext}`
}

function createSaree(
  index: number,
  slug: string,
  name: string,
  price: number,
  colors: string[],
  fabric: string,
  description: string,
  options: {
    id?: string
    featured?: boolean
    newArrival?: boolean
    stock?: number
  } = {},
): SareeProduct {
  const image = sareeImage(index)

  return {
    id: options.id ?? `saree-${index}`,
    slug,
    name,
    price: formatBDT(price),
    category: 'Saree',
    brand: 'SHIS Fashion',
    image,
    galleryImages: [image],
    fabric,
    blousePiece: 'Included (Unstitched)',
    inStock: true,
    stock: options.stock ?? 10,
    featured: options.featured ?? true,
    newArrival: options.newArrival ?? true,
    description,
    sizes: ['Free Size'],
    colors,
  }
}

/** Static saree edit — images live in `/public/saree/` (`saree.1`–`saree.7`). */
export const sareeCollectionProducts: SareeProduct[] = [
  createSaree(
    1,
    'crimson-red-georgette-saree',
    'Crimson Red Premium Georgette Saree',
    3850,
    ['Crimson Red'],
    'Pure Georgette',
    'Elegant crimson red lightweight georgette saree with subtle lace border details, perfect for evening gatherings and festivities.',
    { id: 'saree-crimson-red', stock: 12 },
  ),
  createSaree(
    2,
    'royal-blue-pleated-saree',
    'Royal Blue Solid Georgette Saree',
    4200,
    ['Royal Blue'],
    'Premium Georgette',
    'Vibrant royal blue solid georgette saree featuring a modern drape with matching border finish.',
    { id: 'saree-royal-blue', stock: 10 },
  ),
  createSaree(
    3,
    'olive-green-silk-saree',
    'Olive Green Festive Handloom Silk Saree',
    4650,
    ['Olive Green'],
    'Handloom Soft Silk',
    'Traditional olive green festive silk saree with refined drape, rich texture, and classic borders.',
    { id: 'saree-olive-green', stock: 8 },
  ),
  createSaree(
    4,
    'mustard-olive-batik-saree',
    'Mustard Olive Batik Print Saree',
    3950,
    ['Mustard', 'Olive'],
    'Cotton Silk Blend',
    'Earthy mustard and olive batik-print saree with charcoal mandala pallu and a matching printed blouse.',
    { stock: 11 },
  ),
  createSaree(
    5,
    'maroon-satin-silver-zari-saree',
    'Maroon Satin Saree with Silver Zari',
    4500,
    ['Maroon'],
    'Satin Silk',
    'Lustrous maroon satin saree with a wide silver zari floral border, cut for festive evenings and celebrations.',
    { stock: 9 },
  ),
  createSaree(
    6,
    'royal-purple-gold-buta-saree',
    'Royal Purple Silk Saree with Gold Buta',
    4850,
    ['Royal Purple'],
    'Premium Silk',
    'Deep purple silk saree with gold buta motifs and a rich zari border for temple, wedding, and occasion wear.',
    { stock: 7 },
  ),
  createSaree(
    7,
    'maroon-bandhani-print-saree',
    'Maroon Bandhani Print Saree',
    4100,
    ['Maroon'],
    'Printed Georgette',
    'Classic maroon bandhani-print saree with circular motifs, a slim gold border, and an easy everyday drape.',
    { stock: 13 },
  ),
]

/** Alias matching the requested export name. */
export const sareeCollection = sareeCollectionProducts

export function getSareeProductBySlug(slug: string): SareeProduct | undefined {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return sareeCollectionProducts.find((product) => product.slug.toLowerCase() === normalized)
}
