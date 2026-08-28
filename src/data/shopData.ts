import { resolveCanonicalSubcategorySlug } from './categoryTaxonomy'
import { kurtiCatalogEntries } from './kurtisCatalog.generated'
import type { ProductVariantStock } from '../utils/variantStock'

const kurtiCategoryImage =
  kurtiCatalogEntries[0]?.image ?? '/images/products/kurtis/Beautiful%20dress.jpg'

export interface ShopCategory {
  slug: string
  title: string
  description: string
  image: string
}

export interface ShopProduct {
  id: number | string
  slug: string
  name: string
  price: string
  comparePrice?: string
  discount?: string
  category: string
  brand?: string
  image: string
  description: string
  galleryImages?: string[]
  sizes?: string[]
  colors?: string[]
  variants?: ProductVariantStock[]
  stock?: number
  featured?: boolean
  newArrival?: boolean
}

export const shopCategories: ShopCategory[] = [
  { slug: 'oversized-tee', title: 'Oversized Tee', description: 'Relaxed silhouettes with elevated texture.', image: '/hero/kids/timeless-oversize-hero.source.png' },
  { slug: 'unisex-tee', title: 'Unisex Tee', description: 'Minimal staples for everyday layering.', image: '/og-image.svg' },
  { slug: 'denim', title: 'Denim', description: 'Refined denim with a premium finish.', image: '/collections/featured-denim-collection.jpg' },
  { slug: 'mens-shirt', title: "Men's Shirt", description: 'Polished structure in a relaxed fit.', image: '/og-image.svg' },
  { slug: 'womens-dresses', title: "Women's Dresses", description: 'Fluid forms with effortless movement.', image: '/og-image.svg' },
  { slug: 'saree', title: 'Saree', description: 'Refined weaves and fluid drapes for considered elegance.', image: '/collections/featured-saree-collection.jpg' },
  { slug: 'kurti', title: 'Kurti', description: 'Indian women’s kurtis — anarkali, straight, A-line, chikankari, and embroidered styles.', image: kurtiCategoryImage },
  { slug: 'womens-baggy', title: "Women's Baggy", description: 'Loose and wide-leg baggy jeans for women with a premium denim finish.', image: '/hero/womens-baggy/womens-jeans-listing.png' },
  { slug: 'kids', title: 'Kids Collection', description: 'Soft tailoring for little style legends.', image: '/og-image.svg' },
]

export const shopProducts: ShopProduct[] = []

export function getCategoryBySlug(slug: string) {
  const normalized = resolveCanonicalSubcategorySlug(slug)

  return shopCategories.find((category) => {
    if (category.slug === slug) {
      return true
    }

    return resolveCanonicalSubcategorySlug(category.slug) === normalized
  })
}

export function getProductsByCategory(slug: string) {
  const normalized = resolveCanonicalSubcategorySlug(slug)

  return shopProducts.filter((product) => {
    if (product.category === slug) {
      return true
    }

    return resolveCanonicalSubcategorySlug(product.category) === normalized
  })
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getFeaturedProducts(_limit = 4) {
  return []
}
