export interface ShopCategory {
  slug: string
  title: string
  description: string
  image: string
}

export interface ShopProduct {
  id: number | string
  slug: string
  name: string
  price: string
  discount?: string
  category: string
  image: string
  description: string
  galleryImages?: string[]
  stock?: number
  featured?: boolean
  newArrival?: boolean
}

export const shopCategories: ShopCategory[] = [
  { slug: 'oversized-tee', title: 'Oversized Tee', description: 'Relaxed silhouettes with elevated texture.', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80' },
  { slug: 'unisex-tee', title: 'Unisex Tee', description: 'Minimal staples for everyday layering.', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80' },
  { slug: 'denim', title: 'Denim', description: 'Refined denim with a premium finish.', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80' },
  { slug: 'mens-shirt', title: "Men's Shirt", description: 'Polished structure in a relaxed fit.', image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80' },
  { slug: 'womens-dresses', title: "Women's Dresses", description: 'Fluid forms with effortless movement.', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80' },
  { slug: 'western-outfits', title: 'Western Outfits', description: 'Modern staples with a bold edge.', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80' },
  { slug: 'couples', title: 'Couples Collection', description: 'Coordinated pieces for shared moments.', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80' },
  { slug: 'gift', title: 'Gift Collection', description: 'Thoughtful pieces with a premium finish.', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80' },
  { slug: 'kids', title: 'Kids Collection', description: 'Soft tailoring for little style legends.', image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80' },
]

export const shopProducts: ShopProduct[] = [
  { id: 1, slug: 'atelier-oversized-tee', name: 'Atelier Oversized Tee', price: '৳ 12,000', category: 'oversized-tee', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', description: 'Relaxed fit with a premium ribbed finish.', galleryImages: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80'] },
  { id: 2, slug: 'signature-unisex-tee', name: 'Signature Unisex Tee', price: '৳ 10,500', category: 'unisex-tee', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', description: 'Soft cotton with a clean, modern drape.', galleryImages: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80'] },
  { id: 3, slug: 'monarch-denim', name: 'Monarch Denim', price: '৳ 17,000', category: 'denim', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80', description: 'Structured denim with a smooth finish.', galleryImages: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80'] },
  { id: 4, slug: 'studio-mens-shirt', name: 'Studio Men\'s Shirt', price: '৳ 15,000', category: 'mens-shirt', image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80', description: 'Sharp lines and a relaxed silhouette.', galleryImages: ['https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'] },
  { id: 5, slug: 'aurora-dress', name: 'Aurora Dress', price: '৳ 20,000', category: 'womens-dresses', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80', description: 'Fluid movement with a polished finish.', galleryImages: ['https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80'] },
  { id: 6, slug: 'desert-western', name: 'Desert Western', price: '৳ 18,500', category: 'western-outfits', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', description: 'A modern western statement with ease.', galleryImages: ['https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80'] },
  { id: 7, slug: 'duo-couples-set', name: 'Duo Couples Set', price: '৳ 21,500', category: 'couples', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', description: 'Coordinated comfort for two.', galleryImages: ['https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80'] },
  { id: 8, slug: 'gift-box-set', name: 'Gift Box Set', price: '৳ 13,500', category: 'gift', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80', description: 'An elevated gift offering with luxury details.', galleryImages: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'] },
  { id: 9, slug: 'mini-essentials', name: 'Mini Essentials', price: '৳ 10,500', category: 'kids', image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80', description: 'Playful pieces with a tailored finish.', galleryImages: ['https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80'] },
]

export function getCategoryBySlug(slug: string) {
  return shopCategories.find((category) => category.slug === slug)
}

export function getProductsByCategory(slug: string) {
  return shopProducts.filter((product) => product.category === slug)
}

export function getFeaturedProducts(limit = 4) {
  return shopProducts.slice(0, limit)
}
