import { formatBDT, parseBDT } from '../utils/currency'
import {
  getLuxuryBadgeForPrice,
  LUXURY_PRICE_FILTER_MAX,
  LUXURY_PRICE_FILTER_STEP,
  type LuxuryBadgeLabel,
} from '../utils/luxuryBadge'
import { slugify } from '../utils/slugify'
import type { ShopProduct } from './shopData'
import { kurtiCatalogEntries, KURTI_CATALOG_IMAGE_COUNT } from './kurtisCatalog.generated'

export const KURTIS_LISTING_PATH = '/women?sub=kurti'
export const KURTI_SIZES = ['S', 'M', 'L', 'XL'] as const
export const KURTI_IMAGE_DIR = '/images/products/kurtis'
export const KURTI_PAGE_SIZE = 24
/** Max BDT for kurti price-range filters / sliders. */
export const KURTI_PRICE_FILTER_MAX = LUXURY_PRICE_FILTER_MAX
export const KURTI_PRICE_FILTER_STEP = LUXURY_PRICE_FILTER_STEP
export const KURTI_PRICE_FILTER_MIN = 2_400

/** Untitled dump filenames share one generic title — keep each as its own design. */
const UNIQUE_PER_ENTRY_NAMES = new Set(['download kurti'])

export interface KurtiColorVariant {
  color: string
  image: string
  galleryImages: string[]
  price: string
  /** Legacy catalog ids that map into this color (for slug redirects). */
  variantIds: string[]
  variantSlugs: string[]
}

export interface KurtiProduct extends ShopProduct {
  sku: string
  fabric: string
  style: KurtiStyle
  inStock: boolean
  tags: string[]
  /** Stable design group key (`uniqueBy: design_id`). */
  designId: string
  /** Luxury tier badge for pieces above ৳15,000 */
  badge?: LuxuryBadgeLabel
  /** Original asset filename under public/images/products/kurtis (primary shot). */
  filename: string
  /** Per-color image sets for PDP gallery switching. */
  colorVariants: KurtiColorVariant[]
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

type CatalogEntry = (typeof kurtiCatalogEntries)[number]

/**
 * Design identity for listing de-duplication.
 * Named models (e.g. Nairah Porcelain Blue) collapse size/angle shots;
 * generic "Download Kurti" dumps stay one card per image file.
 */
export function getKurtiDesignId(entry: Pick<CatalogEntry, 'id' | 'name'>): string {
  const normalizedName = entry.name.trim().toLowerCase()
  if (UNIQUE_PER_ENTRY_NAMES.has(normalizedName)) {
    return entry.id.trim().toLowerCase()
  }

  const base = slugify(entry.name)
  return base || entry.id.trim().toLowerCase()
}

function primaryColorLabel(colors: string[], index: number): string {
  const cleaned = colors.map((color) => color.trim()).filter(Boolean)
  if (cleaned.length === 1) {
    return cleaned[0]!
  }
  if (cleaned.length > 1) {
    return cleaned.join(' / ')
  }
  return `Variant ${index + 1}`
}

function uniquePreserveOrder(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const key = value.trim()
    if (!key || seen.has(key)) {
      continue
    }
    seen.add(key)
    result.push(key)
  }
  return result
}

function mapEntryRaw(entry: CatalogEntry) {
  const style = isKurtiStyle(entry.style) ? entry.style : 'straight'
  return { entry, style, designId: getKurtiDesignId(entry) }
}

