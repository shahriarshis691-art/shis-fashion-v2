export interface ProductVariantStock {
  size: string
  color: string
  stock: number
}

function normalizeLabel(value: unknown) {
  return String(value ?? '').trim()
}

function toStock(value: unknown) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0
  }

  return Math.floor(parsed)
}

export function normalizeVariants(value: unknown): ProductVariantStock[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null
      }

      const record = entry as { size?: unknown; color?: unknown; stock?: unknown }
      const size = normalizeLabel(record.size)
      const color = normalizeLabel(record.color)
      if (!size || !color) {
        return null
      }

      return { size, color, stock: toStock(record.stock) }
    })
    .filter((entry): entry is ProductVariantStock => Boolean(entry))
}

export function rebuildVariantMatrix(
  sizes: string[],
  colors: string[],
  existing?: ProductVariantStock[],
): ProductVariantStock[] {
  const previous = new Map(
    normalizeVariants(existing).map((entry) => [`${entry.size}::${entry.color}`, entry.stock]),
  )

  return sizes
    .map((size) => size.trim())
    .filter(Boolean)
    .flatMap((size) =>
      colors
        .map((color) => color.trim())
        .filter(Boolean)
        .map((color) => ({
          size,
          color,
          stock: previous.get(`${size}::${color}`) ?? 0,
        })),
    )
}

export function getProductStockTotal(product: { stock?: number; variants?: ProductVariantStock[] }) {
  const variants = normalizeVariants(product.variants)
  if (variants.length) {
    return variants.reduce((sum, entry) => sum + entry.stock, 0)
  }

  return toStock(product.stock)
}

export function findVariant(
  variants: ProductVariantStock[] | undefined,
  size: string,
  color: string,
) {
  const normalizedSize = normalizeLabel(size)
  const normalizedColor = normalizeLabel(color) || 'Default'
  const list = normalizeVariants(variants)

  return list.find((entry) => {
    if (entry.size !== normalizedSize) {
      return false
    }

    return entry.color === normalizedColor || (!normalizedColor && entry.color === 'Default')
  }) ?? null
}

export function getVariantStock(
  product: { stock?: number; variants?: ProductVariantStock[] },
  size: string,
  color: string,
) {
  const variants = normalizeVariants(product.variants)
  if (!variants.length) {
    return toStock(product.stock)
  }

  const match = findVariant(variants, size, color)
  return match ? match.stock : 0
}

export function variantsForSave(
  sizes: string[],
  colors: string[],
  variants: ProductVariantStock[] | undefined,
  fallbackStock: number,
) {
  if (!sizes.length || !colors.length) {
    return { stock: toStock(fallbackStock), variants: [] as ProductVariantStock[] }
  }

  const matrix = rebuildVariantMatrix(sizes, colors, variants)
  const total = matrix.reduce((sum, entry) => sum + entry.stock, 0)
  if (total <= 0) {
    return { stock: toStock(fallbackStock), variants: [] as ProductVariantStock[] }
  }

  return { stock: total, variants: matrix }
}

export function decrementMatchingVariant(
  variants: ProductVariantStock[],
  size: string,
  color: string,
  quantity: number,
) {
  const qty = toStock(quantity)
  let matched = false
  const next = variants.map((entry) => {
    if (matched || entry.size !== normalizeLabel(size)) {
      return entry
    }

    const colorLabel = normalizeLabel(color) || 'Default'
    if (entry.color !== colorLabel) {
      return entry
    }

    if (entry.stock < qty) {
      return entry
    }

    matched = true
    return { ...entry, stock: entry.stock - qty }
  })

  if (!matched) {
    return null
  }

  return next
}
