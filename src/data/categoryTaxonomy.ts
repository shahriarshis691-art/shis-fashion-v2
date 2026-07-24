export type ShopSegment = 'all' | 'women' | 'men' | 'kids'

export interface SubcategoryConfig {
  slug: string
  label: string
  aliases: string[]
}

export interface TaxonomyCategoryOption {
  segment: Exclude<ShopSegment, 'all'>
  slug: string
  label: string
}

interface SegmentConfig {
  key: Exclude<ShopSegment, 'all'>
  label: string
  path: string
  description: string
  subcategories: SubcategoryConfig[]
}

const MEN_SUBCATEGORIES: SubcategoryConfig[] = [
  { slug: 'shirts', label: 'Shirts', aliases: ['shirts', 'mens-shirt'] },
  { slug: 'polos', label: 'Polos', aliases: ['polos'] },
  { slug: 'panjabi', label: 'Panjabi', aliases: ['panjabi'] },
  { slug: 'oversized-tee', label: 'Oversized Tee', aliases: ['oversized-tee', 'unisex-tee'] },
  { slug: 't-shirts', label: 'T-Shirts', aliases: ['t-shirts', 'unisex-tee'] },
  { slug: 'denim', label: 'Denim', aliases: ['denim'] },
  { slug: 'pants', label: 'Pants', aliases: ['pants'] },
  { slug: 'jackets', label: 'Jackets', aliases: ['jackets'] },
  { slug: 'accessories', label: 'Accessories', aliases: ['accessories', 'gift', 'couples'] },
]

const WOMEN_SUBCATEGORIES: SubcategoryConfig[] = [
  { slug: 'kurti', label: 'Kurti', aliases: ['kurti'] },
  { slug: 'tops', label: 'Tops', aliases: ['tops', 'womens-dresses'] },
  { slug: 'shirts', label: 'Shirts', aliases: ['shirts', 'womens-shirt'] },
  { slug: 'denim', label: 'Denim', aliases: ['denim'] },
  { slug: 'saree', label: 'Saree', aliases: ['saree'] },
  { slug: 'tunic', label: 'Tunic', aliases: ['tunic', 'western', 'western-outfits'] },
  { slug: 'accessories', label: 'Accessories', aliases: ['accessories', 'gift'] },
]

const KIDS_SUBCATEGORIES: SubcategoryConfig[] = [
  { slug: 'kids', label: 'Kids', aliases: ['kids', 'kid', 'kidswear', 'kids-wear', 'children', 'child', 'baby', 'babies', 'toddler', 'mini'] },
]

const SEGMENTS: SegmentConfig[] = [
  {
    key: 'women',
    label: 'Women',
    path: '/women',
    description: 'Editorial silhouettes and daily essentials tailored for modern women.',
    subcategories: WOMEN_SUBCATEGORIES,
  },
  {
    key: 'men',
    label: 'Men',
    path: '/men',
    description: "Refined men's edits focused on comfort, fit, and repeat wear.",
    subcategories: MEN_SUBCATEGORIES,
  },
  {
    key: 'kids',
    label: 'Kids',
    path: '/kids',
    description: 'Soft, practical, and polished pieces for active little wardrobes.',
    subcategories: KIDS_SUBCATEGORIES,
  },
]

export const SEGMENT_TABS: Array<{ key: ShopSegment; label: string; path: string }> = [
  ...SEGMENTS.map((segment) => ({ key: segment.key, label: segment.label, path: segment.path })),
  { key: 'all', label: 'All', path: '/shop' },
]

export function getSegmentDescription(segment: ShopSegment) {
  if (segment === 'all') {
    return {
      title: 'Shop All',
      description: 'Explore all available products across women, men, and kids.',
    }
  }

  const matched = SEGMENTS.find((entry) => entry.key === segment)
  if (!matched) {
    return {
      title: 'Shop All',
      description: 'Explore all available products across women, men, and kids.',
    }
  }

  return {
    title: matched.label,
    description: matched.description,
  }
}

export function getSubcategoriesForSegment(segment: ShopSegment) {
  if (segment === 'all') {
    return [] as SubcategoryConfig[]
  }

  return SEGMENTS.find((entry) => entry.key === segment)?.subcategories ?? []
}

export function getSubcategoryLinksForSegment(segment: Exclude<ShopSegment, 'all'>) {
  const config = SEGMENTS.find((entry) => entry.key === segment)
  if (!config) {
    return [] as Array<{ label: string; href: string }>
  }

  return config.subcategories.map((subcategory) => ({
    label: subcategory.label,
    href: `${config.path}?sub=${subcategory.slug}`,
  }))
}

function normalizeCategoryValue(category: string) {
  return category.trim().toLowerCase()
}

export function getAllTaxonomyCategoryOptions() {
  const options: TaxonomyCategoryOption[] = []

  for (const segment of SEGMENTS) {
    for (const subcategory of segment.subcategories) {
      options.push({
        segment: segment.key,
        slug: subcategory.slug,
        label: `${segment.label} - ${subcategory.label}`,
      })
    }
  }

  return options
}

export function resolveCanonicalSubcategorySlug(category: string) {
  const normalized = normalizeCategoryValue(category)
  if (!normalized) {
    return ''
  }

  for (const segment of SEGMENTS) {
    for (const subcategory of segment.subcategories) {
      if (subcategory.slug === normalized) {
        return subcategory.slug
      }

      if (subcategory.aliases.some((alias) => alias.toLowerCase() === normalized)) {
        return subcategory.slug
      }
    }
  }

  return normalized
}

export function matchesSegmentByAlias(segment: ShopSegment, category: string) {
  if (segment === 'all') {
    return true
  }

  const normalized = normalizeCategoryValue(category)
  const config = SEGMENTS.find((entry) => entry.key === segment)
  if (!config) {
    return false
  }

  return config.subcategories.some((subcategory) =>
    subcategory.aliases.some((alias) => alias.toLowerCase() === normalized),
  )
}

export function matchesSubcategoryByAlias(
  segment: ShopSegment,
  subcategorySlug: string,
  category: string,
) {
  const normalizedCategory = normalizeCategoryValue(category)
  const normalizedSubcategory = subcategorySlug.trim().toLowerCase()

  if (!normalizedSubcategory || normalizedSubcategory === 'all') {
    return true
  }

  const source = segment === 'all'
    ? SEGMENTS.flatMap((entry) => entry.subcategories)
    : getSubcategoriesForSegment(segment)

  const matchedSubcategory = source.find((entry) => entry.slug === normalizedSubcategory)
  if (!matchedSubcategory) {
    return false
  }

  return matchedSubcategory.aliases.some((alias) => alias.toLowerCase() === normalizedCategory)
}
