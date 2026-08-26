export interface HomeCategoryItem {
  key: 'mens' | 'womens' | 'couples' | 'kids' | 'western' | 'denim' | 'oversized-tee' | 'saree'
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
    image: '/collections/men-category.webp',
    imagePosition: 'center top',
  },
  {
    key: 'womens',
    name: "Women's Collection",
    href: '/women',
    image: '/collections/saree-category-new.jpg',
    imagePosition: 'center top',
  },
  {
    key: 'saree',
    name: 'Saree',
    href: '/sarees',
    image: '/collections/saree-category-new.jpg',
    imagePosition: 'center top',
  },
  {
    key: 'denim',
    name: 'Denim',
    href: '/men?sub=denim',
    image: '/collections/featured-denim-collection.jpg',
    imagePosition: 'center top',
  },
  {
    key: 'kids',
    name: 'Kids Collection',
    href: '/kids',
    image: '/og-image.svg',
  },
  {
    key: 'western',
    name: "Women's Baggy",
    href: '/women/womens-baggy',
    image: '/collections/featured-denim-collection.jpg',
    imagePosition: 'center top',
  },
  {
    key: 'couples',
    name: 'Couples Collection',
    href: '/men?sub=accessories',
    image: '/og-image.svg',
  },
]
