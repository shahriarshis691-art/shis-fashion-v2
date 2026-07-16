export interface HomeCategoryItem {
  key: 'mens' | 'womens' | 'kids' | 'western' | 'denim'
  name: string
  href: string
  image: string
}

export const homeCategoryItems: HomeCategoryItem[] = [
  {
    key: 'mens',
    name: 'Mens',
    href: '/shop?category=mens',
    image: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'womens',
    name: 'Womens',
    href: '/shop?category=womens',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'kids',
    name: 'Kids',
    href: '/shop?category=kids',
    image: 'https://images.unsplash.com/photo-1519238359922-989348752efb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'western',
    name: 'Western',
    href: '/shop?category=western',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    key: 'denim',
    name: 'Denim',
    href: '/shop?category=denim',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1200&q=80',
  },
]
