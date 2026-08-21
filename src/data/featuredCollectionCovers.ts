export const featuredCollectionCovers: Record<string, string> = {
  winter: '/collections/featured-winter-collection.jpg',
  summer: '/collections/featured-summer-collection.jpg',
  'everyday-wear': '/collections/featured-everyday-wear.jpg',
}

export const categoryStripCovers: Record<string, string> = {
  saree: '/collections/featured-saree-collection.jpg',
}

export function featuredCollectionCover(slug: string, fallback = '') {
  return featuredCollectionCovers[slug] ?? fallback
}

export function categoryStripCover(key: string, fallback = '') {
  return categoryStripCovers[key] ?? fallback
}
