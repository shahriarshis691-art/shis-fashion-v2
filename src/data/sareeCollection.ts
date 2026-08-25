import { formatBDT } from '../utils/currency'
import type { ShopProduct } from './shopData'

export interface SareeProduct extends ShopProduct {
  fabric: string
  blousePiece: string
  inStock: boolean
}

/** Static saree edit — images live in `/public/saree/`. */
export const sareeCollectionProducts: SareeProduct[] = [
  {
    id: 'saree-crimson-red',
    slug: 'crimson-red-georgette-saree',
    name: 'Crimson Red Premium Georgette Saree',
    price: formatBDT(3850),
    category: 'saree',
    brand: 'SHIS Fashion',
    image: '/saree/saree.1.jpg',
    galleryImages: ['/saree/saree.1.jpg'],
    fabric: 'Pure Georgette',
    blousePiece: 'Included (Unstitched)',
    inStock: true,
    stock: 12,
    featured: true,
    newArrival: true,
    description:
      'Elegant crimson red lightweight georgette saree with subtle lace border details, perfect for evening gatherings and festivities.',
    sizes: ['Free Size'],
    colors: ['Crimson Red'],
  },
  {
    id: 'saree-royal-blue',
    slug: 'royal-blue-pleated-saree',
    name: 'Royal Blue Solid Georgette Saree',
    price: formatBDT(4200),
    category: 'saree',
    brand: 'SHIS Fashion',
    image: '/saree/saree.2.jpg',
    galleryImages: ['/saree/saree.2.jpg'],
    fabric: 'Premium Georgette',
    blousePiece: 'Included (Unstitched)',
    inStock: true,
    stock: 10,
    featured: true,
    newArrival: true,
    description:
      'Vibrant royal blue solid georgette saree featuring a modern drape with matching border finish.',
    sizes: ['Free Size'],
    colors: ['Royal Blue'],
  },
  {
    id: 'saree-olive-green',
    slug: 'olive-green-silk-saree',
    name: 'Olive Green Festive Handloom Silk Saree',
    price: formatBDT(4650),
    category: 'saree',
    brand: 'SHIS Fashion',
    image: '/saree/saree.3.jpg',
    galleryImages: ['/saree/saree.3.jpg'],
    fabric: 'Handloom Soft Silk',
    blousePiece: 'Included (Unstitched)',
    inStock: true,
    stock: 8,
    featured: true,
    newArrival: true,
    description:
      'Traditional olive green festive silk saree with refined drape, rich texture, and classic borders.',
    sizes: ['Free Size'],
    colors: ['Olive Green'],
  },
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
