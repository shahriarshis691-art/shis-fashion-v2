export type ShopSegment = 'all' | 'women' | 'men' | 'kids'

export interface SubcategoryConfig {
  slug: string
  label: string
  aliases: string[]
  path?: string
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
  { slug: 'shirts', label: 'Shirts', aliases: ['shirts', 'mens-shirt', 'casual-shirt', 'casual-shirts'] },
  {
    slug: 'half-shirts',
    label: 'Half Shirts',
    aliases: ['half-shirt', 'half-shirts', 'half shirt', 'mens-half-shirt', 'mens-half-shirts'],
    path: '/men/half-shirts',
  },
  { slug: 'polos', label: 'Polos', aliases: ['polos'] },
  { slug: 'panjabi', label: 'Panjabi', aliases: ['panjabi'] },
  { slug: 'oversized-tee', label: 'Oversized Tee', aliases: ['oversized-tee', 'unisex-tee', 'unisex-oversized-t-shirts'], path: '/collections/oversized-tee' },
  { slug: 't-shirts', label: 'T-Shirts', aliases: ['t-shirts', 'unisex-tee'] },
  { slug: 'denim', label: 'Denim', aliases: ['denim', 'denim-pants', 'denim-pant'] },
  { slug: 'pants', label: 'Pants', aliases: ['pants'] },
  { slug: 'jackets', label: 'Jackets', aliases: ['jackets'] },
  { slug: 'accessories', label: 'Accessories', aliases: ['accessories', 'gift', 'couples'] },
]

const WOMEN_SUBCATEGORIES: SubcategoryConfig[] = [
  { slug: 'kurti', label: 'Kurti', aliases: ['kurti'] },
  { slug: 'tops', label: 'Tops', aliases: ['tops'] },
  { slug: 'dresses', label: 'Dresses', aliases: ['dresses', 'women-dresses', 'womens-dresses', 'women-shirt', 'women-shirts', 'womens-shirt', 'womens-shirts', 'western-outfits', 'tunic'] },
  { slug: 'oversized-tee', label: 'Oversized Tee', aliases: ['oversized-tee', 'oversize-tee'], path: '/collections/oversized-tee' },
  { slug: 'denim', label: 'Denim', aliases: ['denim'] },
  { slug: 'saree', label: 'Saree', aliases: ['saree', 'sarees', 'sari', 'saris', 'womens-saree', 'women-saree', 'womens-sarees'], path: '/sarees' },
  { slug: 'tunic', label: 'Tunic', aliases: ['western'] },
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

const RESERVED_SHOP_SLUGS = new Set(['new-arrivals', 'best-sellers', 'saree', 'sarees'])

export function isKnownListingSlug(slug: string) {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return false
  }

  if (RESERVED_SHOP_SLUGS.has(normalized) || normalized === 'women' || normalized === 'womens' || normalized === 'men' || normalized === 'mens' || normalized === 'kids' || normalized === 'kid') {
    return true
  }

  return Boolean(getTaxonomyLabelForSlug(normalized))
}

export function getTaxonomyLabelForSlug(slug: string) {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return ''
  }

  for (const segment of SEGMENTS) {
    if (segment.key === normalized) {
      return segment.label
    }

    for (const subcategory of segment.subcategories) {
      if (subcategory.slug === normalized || subcategory.aliases.some((alias) => alias.toLowerCase() === normalized)) {
        return subcategory.label
      }
    }
  }

  return ''
}

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
    href: subcategory.path ?? `${config.path}?sub=${subcategory.slug}`,
  }))
}

export function getDedicatedListingFromPath(pathname: string) {
  const normalized = pathname.replace(/\/$/, '') || '/'
  if (normalized === '/sarees' || normalized === '/saree') {
    return {
      segment: 'women' as const,
      subcategory: 'saree',
      eyebrow: "Women's Saree Collection",
      title: 'Sarees',
      description: 'Refined weaves and fluid drapes for celebrations, evenings, and considered everyday elegance.',
    }
  }

  if (
    normalized === '/men/half-shirts' ||
    normalized === '/collections/half-shirt' ||
    normalized === '/collections/half-shirts'
  ) {
    return {
      segment: 'men' as const,
      subcategory: 'half-shirts',
      eyebrow: "Men's Half Shirt Collection",
      title: "MEN'S HALF SHIRTS",
      description: 'Refined half-shirt edits focused on comfort, fit, and repeat wear.',
    }
  }

  return null
}

export function getDedicatedListingPath(segment: ShopSegment, subcategory: string) {
  if (segment === 'women' && subcategory === 'saree') {
    return '/sarees'
  }

  if (segment === 'men' && (subcategory === 'half-shirts' || subcategory === 'half-shirt')) {
    return '/men/half-shirts'
  }

  if (subcategory === 'oversized-tee' || subcategory === 'oversize-tee') {
    return '/collections/oversized-tee'
  }

  return null
}

function normalizeCategoryValue(category: string) {
  return category.trim().toLowerCase()
}

const SEGMENT_KEYWORDS: Record<Exclude<ShopSegment, 'all'>, RegExp> = {
  women: /(women|woman|womens|lady|ladies|female|girl|kurti|saree|tunic|dress|blouse)/,
  men: /(men|man|mens|male|shirt|polo|panjabi|tee|t-?shirt|denim|pant|jacket)/,
  kids: /(kids?|children|child|baby|babies|toddler|junior|mini)/,
}

function matchesSegmentKeyword(segment: Exclude<ShopSegment, 'all'>, value: string) {
  return SEGMENT_KEYWORDS[segment].test(value)
}

function getSegmentConfig(segment: Exclude<ShopSegment, 'all'>) {
  return SEGMENTS.find((entry) => entry.key === segment)
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

  options.push({
    segment: 'men',
    slug: 'unisex-oversized-t-shirts',
    label: 'Unisex Oversized T-Shirts',
  })

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
  const canonical = resolveCanonicalSubcategorySlug(normalized)
  const config = getSegmentConfig(segment)
  if (!config) {
    return false
  }

  if (normalized === segment || canonical === segment) {
    return true
  }

  if (matchesSegmentKeyword(segment, normalized) || matchesSegmentKeyword(segment, canonical)) {
    return true
  }

  return config.subcategories.some((subcategory) =>
    subcategory.slug === normalized ||
    subcategory.slug === canonical ||
    subcategory.aliases.some((alias) => {
      const normalizedAlias = alias.toLowerCase()
      return normalizedAlias === normalized || normalizedAlias === canonical
    }),
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

  const canonicalCategory = resolveCanonicalSubcategorySlug(normalizedCategory)

  return matchedSubcategory.slug === normalizedCategory ||
    matchedSubcategory.slug === canonicalCategory ||
    matchedSubcategory.aliases.some((alias) => {
      const normalizedAlias = alias.toLowerCase()
      return normalizedAlias === normalizedCategory || normalizedAlias === canonicalCategory
    })
}
