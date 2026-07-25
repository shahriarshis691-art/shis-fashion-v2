import type { AdminProduct } from '../firebase/adminService'
import type { ShopProduct } from '../data/shopData'
import { getManagedImageEntries, getProductImage } from './media'

export function mapAdminProductToShopProduct(
  product: AdminProduct,
  overrides: Partial<ShopProduct> = {},
): ShopProduct {
  const imageEntries = getManagedImageEntries(product, 1)
  const primaryImage = getProductImage(product)

  return {
    id: product.id,
    slug: slugify(product.name),
    name: product.name,
    price: product.price,
    comparePrice: product.comparePrice,
    category: product.category,
    image: primaryImage || imageEntries[0]?.url || '',
    description: product.description,
    galleryImages: imageEntries.map((entry) => entry.url).filter(Boolean),
    stock: product.stock,
    featured: product.featured,
    newArrival: product.newArrival,
    ...overrides,
  }
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
