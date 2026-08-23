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
  const saved = fallback.trim()
  if (saved) {
    return saved
  }

  return categoryStripCovers[key] ?? ''
}
