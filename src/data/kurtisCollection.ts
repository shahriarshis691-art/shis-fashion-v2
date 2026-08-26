import { formatBDT } from '../utils/currency'
import type { ShopProduct } from './shopData'
import { kurtiCatalogEntries, KURTI_CATALOG_IMAGE_COUNT } from './kurtisCatalog.generated'

export const KURTIS_LISTING_PATH = '/women?sub=kurti'
export const KURTI_SIZES = ['S', 'M', 'L', 'XL'] as const
export const KURTI_IMAGE_DIR = '/images/products/kurtis'
export const KURTI_PAGE_SIZE = 24

export interface KurtiProduct extends ShopProduct {
  sku: string
  fabric: string
  style: KurtiStyle
  inStock: boolean
  tags: string[]
  /** Original asset filename under public/images/products/kurtis */
  filename: string
}

export type KurtiStyle =
  | 'anarkali'
  | 'straight'
  | 'a-line'
  | 'chikankari'
  | 'printed'
  | 'embroidered'
  | 'short'
  | 'long'

function isKurtiStyle(value: string): value is KurtiStyle {
  return (
    value === 'anarkali' ||
    value === 'straight' ||
    value === 'a-line' ||
    value === 'chikankari' ||
    value === 'printed' ||
    value === 'embroidered' ||
    value === 'short' ||
    value === 'long'
  )
}

function mapGeneratedEntry(entry: (typeof kurtiCatalogEntries)[number]): KurtiProduct {
  const style = isKurtiStyle(entry.style) ? entry.style : 'straight'

  return {
    id: entry.id,
    sku: entry.sku,
    slug: entry.slug,
    name: entry.name,
    price: formatBDT(entry.price),
    category: 'kurti',
    brand: 'SHIS Fashion',
    image: entry.image,
    galleryImages: [entry.image],
    description: entry.description,
    sizes: [...KURTI_SIZES],
    colors: entry.colors,
    stock: entry.stock,
    featured: entry.featured,
    newArrival: entry.newArrival,
    fabric: entry.fabric,
    style,
    inStock: true,
    filename: entry.filename,
    tags: ['kurti', 'women', 'kurtis', style, entry.fabric.toLowerCase().replace(/\s+/g, '-')],
  }
}

/** All kurti products mapped from files in public/images/products/kurtis/ */
export const kurtisCollectionProducts: KurtiProduct[] = kurtiCatalogEntries.map(mapGeneratedEntry)

export const KURTI_CATALOG_COUNT = KURTI_CATALOG_IMAGE_COUNT

export function getKurtiProductBySlug(slug: string): KurtiProduct | undefined {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return kurtisCollectionProducts.find(
    (product) =>
      product.slug === normalized ||
      String(product.id) === normalized ||
      product.sku.toLowerCase() === normalized,
  )
}

export function isGeneratedKurtiCatalogProduct(
  product: Pick<ShopProduct, 'id' | 'image'>,
): boolean {
  const image = product.image.trim()
  if (image.includes(`${KURTI_IMAGE_DIR}/`)) {
    return true
  }

  return /^kurti-\d{3}$/i.test(String(product.id).trim())
}

/** Authoritative Kurti listing source — every image under public/images/products/kurtis/. */
export function getKurtiListingProducts(): KurtiProduct[] {
  return kurtisCollectionProducts
}

export function isKurtiProduct(
  product: Pick<ShopProduct, 'name' | 'slug' | 'category' | 'id' | 'image'> & { tags?: string[] },
) {
  if (isGeneratedKurtiCatalogProduct(product)) {
    return true
  }

  const tags = (product.tags ?? []).map((tag) => tag.trim().toLowerCase())
  if (tags.includes('kurti') || tags.includes('kurtis')) {
    return true
  }

  if (product.category.trim().toLowerCase() === 'kurti') {
    return true
  }

  const text = [product.name, product.slug, product.category].join(' ').toLowerCase()
  return /\bkurti\b|\bkurtis\b|\banarkali\b|\bchikankari\b/.test(text)
}

export function mergeKurtisCatalog(liveProducts: ShopProduct[]): ShopProduct[] {
  const withoutLegacyKurtis = liveProducts.filter(
    (product) => !isKurtiProduct(product) || isGeneratedKurtiCatalogProduct(product),
  )

  const taken = new Set(
    withoutLegacyKurtis.map((product) => product.slug.trim().toLowerCase()).filter(Boolean),
  )

  const extras = kurtisCollectionProducts.filter(
    (product) => !taken.has(product.slug.toLowerCase()),
  )

  return extras.length ? [...withoutLegacyKurtis, ...extras] : withoutLegacyKurtis
}
