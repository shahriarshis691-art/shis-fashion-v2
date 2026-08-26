export const featuredCollectionCovers: Record<string, string> = {
  winter: '/collections/featured-winter-collection.jpg',
  summer: '/collections/featured-summer-collection.jpg',
  'everyday-wear': '/collections/featured-everyday-wear.jpg',
}

export const categoryStripCovers: Record<string, string> = {
  men: '/collections/men-category.webp',
  saree: '/collections/saree-category-new.jpg',
  denim: '/collections/featured-denim-collection.jpg',
  'half-shirts': '/hero/half-shirt-1.jpg',
  'oversized-tee': '/hero/oversized-tee.jpg',
}

export function featuredCollectionCover(slug: string, fallback = '') {
  return featuredCollectionCovers[slug] ?? fallback
}

export function categoryStripCover(key: string, fallback = '') {
  const bundled = (
    categoryStripCovers[key]
    ?? (key === 'sale' ? categoryStripCovers['half-shirts'] : '')
    ?? (key === 'new-arrivals' ? categoryStripCovers['oversized-tee'] : '')
  ) || (key === 'women' ? categoryStripCovers.saree : '')
  const saved = fallback.trim()

  if (saved) {
    const normalized = saved.toLowerCase()
    const isOutdatedPlaceholder = normalized.includes('og-image.svg')
      || normalized.includes('/og-image.png')
      || normalized.includes('images.unsplash.com')
      || normalized.includes('plus.unsplash.com')
      || normalized.includes('featured-men-collection.jpg')
      || normalized.includes('category-saree-blue.jpg')
      || normalized.includes('timeless-oversize-hero')

    if (!isOutdatedPlaceholder) {
      return saved
    }
  }

  return bundled || saved
}
