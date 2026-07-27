import { resolveCanonicalSubcategorySlug } from './categoryTaxonomy'

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
  stock?: number
  featured?: boolean
  newArrival?: boolean
}

export const shopCategories: ShopCategory[] = [
  { slug: 'oversized-tee', title: 'Oversized Tee', description: 'Relaxed silhouettes with elevated texture.', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80' },
  { slug: 'unisex-tee', title: 'Unisex Tee', description: 'Minimal staples for everyday layering.', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80' },
  { slug: 'denim', title: 'Denim', description: 'Refined denim with a premium finish.', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80' },
  { slug: 'mens-shirt', title: "Men's Shirt", description: 'Polished structure in a relaxed fit.', image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80' },
  { slug: 'womens-dresses', title: "Women's Dresses", description: 'Fluid forms with effortless movement.', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80' },
  { slug: 'western-outfits', title: 'Western Outfits', description: 'Modern staples with a bold edge.', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80' },
  { slug: 'couples', title: 'Couples Collection', description: 'Coordinated pieces for shared moments.', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80' },
  { slug: 'gift', title: 'Gift Collection', description: 'Thoughtful pieces with a premium finish.', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80' },
  { slug: 'kids', title: 'Kids Collection', description: 'Soft tailoring for little style legends.', image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80' },
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
