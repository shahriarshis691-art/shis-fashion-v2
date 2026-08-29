export type ShopSegment = 'all' | 'women' | 'men' | 'kids'

export type MensBottomSubCategory = 'pants' | 'denim' | 'baggy' | 'trousers'

export const MENS_BOTTOM_SUBCATEGORIES: readonly MensBottomSubCategory[] = [
  'pants',
  'denim',
  'baggy',
  'trousers',
]

export function isMensBottomSubCategory(value: string): value is MensBottomSubCategory {
  const normalized = value.trim().toLowerCase()
  return (MENS_BOTTOM_SUBCATEGORIES as readonly string[]).includes(normalized)
}

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
  { slug: 'polos', label: 'Polos', aliases: ['polos', 'polo', 'polo-shirt', 'polo-shirts', 'polo-t-shirts'], path: '/men/polos' },
  { slug: 'panjabi', label: 'Panjabi', aliases: ['panjabi', 'punjabi'], path: '/men/panjabi' },
  { slug: 'oversized-tee', label: 'Oversized Tee', aliases: ['oversized-tee', 'oversize-tee', 'unisex-tee', 'unisex-oversized-t-shirts'], path: '/collections/oversized-tee' },
  {
    slug: 'pants',
    label: 'Pants',
    aliases: [
      'pants',
      'denim',
      'denim-pants',
      'denim-pant',
      'baggy',
      'baggy-jeans',
      'mens-baggy',
      'mens-denim',
      "men's denim",
      'trousers',
      'trouser',
      'cargo',
      'cargos',
      'chinos',
      'chino',
      'casual-pants',
      'casual-pant',
    ],
    path: '/men/pants',
  },
]

const WOMEN_SUBCATEGORIES: SubcategoryConfig[] = [
  { slug: 'kurti', label: 'Kurti', aliases: ['kurti', 'kurtis', 'salwar', 'salwar-kameez', 'salwar kameez', 'three-piece', 'three piece', '3-piece'] },
  { slug: 'dresses', label: 'Dresses', aliases: ['dresses', 'women-dresses', 'womens-dresses', 'women-shirt', 'women-shirts', 'womens-shirt', 'womens-shirts'] },
  {
    slug: 'womens-baggy',
    label: "Women's Baggy",
    aliases: [
      'womens-baggy',
      'women-baggy',
      "women's-baggy",
      'womens-baggy-jeans',
      'women-baggy-jeans',
      'ladies-baggy',
    ],
    path: '/women/womens-baggy',
  },
  { slug: 'oversized-tee', label: 'Oversized Tee', aliases: ['oversized-tee', 'oversize-tee'], path: '/collections/oversized-tee' },
  { slug: 'saree', label: 'Saree', aliases: ['saree', 'sarees', 'sari', 'saris', 'womens-saree', 'women-saree', 'womens-sarees'], path: '/sarees' },
]

const KIDS_SUBCATEGORIES: SubcategoryConfig[] = [
  {
    slug: 'kids-oversized-tee',
    label: 'Oversized Tee',
    aliases: ['kids-tee', 'kids-oversized', 'kids oversized tee', 'kids-oversized-tee'],
    path: '/kids',
  },
  {
    slug: 'kids-boys',
    label: 'Boys',
    aliases: ['kids-boy', 'kids boy'],
    path: '/kids?gender=Kids%20Boy',
  },
  {
    slug: 'kids-girls',
    label: 'Girls',
    aliases: ['kids-girl', 'kids girl'],
    path: '/kids?gender=Kids%20Girl',
  },
  {
    slug: 'kids-unisex',
    label: 'Unisex',
    aliases: ['kids unisex'],
    path: '/kids?gender=Unisex',
  },
]

const WOMEN_HUB_PRIORITY_SLUGS = ['kurti', 'womens-baggy', 'oversized-tee', 'dresses'] as const

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

export function getHubSubcategories(segment: Exclude<ShopSegment, 'all'>) {
  const subcategories = getSubcategoriesForSegment(segment)
  if (segment !== 'women') {
    return subcategories
  }

  const priority = new Set<string>(WOMEN_HUB_PRIORITY_SLUGS)
  const featured = WOMEN_HUB_PRIORITY_SLUGS
    .map((slug) => subcategories.find((item) => item.slug === slug))
    .filter((item): item is SubcategoryConfig => Boolean(item))
  const rest = subcategories.filter((item) => !priority.has(item.slug))
  return [...featured, ...rest]
}

export function getSegmentAllProductsHref(segment: Exclude<ShopSegment, 'all'>) {
  if (segment === 'kids') {
    return '/kids'
  }

  return `/shop?segment=${segment}`
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
    normalized === '/men/pants' ||
    normalized === '/men/denim' ||
    normalized === '/collections/men-pants' ||
    normalized === '/collections/mens-pants'
  ) {
    return {
      segment: 'men' as const,
      subcategory: 'pants',
      eyebrow: "Men's Pants Collection",
      title: "MEN'S PANTS",
      description: 'Denim, baggy, trousers, cargo, and casual pants — premium men’s bottom-wear in one edit.',
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

  if (normalized === '/men/panjabi') {
    return {
      segment: 'men' as const,
      subcategory: 'panjabi',
      eyebrow: "Men's Panjabi Collection",
      title: 'Panjabi',
      description: 'Refined panjabi edits focused on comfort, fit, and occasion-ready wear.',
    }
  }

  if (normalized === '/men/polos' || normalized === '/men/polo') {
    return {
      segment: 'men' as const,
      subcategory: 'polos',
      eyebrow: "Men's Polo Collection",
      title: 'Polos',
      description: 'Premium polo shirts cut for everyday polish, comfort, and repeat wear.',
    }
  }

  if (
    normalized === '/women/womens-baggy' ||
    normalized === '/women/womens-baggy-jeans' ||
    normalized === '/collections/womens-baggy' ||
    normalized === '/collections/womens-baggy-jeans'
  ) {
    return {
      segment: 'women' as const,
      subcategory: 'womens-baggy',
      eyebrow: "Women's Baggy Denim",
      title: "WOMEN'S BAGGY",
      description: 'Loose and wide-leg baggy jeans for women — premium denim with an easy everyday drape.',
    }
  }

  return null
}

export function getDedicatedListingPath(segment: ShopSegment, subcategory: string) {
  if (segment === 'women' && subcategory === 'saree') {
    return '/sarees'
  }

  if (
    segment === 'men' &&
    (subcategory === 'pants' || subcategory === 'denim' || subcategory === 'baggy' || subcategory === 'trousers')
  ) {
    return '/men/pants'
  }

  if (segment === 'men' && (subcategory === 'half-shirts' || subcategory === 'half-shirt')) {
    return '/men/half-shirts'
  }

  if (segment === 'men' && (subcategory === 'panjabi' || subcategory === 'punjabi')) {
    return '/men/panjabi'
  }

  if (segment === 'men' && (subcategory === 'polos' || subcategory === 'polo')) {
    return '/men/polos'
  }

  if (segment === 'women' && (subcategory === 'womens-baggy' || subcategory === 'womens-baggy-jeans')) {
    return '/women/womens-baggy'
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