function buildDesignProduct(group: ReturnType<typeof mapEntryRaw>[]): KurtiProduct {
  const primary = group[0]!
  const { entry, style, designId } = primary

  const colorBuckets = new Map<string, KurtiColorVariant>()

  group.forEach((member, index) => {
    const color = primaryColorLabel(member.entry.colors, index)
    const existing = colorBuckets.get(color)
    if (existing) {
      if (!existing.galleryImages.includes(member.entry.image)) {
        existing.galleryImages.push(member.entry.image)
      }
      existing.variantIds.push(member.entry.id)
      existing.variantSlugs.push(member.entry.slug)
      return
    }

    colorBuckets.set(color, {
      color,
      image: member.entry.image,
      galleryImages: [member.entry.image],
      price: formatBDT(member.entry.price),
      variantIds: [member.entry.id],
      variantSlugs: [member.entry.slug],
    })
  })

  const colorVariants = [...colorBuckets.values()]
  const galleryImages = uniquePreserveOrder(group.map((member) => member.entry.image))
  const colors = colorVariants.map((variant) => variant.color)

  const prices = group.map((member) => member.entry.price)
  const listingPrice = Math.min(...prices)
  const badge = getLuxuryBadgeForPrice(listingPrice)
  const stock = group.reduce((sum, member) => sum + member.entry.stock, 0)
  const featured = group.some((member) => member.entry.featured)
  const newArrival = group.some((member) => member.entry.newArrival)

  const baseTags = ['kurti', 'women', 'kurtis', style, entry.fabric.toLowerCase().replace(/\s+/g, '-'), 'design']

  const slugBase = UNIQUE_PER_ENTRY_NAMES.has(entry.name.trim().toLowerCase())
    ? entry.slug
    : `${slugify(entry.name) || designId}`

  return {
    id: designId,
    designId,
    sku: entry.sku,
    slug: slugBase,
    name: entry.name,
    price: formatBDT(listingPrice),
    category: 'kurti',
    brand: 'SHIS Fashion',
    image: entry.image,
    galleryImages,
    description: entry.description,
    sizes: [...KURTI_SIZES],
    colors,
    colorVariants,
    stock,
    featured,
    newArrival,
    fabric: entry.fabric,
    style,
    inStock: stock > 0,
    filename: entry.filename,
    badge: badge ?? undefined,
    tags: badge
      ? [...baseTags, badge.toLowerCase().replace(/\s+/g, '-')]
      : baseTags,
  }
}

function groupCatalogIntoDesigns(): KurtiProduct[] {
  const buckets = new Map<string, ReturnType<typeof mapEntryRaw>[]>()

  for (const entry of kurtiCatalogEntries) {
    const mapped = mapEntryRaw(entry)
    const list = buckets.get(mapped.designId) ?? []
    list.push(mapped)
    buckets.set(mapped.designId, list)
  }

  return [...buckets.values()].map((group) => buildDesignProduct(group))
}

/** Design-grouped kurti products (one card per unique design). */
export const kurtisCollectionProducts: KurtiProduct[] = groupCatalogIntoDesigns()

export const KURTI_CATALOG_COUNT = KURTI_CATALOG_IMAGE_COUNT
export const KURTI_DESIGN_COUNT = kurtisCollectionProducts.length

export function getKurtiColorGallery(
  product: Pick<KurtiProduct, 'colorVariants' | 'galleryImages' | 'image'>,
  color?: string,
): string[] {
  if (color) {
    const match = product.colorVariants.find(
      (variant) => variant.color.toLowerCase() === color.trim().toLowerCase(),
    )
    if (match?.galleryImages.length) {
      return match.galleryImages
    }
  }

  if (product.galleryImages?.length) {
    return product.galleryImages
  }

  return product.image ? [product.image] : []
}

export function getKurtiVariantPrice(
  product: Pick<KurtiProduct, 'colorVariants' | 'price'>,
  color?: string,
): string {
  if (!color) {
    return product.price
  }

  const match = product.colorVariants.find(
    (variant) => variant.color.toLowerCase() === color.trim().toLowerCase(),
  )
  return match?.price ?? product.price
}

export function getKurtiProductBySlug(slug: string): KurtiProduct | undefined {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  const direct = kurtisCollectionProducts.find(
    (product) =>
      product.slug === normalized ||
      product.designId === normalized ||
      String(product.id) === normalized ||
      product.sku.toLowerCase() === normalized,
  )
  if (direct) {
    return direct
  }

  return kurtisCollectionProducts.find((product) =>
    product.colorVariants.some(
      (variant) =>
        variant.variantSlugs.some((entry) => entry.toLowerCase() === normalized) ||
        variant.variantIds.some((entry) => entry.toLowerCase() === normalized),
    ),
  )
}

export function isGeneratedKurtiCatalogProduct(
  product: Pick<ShopProduct, 'id' | 'image'>,
): boolean {
  const image = product.image.trim()
  if (image.includes(`${KURTI_IMAGE_DIR}/`)) {
    return true
  }

  return /^kurti-\d{3}$/i.test(String(product.id).trim()) || String(product.id).includes('-kurti') || Boolean(
    kurtisCollectionProducts.some((entry) => entry.designId === String(product.id) || entry.slug === String(product.id)),
  )
}

/** Authoritative Kurti listing — one card per design (`uniqueBy: design_id`). */
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

export function resolveKurtiListingPriceLabel(product: KurtiProduct): string {
  if (product.colorVariants.length <= 1) {
    return product.price
  }

  const amounts = product.colorVariants.map((variant) => parseBDT(variant.price))
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)
  if (min === max) {
    return formatBDT(min)
  }

  return product.price
}
