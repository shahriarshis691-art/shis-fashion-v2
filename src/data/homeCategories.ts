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
    key: 'womens',
    name: "Women's Collection",
    href: '/women',
    image: '/og-image.svg',
  },
  {
    key: 'saree',
    name: 'Saree',
    href: '/sarees',
    image: '/collections/category-saree-blue.jpg',
    imagePosition: 'center 18%',
  },
  {
    key: 'denim',
    name: 'Denim',
    href: '/men?sub=denim',
    image: '/og-image.svg',
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
