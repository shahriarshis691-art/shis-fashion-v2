export interface HomeCategoryItem {
  key: 'mens' | 'womens' | 'couples' | 'kids' | 'western' | 'denim'
  name: string
  href: string
  image: string
}

export const homeCategoryItems: HomeCategoryItem[] = [
  {
    key: 'mens',
    name: "Men's Collection",
    href: '/shop/mens',
    image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'womens',
    name: "Women's Collection",
    href: '/shop/womens',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'couples',
    name: 'Couples Collection',
    href: '/shop/couples',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'kids',
    name: 'Kids Collection',
    href: '/shop/kids',
    image: 'https://images.unsplash.com/photo-1519238359922-989348752efb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'western',
    name: 'Western Outfits',
    href: '/shop/western',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'denim',
    name: 'Denim',
    href: '/shop/denim',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80',
  },
]
