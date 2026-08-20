export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function getProductSlug(product: { slug?: unknown; name?: unknown }) {
  const stored = slugify(String(product.slug ?? ''))
  if (stored) {
    return stored
  }

  return slugify(String(product.name ?? ''))
}

export function productMatchesSlug(
  product: { slug?: unknown; name?: unknown },
  candidate: string,
) {
  const itemSlug = slugify(candidate)
  if (!itemSlug) {
    return false
  }

  return getProductSlug(product) === itemSlug || slugify(String(product.name ?? '')) === itemSlug
}

export interface CatalogVariant {
  size: string
  color: string
  stock: number
}

function toStock(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return Math.floor(parsed)
}

export function normalizeVariants(value: unknown): CatalogVariant[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null
      }

      const record = entry as { size?: unknown; color?: unknown; stock?: unknown }
      const size = String(record.size ?? '').trim()
      const color = String(record.color ?? '').trim()
      if (!size || !color) {
        return null
      }

      return { size, color, stock: toStock(record.stock) }
    })
    .filter((entry): entry is CatalogVariant => Boolean(entry))
}

export function findVariantIndex(variants: CatalogVariant[], size: string, color: string) {
  const normalizedSize = size.trim()
  const normalizedColor = color.trim() || 'Default'
  return variants.findIndex((entry) => entry.size === normalizedSize && entry.color === normalizedColor)
}

export function getAvailableStock(
  product: { stock?: unknown; variants?: unknown },
  size: string,
  color: string,
) {
  const variants = normalizeVariants(product.variants)
  if (!variants.length) {
    return { stock: toStock(product.stock), variants, variantIndex: -1 }
  }

  const variantIndex = findVariantIndex(variants, size, color)
  if (variantIndex < 0) {
    return { stock: 0, variants, variantIndex: -1 }
  }

  return { stock: variants[variantIndex].stock, variants, variantIndex }
}
