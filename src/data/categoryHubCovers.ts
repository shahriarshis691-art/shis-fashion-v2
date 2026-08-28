import { categoryStripCovers } from './featuredCollectionCovers'

const WOMEN_COVERS: Record<string, string> = {
  kurti: '/images/products/kurtis/Nairah Porcelain Blue - M.jpg',
  dresses: '/images/products/kurtis/Beautiful dress.jpg',
  'womens-baggy': '/hero/womens-baggy/1119918632363621348.jpg',
  'oversized-tee': categoryStripCovers['oversized-tee'],
  saree: categoryStripCovers.saree,
  tunic: '/images/products/kurtis/Jade green digital printed lawn Kurti  with white  embroidered bell sleeves.jpg',
}

const MEN_COVERS: Record<string, string> = {
  shirts: categoryStripCovers.men,
  'half-shirts': categoryStripCovers['half-shirts'],
  polos: categoryStripCovers.men,
  panjabi: categoryStripCovers.men,
  'oversized-tee': categoryStripCovers['oversized-tee'],
  denim: '/collections/mens-baggy/mens-baggy1.jpg',
  pants: '/collections/mens-baggy/mens-baggy3.jpg',
  jackets: categoryStripCovers.men,
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
