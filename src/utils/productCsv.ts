import type { AdminProduct } from '../firebase/adminService'
import { formatBDT, parseBDT } from './currency'
import { csvRowsToObjects, parseCsv } from './adminCsv'
import { slugify } from './slugify'
import { getProductSlug } from './productIdentity'
import { normalizeSizes } from './sizes'
import { getProductStockTotal, normalizeVariants, type ProductVariantStock } from './variantStock'

export const PRODUCT_CSV_HEADERS = [
  'name',
  'slug',
  'price',
  'comparePrice',
  'brand',
  'category',
  'stock',
  'sizes',
  'colors',
  'description',
  'featured',
  'newArrival',
  'hero',
  'featuredImage',
  'images',
  'variants',
] as const

export const PRODUCT_CSV_MAX_ROWS = 200

export interface ProductCsvRecord {
  name: string
  slug: string
  price: string
  comparePrice?: string
  brand?: string
  category: string
  stock: number
  sizes: string[]
  colors: string[]
  description: string
  featured: boolean
  newArrival: boolean
  hero: boolean
  featuredImage?: string
  images: string[]
  variants: ProductVariantStock[]
}

export interface ProductCsvIssue {
  line: number
  message: string
}

export interface ProductCsvParseResult {
  records: ProductCsvRecord[]
  errors: ProductCsvIssue[]
}

function parseBoolean(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return false
  }
  if (['true', '1', 'yes', 'y'].includes(normalized)) {
    return true
  }
  if (['false', '0', 'no', 'n'].includes(normalized)) {
    return false
  }
  return null
}

