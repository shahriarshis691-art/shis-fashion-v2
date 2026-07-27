export interface HomeCategoryItem {
  key: 'mens' | 'womens' | 'couples' | 'kids' | 'western' | 'denim' | 'oversized-tee'
  name: string
  href: string
  image: string
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
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'denim',
    name: 'Denim',
    href: '/men?sub=denim',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'kids',
    name: 'Kids Collection',
    href: '/kids',
    image: 'https://images.unsplash.com/photo-1519238359922-989348752efb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'western',
    name: 'Western Outfits',
    href: '/women?sub=tunic',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'couples',
    name: 'Couples Collection',
    href: '/men?sub=accessories',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
  },
]
