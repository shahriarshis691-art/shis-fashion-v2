import { SAREE_HOMEPAGE_COVER } from './featuredCollectionCovers'

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
    imagePosition: '25% center',
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
    image: '/hero/kid-homepage.jpg',
  },
  {
    key: 'western',
    name: "Women's Baggy",
    href: '/women/womens-baggy',
    image: '/collections/featured-denim-collection.jpg',
    imagePosition: 'center top',
  },
]
