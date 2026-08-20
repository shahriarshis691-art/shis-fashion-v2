import { slugify } from './slugify'

export function getProductSlug(product: { slug?: string; name?: string }) {
  const stored = slugify(String(product.slug ?? ''))
  if (stored) {
    return stored
  }

  return slugify(String(product.name ?? ''))
}

export function allocateProductSlug(name: string, taken: Iterable<string>, preferred?: string) {
  const takenSet = new Set(
    Array.from(taken, (entry) => slugify(entry)).filter(Boolean),
  )
  const base = slugify(preferred || name) || 'product'

  if (!takenSet.has(base)) {
    return base
  }

  let suffix = 2
  while (takenSet.has(`${base}-${suffix}`)) {
    suffix += 1
  }

  return `${base}-${suffix}`
}

export function productMatchesSlug(
  product: { slug?: string; name?: string },
  candidate: string,
) {
  const itemSlug = slugify(candidate)
  if (!itemSlug) {
    return false
  }

  return getProductSlug(product) === itemSlug || slugify(String(product.name ?? '')) === itemSlug
}
