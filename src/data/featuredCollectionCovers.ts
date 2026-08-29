export const featuredCollectionCovers: Record<string, string> = {
  winter: '/collections/featured-winter-collection.jpg',
  summer: '/collections/featured-summer-collection.jpg',
  'everyday-wear': '/collections/featured-everyday-wear.jpg',
}

export const SAREE_HOMEPAGE_COVER = '/homepage/category.png'
export const WOMEN_HOMEPAGE_COVER = '/collections/women-category-main/women.category.png'

export const categoryStripCovers: Record<string, string> = {
  men: '/collections/men-category.jpg',
  saree: '/collections/saree-category-new.jpg',
  denim: '/collections/featured-denim-collection.jpg',
  western: '/collections/featured-denim-collection.jpg',
  'womens-baggy': '/hero/womens-baggy/1119918632363621348.jpg',
  'half-shirts': '/hero/half-shirt-1.jpg',
  'oversized-tee': '/hero/oversized-tee.jpg',
}

export function featuredCollectionCover(slug: string, fallback = '') {
  return featuredCollectionCovers[slug] ?? fallback
}

export function categoryStripCover(key: string, fallback = '') {
  const bundled = (
    (key === 'saree' ? SAREE_HOMEPAGE_COVER : categoryStripCovers[key])
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
      || normalized.includes('men-category.webp')
      || normalized.includes('category-saree-blue.jpg')
      || normalized.includes('womens-jeans-listing')

    if (!isOutdatedPlaceholder) {
      return saved
    }
  }

  return bundled || saved
}
