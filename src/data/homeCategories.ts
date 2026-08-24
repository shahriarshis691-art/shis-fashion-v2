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
    href: '/men?sub=oversized-tee',
    image: 'https://res.cloudinary.com/oynk45cl/image/upload/f_auto,q_auto/733499845_122185741844748051_3566784808270551668_n_2_z9zzsr',
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
    image: '/collections/category-saree-blue.jpg',
    imagePosition: 'center top',
  },
  {
    key: 'saree',
    name: 'Saree',
    href: '/sarees',
    image: '/collections/category-saree-blue.jpg',
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
    name: 'Western Outfits',
    href: '/women?sub=tunic',
    image: '/og-image.svg',
  },
  {
    key: 'couples',
    name: 'Couples Collection',
    href: '/men?sub=accessories',
    image: '/og-image.svg',
  },
]