function parseList(value: string, separators = /[|;,]/) {
  return value
    .split(separators)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function isHttpUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function parseVariants(value: string, sizes: string[], colors: string[]): ProductVariantStock[] | string {
  if (!value.trim()) {
    return []
  }

  const variants: ProductVariantStock[] = []
  for (const chunk of value.split(/[;|]/)) {
    const parts = chunk.split(':').map((part) => part.trim())
    if (parts.length !== 3) {
      return `Invalid variant "${chunk}". Use size:color:stock.`
    }

    const [size, color, stockRaw] = parts
    const stock = Number(stockRaw)
    if (!size || !color) {
      return `Invalid variant "${chunk}". Size and color are required.`
    }
    if (!Number.isInteger(stock) || stock < 0) {
      return `Invalid stock in variant "${chunk}".`
    }
    if (sizes.length && !sizes.includes(size)) {
      return `Variant size "${size}" is not in the sizes list.`
    }
    if (colors.length && !colors.includes(color)) {
      return `Variant color "${color}" is not in the colors list.`
    }

    variants.push({ size, color, stock })
  }

  return normalizeVariants(variants)
}

export function serializeProductVariants(variants: ProductVariantStock[] | undefined) {
  return normalizeVariants(variants)
    .map((entry) => `${entry.size}:${entry.color}:${entry.stock}`)
    .join('; ')
}

export function productsToCsvRows(products: AdminProduct[]) {
  return products.map((product) => [
    product.name,
    getProductSlug(product),
    product.price,
    product.comparePrice ?? '',
    product.brand ?? '',
    product.category,
    product.stock,
    (product.sizes ?? []).join(', '),
    (product.colors ?? []).join(', '),
    product.description,
    product.featured ? 'true' : 'false',
    product.newArrival ? 'true' : 'false',
    product.hero ? 'true' : 'false',
    product.featuredImage ?? product.images[0] ?? '',
    product.images.join(' | '),
    serializeProductVariants(product.variants),
  ] as Array<string | number>)
}

export function parseProductCsv(text: string): ProductCsvParseResult {
  const rows = parseCsv(text)
  if (!rows.length) {
    return { records: [], errors: [{ line: 1, message: 'CSV is empty.' }] }
  }

  const header = (rows[0] ?? []).map((cell) => cell.trim().toLowerCase())
  const required = ['name', 'price', 'category']
  const missing = required.filter((column) => !header.includes(column))
  if (missing.length) {
    return { records: [], errors: [{ line: 1, message: `Missing required columns: ${missing.join(', ')}.` }] }
  }

  const objects = csvRowsToObjects(rows)
  if (objects.length > PRODUCT_CSV_MAX_ROWS) {
    return {
      records: [],
      errors: [{ line: 1, message: `Import is limited to ${PRODUCT_CSV_MAX_ROWS} products per file.` }],
    }
  }

  const errors: ProductCsvIssue[] = []
  const records: ProductCsvRecord[] = []
  const seenSlugs = new Set<string>()

  for (const row of objects) {
    const name = (row.record.name ?? '').trim()
    const priceValue = parseBDT(row.record.price ?? '')
    const category = slugify(row.record.category ?? '')
    const description = (row.record.description ?? '').trim()
    const slug = slugify(row.record.slug || name)
    const featured = parseBoolean(row.record.featured ?? '')
    const newArrival = parseBoolean(row.record.newarrival ?? '')
    const hero = parseBoolean(row.record.hero ?? '')
    const sizes = normalizeSizes(parseList(row.record.sizes ?? ''))
    const colors = parseList(row.record.colors ?? '').map((entry) => entry.trim()).filter(Boolean)
    const images = parseList(row.record.images ?? '', /[|;]/)
    const featuredImage = (row.record.featuredimage ?? '').trim() || images[0] || ''
    const stockRaw = (row.record.stock ?? '').trim()
    const parsedStock = stockRaw === '' ? 0 : Number(stockRaw)
    const variantsOrError = parseVariants(row.record.variants ?? '', sizes, colors)

    if (name.length < 2 || name.length > 120) {
      errors.push({ line: row.line, message: 'Name must be 2–120 characters.' })
      continue
    }
    if (!Number.isFinite(priceValue) || priceValue < 0) {
      errors.push({ line: row.line, message: 'Price must be a valid BDT amount.' })
      continue
    }
    if (!category) {
      errors.push({ line: row.line, message: 'Category is required.' })
      continue
    }
    if (!slug) {
      errors.push({ line: row.line, message: 'Could not build a valid slug.' })
      continue
    }
    if (seenSlugs.has(slug)) {
      errors.push({ line: row.line, message: `Duplicate slug "${slug}" in this file.` })
      continue
    }
    if (featured === null || newArrival === null || hero === null) {
      errors.push({ line: row.line, message: 'featured, newArrival, and hero must be true/false.' })
      continue
    }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      errors.push({ line: row.line, message: 'Stock must be a whole number of 0 or more.' })
      continue
    }
    if (typeof variantsOrError === 'string') {
      errors.push({ line: row.line, message: variantsOrError })
      continue
    }
    if (description.length > 4000) {
      errors.push({ line: row.line, message: 'Description is too long.' })
      continue
    }

    const invalidImage = [featuredImage, ...images].filter(Boolean).find((url) => !isHttpUrl(url) && !url.startsWith('/'))
    if (invalidImage) {
      errors.push({ line: row.line, message: `Image URL is invalid: ${invalidImage}` })
      continue
    }

    seenSlugs.add(slug)
    const variants = variantsOrError
    const stock = getProductStockTotal({ stock: parsedStock, variants })
    const nextImages = featuredImage && !images.includes(featuredImage) ? [featuredImage, ...images] : images

    records.push({
      name,
      slug,
      price: formatBDT(priceValue),
      comparePrice: (row.record.compareprice ?? '').trim() ? formatBDT(parseBDT(row.record.compareprice)) : undefined,
      brand: (row.record.brand ?? '').trim() || undefined,
      category,
      stock,
      sizes,
      colors,
      description: description || name,
      featured,
      newArrival,
      hero,
      featuredImage: featuredImage || undefined,
      images: nextImages,
      variants,
    })
  }

  return { records, errors }
}

export function planProductCsvImport(records: ProductCsvRecord[], existing: AdminProduct[]) {
  const bySlug = new Map(existing.map((product) => [getProductSlug(product), product]))
  return records.map((record) => {
    const current = bySlug.get(record.slug)
    return {
      action: current ? 'update' as const : 'create' as const,
      id: current?.id,
      record,
    }
  })
}
