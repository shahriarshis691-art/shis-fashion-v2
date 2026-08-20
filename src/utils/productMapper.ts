import type { AdminProduct } from '../firebase/adminService'
import type { ShopProduct } from '../data/shopData'
import { getManagedImageEntries, getProductImage } from './media'
import { getProductSlug } from './productIdentity'
import { getProductStockTotal } from './variantStock'
import { normalizeSizes } from './sizes'

export function mapAdminProductToShopProduct(
  product: AdminProduct,
  overrides: Partial<ShopProduct> = {},
): ShopProduct {
  const imageEntries = getManagedImageEntries(product, 1)
  const primaryImage = getProductImage(product)

  return {
    id: product.id,
    slug: getProductSlug(product),
    name: product.name,
    price: product.price,
    comparePrice: product.comparePrice,
    brand: product.brand,
    category: product.category,
    image: primaryImage || imageEntries[0]?.url || '',
    description: product.description,
    galleryImages: imageEntries.map((entry) => entry.url).filter(Boolean),
    stock: getProductStockTotal(product),
    featured: product.featured,
    newArrival: product.newArrival,
    sizes: normalizeSizes(product.sizes),
    colors: Array.isArray(product.colors) ? product.colors.map((color) => color.trim()).filter(Boolean) : [],
    ...overrides,
  }
}
