import type { ShopProduct } from './shopData'

export const WOMENS_BAGGY_DENIM_SIZES = ['26', '28', '30', '32', '34'] as const
export const WOMENS_BAGGY_DENIM_LISTING_PATH = '/collections/womens-baggy'
export const WOMENS_BAGGY_HERO_IMAGE = '/hero/womens-baggy/womens-jeans-listing.png'
export const WOMENS_BAGGY_COVER_IMAGE = WOMENS_BAGGY_HERO_IMAGE

export interface WomensBaggyDenimProduct extends ShopProduct {
  sku: string
  fit: 'Baggy' | 'Wide Leg' | 'Loose'
  fabric: string
  tags: string[]
  inStock: boolean
}

/**
 * Static women's baggy denim catalog.
 * Populate when `/public/collections/womens-baggy/` assets are ready;
 * live Firestore products with matching category/tags still appear via merge.
 */
export const womensBaggyDenimCollectionProducts: WomensBaggyDenimProduct[] = []

export function isWomensBaggyDenimProduct(
  product: Pick<ShopProduct, 'name' | 'slug' | 'category'> & { tags?: string[] },
) {
  const tags = (product.tags ?? []).map((tag) => tag.trim().toLowerCase())
  if (
    tags.includes('womens-baggy')
    || (tags.includes('baggy') && (tags.includes('women') || tags.includes("women's")))
  ) {
    return true
  }

  const text = [product.name, product.slug, product.category].join(' ').toLowerCase()
  if (/mens?-?baggy|men'?s\s+baggy/.test(text)) {
    return false
  }

  return /womens?-?baggy|women'?s\s+baggy|ladies?\s+baggy/.test(text)
    || (/\bbaggy\b/.test(text) && /\bwomen|ladies|female\b/.test(text))
}

export function getWomensBaggyDenimProductBySlug(slug: string): WomensBaggyDenimProduct | undefined {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return womensBaggyDenimCollectionProducts.find(
    (product) =>
      product.slug === normalized ||
      String(product.id) === normalized ||
      product.sku.toLowerCase() === normalized,
  )
}

export function mergeWomensBaggyDenimCatalog(liveProducts: ShopProduct[]): ShopProduct[] {
  const taken = new Set(
    liveProducts.map((product) => product.slug.trim().toLowerCase()).filter(Boolean),
  )

  const extras = womensBaggyDenimCollectionProducts.filter(
    (product) => !taken.has(product.slug.toLowerCase()),
  )

  return extras.length ? [...liveProducts, ...extras] : liveProducts
}
