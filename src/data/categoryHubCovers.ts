import { categoryStripCovers } from './featuredCollectionCovers'

const WOMEN_COVERS: Record<string, string> = {
  kurti: '/images/products/kurtis/Nairah Porcelain Blue - M.jpg',
  dresses: '/images/products/kurtis/Beautiful dress.jpg',
  'womens-baggy': categoryStripCovers['womens-baggy'],
  'oversized-tee': categoryStripCovers['oversized-tee'],
  saree: categoryStripCovers.saree,
}

const MENS_SHIRTS_HUB_COVER = '/collections/full=shirts/72d32a26-0458-48bc-a2ea-a3f81f6eeb24.png'

const MEN_COVERS: Record<string, string> = {
  shirts: MENS_SHIRTS_HUB_COVER,
  'half-shirts': categoryStripCovers['half-shirts'],
  polos: '/collections/polo-hero-images/polo-collection-herimage.png',
  panjabi: '/collections/panjabi-collection-mainimage/panjabi-main-image.jpg',
  'oversized-tee': categoryStripCovers['oversized-tee'],
  denim: '/collections/mens-baggy/mens-baggy1.jpg',
  pants: '/collections/featured-denim-collection.jpg',
}

const KIDS_COVERS: Record<string, string> = {
  'kids-oversized-tee': '/hero/kids/kids-hero2.jpg',
  'kids-boys': '/images/products/kids/Kid-Hero-01.png',
  'kids-girls': '/images/products/kids/Kid-Hero-08.png',
  'kids-unisex': '/hero/kid-homepage.jpg',
  kids: '/hero/kid-homepage.jpg',
}

export const SEGMENT_HUB_COVERS: Record<string, string> = {
  men: categoryStripCovers.men,
  women: categoryStripCovers.saree,
  kids: '/hero/kid-homepage.jpg',
}

export function getSubcategoryCover(segment: string, slug: string, fallback = '') {
  const normalizedSegment = segment.trim().toLowerCase()
  const normalizedSlug = slug.trim().toLowerCase()
  const source =
    normalizedSegment === 'women'
      ? WOMEN_COVERS
      : normalizedSegment === 'men'
        ? MEN_COVERS
        : KIDS_COVERS

  return source[normalizedSlug] || fallback || SEGMENT_HUB_COVERS[normalizedSegment] || '/og-image.svg'
}
