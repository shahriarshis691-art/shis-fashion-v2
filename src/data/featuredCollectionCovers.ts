export const featuredCollectionCovers: Record<string, string> = {
  winter: '/collections/featured-winter-collection.jpg',
  summer: '/collections/featured-summer-collection.jpg',
  'everyday-wear': '/collections/featured-everyday-wear.jpg',
}

export const categoryStripCovers: Record<string, string> = {
  saree: '/collections/category-saree-blue.jpg',
  denim: '/collections/featured-denim-collection.jpg',
}

export function featuredCollectionCover(slug: string, fallback = '') {
  return featuredCollectionCovers[slug] ?? fallback
}

export function categoryStripCover(key: string, fallback = '') {
  if (key === 'denim') {
    return categoryStripCovers.denim
  }

  const bundled = categoryStripCovers[key] ?? ''
  const saved = fallback.trim()

  if (saved) {
    const normalized = saved.toLowerCase()
    const isOutdatedPlaceholder = normalized.includes('og-image.svg')
      || normalized.includes('/og-image.png')
      || normalized.includes('images.unsplash.com')
      || normalized.includes('plus.unsplash.com')

    if (!isOutdatedPlaceholder) {
      return saved
    }
  }

  return bundled || saved
}
