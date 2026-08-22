import { getProductSlug } from './productIdentity'

export function getCatalogContentId(product: {
  slug?: string
  name?: string
  id?: string | number
}): string {
  const slug = getProductSlug(product)
  if (slug) {
    return slug
  }

  return String(product.id ?? '').trim()
}

export function getCatalogContentIds(
  products: Array<{ slug?: string; name?: string; id?: string | number }>,
): string[] {
  return products.map((product) => getCatalogContentId(product)).filter(Boolean)
}
