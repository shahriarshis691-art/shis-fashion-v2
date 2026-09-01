export const featuredCollectionCovers: Record<string, string> = {
  winter: '/collections/featured-winter-collection.jpg',
  summer: '/collections/featured-summer-collection.jpg',
  'everyday-wear': '/collections/featured-everyday-wear.jpg',
}

export const SAREE_HOMEPAGE_COVER = '/homepage/category.webp'
export const SAREE_HOMEPAGE_COVER_ASPECT = {
  width: 960,
  height: 640,
} as const
export const SAREE_HOMEPAGE_COVER_POSITION = '62% top'
export const SAREE_HOMEPAGE_COVER_BACKGROUND = 'bg-[#e8cbb1]'
export const WOMEN_HOMEPAGE_COVER = '/collections/women-category-main/women.category.webp'
export const MEN_HOMEPAGE_COVER = '/collections/men-2feature-image/men-feature2.webp'
export const MEN_HOMEPAGE_COVER_POSITION = 'center top'
export const KIDS_HOMEPAGE_COVER = '/collections/kid-hero/kid-category.webp'
export const KIDS_HOMEPAGE_COVER_POSITION = 'center top'
export const KIDS_HOMEPAGE_COVER_BACKGROUND = 'bg-[#e6d2be]'
export const WEDDING_HOMEPAGE_COVER = `/homepage/${encodeURIComponent('THE DREAM STORY.jpg')}`
export const WEDDING_HOMEPAGE_COVER_WIDTH = 1200
export const WEDDING_HOMEPAGE_COVER_HEIGHT = 1500
export const WEDDING_HOMEPAGE_COVER_BACKGROUND = '#f4efe8'
export const WOMENS_BAGGY_CATEGORY_COVER = `/collections/womens-baggy/${encodeURIComponent('download (17).jpg')}`

export const categoryStripCovers: Record<string, string> = {
  men: '/collections/men-category.jpg',
  saree: '/collections/saree-category-new.webp',
  denim: '/collections/featured-denim-collection.jpg',
  western: WOMENS_BAGGY_CATEGORY_COVER,
  'womens-baggy': WOMENS_BAGGY_CATEGORY_COVER,
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
