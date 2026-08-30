import { KIDS_HOMEPAGE_COVER, SAREE_HOMEPAGE_COVER, WOMENS_BAGGY_CATEGORY_COVER } from './featuredCollectionCovers'

export interface HomeCategoryItem {
  key: 'mens' | 'womens' | 'kids' | 'western' | 'denim' | 'oversized-tee' | 'saree'
  name: string
  href: string
  image: string
  imagePosition?: string
}

export const homeCategoryItems: HomeCategoryItem[] = [
  {
    key: 'oversized-tee',
    name: 'Unisex Oversized Tee',
    href: '/collections/oversized-tee',
    image: '/hero/oversized-tee.jpg',
    imagePosition: 'center top',
  },
  {
    key: 'mens',
    name: "Men's Collection",
    href: '/men',
    image: '/collections/men-category.jpg',
    imagePosition: 'center',
  },
  {
    key: 'womens',
    name: 'Women',
    href: '/women',
    image: '/collections/saree-category-new.jpg',
    imagePosition: 'center top',
  },
  {
    key: 'saree',
    name: 'Saree',
    href: '/sarees',
    image: SAREE_HOMEPAGE_COVER,
    imagePosition: '62% top',
  },
  {
    key: 'denim',
    name: 'Pants',
    href: '/men/pants',
    image: '/collections/featured-denim-collection.jpg',
    imagePosition: 'center top',
  },
  {
    key: 'kids',
    name: 'KID',
    href: '/kids',
    image: KIDS_HOMEPAGE_COVER,
    imagePosition: 'right center',
  },
  {
    key: 'western',
    name: "Women's Baggy",
    href: '/women/womens-baggy',
    image: WOMENS_BAGGY_CATEGORY_COVER,
    imagePosition: 'center center',
  },
]
