import { formatBDT } from '../utils/currency'
import type { ShopProduct } from './shopData'

export interface SareeProduct extends ShopProduct {
  fabric: string
  blousePiece: string
  inStock: boolean
  subCategory?: string
  originalPrice?: string
}

const SAREE_IMAGE_EXT: Record<number, 'jpg' | 'png'> = {
  1: 'jpg',
  3: 'jpg',
  4: 'jpg',
  5: 'png',
  6: 'png',
  7: 'png',
}

function sareeImage(index: number) {
  const ext = SAREE_IMAGE_EXT[index] ?? 'jpg'
  return `/saree/saree.${index}.${ext}`
}

function sareeDetailImages(index: number) {
  return [
    `/saree/saree.${index}-texture.jpg`,
    `/saree/saree.${index}-border.jpg`,
  ] as const
}

function createSaree(
  index: number,
  slug: string,
  name: string,
  price: number,
  colors: string[],
  fabric: string,
  description: string,
  options: {
    id?: string
    featured?: boolean
    newArrival?: boolean
    stock?: number
  } = {},
): SareeProduct {
  const image = sareeImage(index)

  return {
    id: options.id ?? `saree-${index}`,
    slug,
    name,
    price: formatBDT(price),
    category: 'Saree',
    brand: 'SHIS Fashion',
    image,
    galleryImages: [image, ...sareeDetailImages(index)],
    fabric,
    blousePiece: 'Included (Unstitched)',
    inStock: true,
    stock: options.stock ?? 10,
    featured: options.featured ?? true,
    newArrival: options.newArrival ?? true,
    description,
    sizes: ['Free Size'],
    colors,
  }
}

/** Static saree edit — images live in `/public/saree/` (`saree.1`, `saree.3`–`saree.7`). */
const existingSareeCollectionProducts: SareeProduct[] = [
  createSaree(
    1,
    'crimson-red-georgette-saree',
    'Crimson Red Premium Georgette Saree',
    3850,
    ['Crimson Red'],
    'Pure Georgette',
    'Elegant crimson red lightweight georgette saree with subtle lace border details, perfect for evening gatherings and festivities.',
    { id: 'saree-crimson-red', stock: 12 },
  ),
  createSaree(
    3,
    'olive-green-silk-saree',
    'Olive Green Festive Handloom Silk Saree',
    4650,
    ['Olive Green'],
    'Handloom Soft Silk',
    'Traditional olive green festive silk saree with refined drape, rich texture, and classic borders.',
    { id: 'saree-olive-green', stock: 8 },
  ),
  createSaree(
    4,
    'mustard-olive-batik-saree',
    'Mustard Olive Batik Print Saree',
    3950,
    ['Mustard', 'Olive'],
    'Cotton Silk Blend',
    'Earthy mustard and olive batik-print saree with charcoal mandala pallu and a matching printed blouse.',
    { stock: 11 },
  ),
  createSaree(
    5,
    'maroon-satin-silver-zari-saree',
    'Maroon Satin Saree with Silver Zari',
    4500,
    ['Maroon'],
    'Satin Silk',
    'Lustrous maroon satin saree with a wide silver zari floral border, cut for festive evenings and celebrations.',
    { stock: 9 },
  ),
  createSaree(
    6,
    'royal-purple-gold-buta-saree',
    'Royal Purple Silk Saree with Gold Buta',
    4850,
    ['Royal Purple'],
    'Premium Silk',
    'Deep purple silk saree with gold buta motifs and a rich zari border for temple, wedding, and occasion wear.',
    { stock: 7 },
  ),
  createSaree(
    7,
    'maroon-bandhani-print-saree',
    'Maroon Bandhani Print Saree',
    4100,
    ['Maroon'],
    'Printed Georgette',
    'Classic maroon bandhani-print saree with circular motifs, a slim gold border, and an easy everyday drape.',
    { stock: 13 },
  ),
]

const JAMDANI_DIR = '/saree/jamdani'

function jamdaniSrc(filename: string) {
  return `${JAMDANI_DIR}/${encodeURIComponent(filename)}`
}

interface JamdaniFolderEntry {
  id: string
  slug: string
  name: string
  price: number
  originalPrice: number
  filename: string
  galleryFilenames?: string[]
  colors: string[]
  fabric: string
  description: string
  stock?: number
  featured?: boolean
}

function createJamdaniFolderSaree(entry: JamdaniFolderEntry): SareeProduct {
  const image = jamdaniSrc(entry.filename)
  const galleryImages = [image, ...(entry.galleryFilenames ?? []).map(jamdaniSrc)]
  const originalPrice = formatBDT(entry.originalPrice)

  return {
    id: entry.id,
    slug: entry.slug,
    name: entry.name,
    price: formatBDT(entry.price),
    comparePrice: originalPrice,
    originalPrice,
    category: 'Saree',
    subCategory: 'saree',
    brand: 'SHIS Fashion',
    image,
    galleryImages,
    fabric: entry.fabric,
    blousePiece: 'Included (Unstitched)',
    inStock: true,
    stock: entry.stock ?? 8,
    featured: entry.featured ?? true,
    newArrival: true,
    description: entry.description,
    sizes: ['Free Size'],
    colors: entry.colors,
  }
}

/**
 * Unique products from `/public/saree/jamdani/`.
 * Exact WhatsApp duplicate shots are omitted from the listing and used only as extra gallery angles.
 */
const jamdaniFolderEntries: JamdaniFolderEntry[] = [
  {
    id: 'saree-jamdani-01',
    slug: 'ivory-sunflower-sketch-cotton-saree',
    name: 'Ivory Sunflower Sketch Soft Cotton Saree',
    price: 3450,
    originalPrice: 4590,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.09 AM.jpeg',
    colors: ['Ivory', 'Charcoal'],
    fabric: 'Soft Cotton',
    description: 'Hand-drawn sunflower motifs on an ivory cotton drape — a quiet luxury piece for considered everyday wear.',
    stock: 10,
  },
  {
    id: 'saree-jamdani-02',
    slug: 'cream-crimson-leaf-handloom-saree',
    name: 'Cream Crimson Leaf Handloom Saree',
    price: 3850,
    originalPrice: 4990,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.10 AM.jpeg',
    colors: ['Cream', 'Crimson'],
    fabric: 'Soft Cotton',
    description: 'Cream body with a dense crimson leaf pallu and border — a heritage handloom drape with festive presence.',
    stock: 9,
  },
  {
    id: 'saree-jamdani-03',
    slug: 'ivory-black-temple-border-handloom-saree',
    name: 'Ivory Temple Border Handloom Saree',
    price: 3550,
    originalPrice: 4690,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.18 AM.jpeg',
    colors: ['Ivory', 'Black'],
    fabric: 'Handloom Cotton',
    description: 'Ivory handloom cotton with black temple-stripe borders and a geometric pallu for elevated daily elegance.',
    stock: 11,
  },
  {
    id: 'saree-jamdani-04',
    slug: 'heritage-floral-pallu-nakshi-kantha-saree',
    name: 'Heritage Floral Pallu Nakshi Kantha Saree',
    price: 6250,
    originalPrice: 7990,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.24 AM.jpeg',
    colors: ['Ivory', 'Red', 'Green'],
    fabric: 'Nakshi Kantha Silk',
    description: 'Artisanal nakshi kantha with a red-and-green floral pallu, spiral body motifs, and a refined festive drape.',
    stock: 7,
    featured: true,
  },
  {
    id: 'saree-jamdani-05',
    slug: 'mauve-medallion-nakshi-kantha-saree',
    name: 'Mauve Medallion Nakshi Kantha Saree',
    price: 6850,
    originalPrice: 8590,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.25 AM.jpeg',
    colors: ['Mauve', 'Lime'],
    fabric: 'Nakshi Kantha Silk',
    description: 'Mauve silk-cotton kantha with repeating floral medallions, lime piping, and tassel-finished pallu.',
    stock: 6,
  },
  {
    id: 'saree-jamdani-06',
    slug: 'teal-mirror-work-nakshi-kantha-saree',
    name: 'Teal Mirror Work Nakshi Kantha Saree',
    price: 7150,
    originalPrice: 8990,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.25 AM (1).jpeg',
    colors: ['Teal', 'White'],
    fabric: 'Nakshi Kantha Silk',
    description: 'Aqua-teal kantha with white running-stitch paisleys, mirror accents, and a densely embroidered pallu.',
    stock: 8,
  },
  {
    id: 'saree-jamdani-07',
    slug: 'midnight-mirror-nakshi-kantha-saree',
    name: 'Midnight Mirror Nakshi Kantha Saree',
    price: 7450,
    originalPrice: 9290,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.26 AM.jpeg',
    colors: ['Black', 'Red', 'Teal'],
    fabric: 'Nakshi Kantha Silk',
    description: 'Midnight kantha with crimson-teal chakra motifs, mirror work, and a richly stitched geometric border.',
    stock: 5,
    featured: true,
  },
  {
    id: 'saree-jamdani-08',
    slug: 'kalamkari-paisley-soft-cotton-saree',
    name: 'Kalamkari Paisley Soft Cotton Saree',
    price: 4150,
    originalPrice: 5390,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.26 AM (1).jpeg',
    colors: ['Ivory', 'Red', 'Indigo'],
    fabric: 'Soft Cotton',
    description: 'Ivory cotton with kalamkari paisley pallu, crimson piping, and a fluid everyday drape.',
    stock: 10,
  },
  {
    id: 'saree-jamdani-09',
    slug: 'indigo-block-print-cotton-saree',
    name: 'Indigo Block Print Soft Cotton Saree',
    price: 3750,
    originalPrice: 4890,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.26 AM (2).jpeg',
    colors: ['Indigo', 'Ivory'],
    fabric: 'Soft Cotton',
    description: 'Deep indigo cotton with white buti prints and a graphic striped pallu for modern heritage dressing.',
    stock: 12,
  },
  {
    id: 'saree-jamdani-10',
    slug: 'olive-chakra-nakshi-kantha-saree',
    name: 'Olive Chakra Nakshi Kantha Saree',
    price: 6650,
    originalPrice: 8290,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.27 AM.jpeg',
    colors: ['Olive', 'Rust'],
    fabric: 'Nakshi Kantha Silk',
    description: 'Earthy olive kantha with rust-and-gold circular chakras, rust blouse contrast, and tassel detailing.',
    stock: 7,
  },
  {
    id: 'saree-jamdani-11',
    slug: 'cream-floral-stripe-soft-cotton-saree',
    name: 'Cream Floral Stripe Soft Cotton Saree',
    price: 4250,
    originalPrice: 5490,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.27 AM (1).jpeg',
    colors: ['Cream', 'Coral', 'Blue'],
    fabric: 'Soft Cotton',
    description: 'Cream cotton with vertical floral stripes, coral blooms, and a blue-piped border for occasion-ready ease.',
    stock: 9,
  },
  {
    id: 'saree-jamdani-12',
    slug: 'rose-paisley-nakshi-kantha-saree',
    name: 'Rose Paisley Nakshi Kantha Saree',
    price: 5950,
    originalPrice: 7490,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.27 AM (2).jpeg',
    colors: ['Rose', 'Gold'],
    fabric: 'Nakshi Kantha Cotton',
    description: 'Rose kantha with scattered paisleys, a richly embroidered pallu, and classic artisanal stitching.',
    stock: 8,
  },
  {
    id: 'saree-jamdani-13',
    slug: 'ivory-blush-kantha-cotton-saree',
    name: 'Ivory Blush Kantha Cotton Saree',
    price: 4850,
    originalPrice: 6290,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.28 AM.jpeg',
    colors: ['Ivory', 'Blush'],
    fabric: 'Nakshi Kantha Cotton',
    description: 'Ivory cotton kantha with blush borders, petite leaf butis, and a tassel-finished embroidered pallu.',
    stock: 11,
  },
  {
    id: 'saree-jamdani-14',
    slug: 'lime-peacock-nakshi-kantha-saree',
    name: 'Lime Peacock Nakshi Kantha Saree',
    price: 7650,
    originalPrice: 9490,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.28 AM (1).jpeg',
    colors: ['Lime', 'Teal'],
    fabric: 'Nakshi Kantha Silk',
    description: 'Chartreuse kantha with peacock-and-paisley storytelling, teal lattice borders, and lime tassels.',
    stock: 6,
    featured: true,
  },
  {
    id: 'saree-jamdani-15',
    slug: 'ivory-ajrakh-border-soft-cotton-saree',
    name: 'Ivory Ajrakh Border Soft Cotton Saree',
    price: 4050,
    originalPrice: 5290,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.29 AM.jpeg',
    colors: ['Ivory', 'Wine'],
    fabric: 'Soft Cotton',
    description: 'Ivory cotton with wine ajrakh borders, scattered butis, and a tassel hem for refined everyday wear.',
    stock: 9,
  },
  {
    id: 'saree-jamdani-16',
    slug: 'ivory-black-border-nakshi-kantha-saree',
    name: 'Ivory Black Border Nakshi Kantha Saree',
    price: 5250,
    originalPrice: 6790,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.29 AM (1).jpeg',
    colors: ['Ivory', 'Black'],
    fabric: 'Nakshi Kantha Cotton',
    description: 'Ivory kantha with gold swirl butis, a graphic black border, and white tassels for contemporary heritage style.',
    stock: 8,
  },
  {
    id: 'saree-jamdani-17',
    slug: 'white-geometric-nakshi-kantha-saree',
    name: 'White Geometric Nakshi Kantha Saree',
    price: 5450,
    originalPrice: 6990,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.29 AM (2).jpeg',
    colors: ['White', 'Black'],
    fabric: 'Nakshi Kantha Cotton',
    description: 'White kantha with black geometric lattice, star medallions, and a sculpted black-piped pallu.',
    stock: 7,
  },
  {
    id: 'saree-jamdani-18',
    slug: 'dusty-rose-mandala-nakshi-kantha-saree',
    name: 'Dusty Rose Mandala Nakshi Kantha Saree',
    price: 6550,
    originalPrice: 8190,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.30 AM.jpeg',
    colors: ['Dusty Rose', 'Ivory'],
    fabric: 'Nakshi Kantha Silk',
    description: 'Dusty rose kantha with ivory-gold mandalas, triangle borders, and rose pom-pom tassels.',
    stock: 6,
  },
  {
    id: 'saree-jamdani-19',
    slug: 'emerald-star-nakshi-kantha-saree',
    name: 'Emerald Star Nakshi Kantha Saree',
    price: 7350,
    originalPrice: 9190,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.30 AM (1).jpeg',
    colors: ['Black', 'Emerald'],
    fabric: 'Nakshi Kantha Silk',
    description: 'Black kantha with emerald star butis, nested diamond pallu, and mustard piping for evening occasion wear.',
    stock: 5,
    featured: true,
  },
  {
    id: 'saree-jamdani-20',
    slug: 'slate-pink-border-nakshi-kantha-silk-saree',
    name: 'Slate Pink Border Nakshi Kantha Silk Saree',
    price: 5850,
    originalPrice: 7490,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.30 AM (2).jpeg',
    colors: ['Slate', 'Blush'],
    fabric: 'Nakshi Kantha Silk',
    description: 'Lustrous slate silk with petite black butis, blush-gold kantha borders, and black tassels.',
    stock: 8,
  },
  {
    id: 'saree-jamdani-21',
    slug: 'magenta-paisley-nakshi-kantha-saree',
    name: 'Magenta Paisley Nakshi Kantha Saree',
    price: 6950,
    originalPrice: 8690,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.31 AM.jpeg',
    colors: ['Magenta', 'Ivory'],
    fabric: 'Nakshi Kantha Silk',
    description: 'Magenta kantha with ivory floral lattice, paisley stripes, and coral tassels for festive gatherings.',
    stock: 7,
  },
  {
    id: 'saree-jamdani-22',
    slug: 'navy-lattice-nakshi-kantha-saree',
    name: 'Navy Lattice Nakshi Kantha Saree',
    price: 7850,
    originalPrice: 9790,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.32 AM (1).jpeg',
    galleryFilenames: ['WhatsApp Image 2026-08-27 at 5.27.31 AM (1).jpeg'],
    colors: ['Navy', 'Gold'],
    fabric: 'Nakshi Kantha Silk',
    description: 'Navy kantha with diamond lattice, gold-rust borders, and a densely embroidered floral pallu.',
    stock: 6,
    featured: true,
  },
  {
    id: 'saree-jamdani-23',
    slug: 'charcoal-gold-mandala-nakshi-kantha-saree',
    name: 'Charcoal Gold Mandala Nakshi Kantha Saree',
    price: 8050,
    originalPrice: 9800,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.31 AM (2).jpeg',
    colors: ['Charcoal', 'Gold'],
    fabric: 'Nakshi Kantha Silk',
    description: 'Charcoal kantha with a monumental gold mandala pallu, paisley frames, and gold-piped tassels.',
    stock: 5,
    featured: true,
  },
  {
    id: 'saree-jamdani-24',
    slug: 'burgundy-sunburst-nakshi-kantha-saree',
    name: 'Burgundy Sunburst Nakshi Kantha Saree',
    price: 7250,
    originalPrice: 8990,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.32 AM.jpeg',
    colors: ['Burgundy', 'Gold'],
    fabric: 'Nakshi Kantha Silk',
    description: 'Deep burgundy kantha with a radiating sunburst medallion, vine borders, and mustard piping.',
    stock: 7,
  },
  {
    id: 'saree-jamdani-25',
    slug: 'ivory-crimson-floral-nakshi-kantha-saree',
    name: 'Ivory Crimson Floral Nakshi Kantha Saree',
    price: 5550,
    originalPrice: 7190,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.32 AM (2).jpeg',
    colors: ['Ivory', 'Crimson'],
    fabric: 'Nakshi Kantha Cotton',
    description: 'Ivory kantha with crimson-black floral medallions, boxed borders, and a compact artisanal drape.',
    stock: 10,
  },
  {
    id: 'saree-jamdani-26',
    slug: 'warli-motif-soft-cotton-saree',
    name: 'Warli Motif Soft Cotton Saree',
    price: 3350,
    originalPrice: 4490,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.49 AM.jpeg',
    colors: ['Ivory', 'Black'],
    fabric: 'Soft Cotton',
    description: 'Ivory cotton with black tribal warli motifs, chevron pallu, and a lightweight everyday drape.',
    stock: 12,
  },
  {
    id: 'saree-jamdani-27',
    slug: 'sunshine-kota-floral-jamdani-saree',
    name: 'Sunshine Kota Floral Jamdani Saree',
    price: 5450,
    originalPrice: 6990,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.51 AM.jpeg',
    colors: ['Mustard', 'Brown'],
    fabric: 'Jamdani',
    description: 'Sunlit kota-jamdani with scalloped floral windows, airy checks, and a luminous festive drape.',
    stock: 8,
    featured: true,
  },
  {
    id: 'saree-jamdani-28',
    slug: 'ivory-diamond-buti-jamdani-saree',
    name: 'Traditional Motif Cotton Jamdani Saree',
    price: 6250,
    originalPrice: 7490,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.51 AM (1).jpeg',
    colors: ['Ivory', 'Red', 'Black'],
    fabric: 'Jamdani',
    description: 'Classic cotton jamdani with diamond butis, red-and-black extra-weft motifs, and a striped pallu.',
    stock: 9,
    featured: true,
  },
  {
    id: 'saree-jamdani-29',
    slug: 'ivory-black-paisley-handloom-saree',
    name: 'Ivory Black Paisley Handloom Saree',
    price: 3650,
    originalPrice: 4790,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.52 AM.jpeg',
    colors: ['Ivory', 'Black'],
    fabric: 'Handloom Cotton',
    description: 'Ivory handloom with black paisley butis, a graphic black pallu, and bold contrast borders.',
    stock: 10,
  },
  {
    id: 'saree-jamdani-30',
    slug: 'white-lotus-applique-cotton-saree',
    name: 'White Lotus Applique Soft Cotton Saree',
    price: 4550,
    originalPrice: 5890,
    filename: 'WhatsApp Image 2026-08-27 at 5.27.52 AM (1).jpeg',
    colors: ['White', 'Black'],
    fabric: 'Soft Cotton',
    description: 'White cotton with black lotus applique, scalloped hem, and a garden-ready lightweight drape.',
    stock: 8,
  },
  {
    id: 'saree-jamdani-31',
    slug: 'blush-lotus-handloom-cotton-saree',
    name: 'Blush Lotus Handloom Cotton Saree',
    price: 3450,
    originalPrice: 4590,
    filename: 'WhatsApp Image 2026-08-27 at 5.29.26 AM.jpeg',
    colors: ['Ivory', 'Blush', 'Sage'],
    fabric: 'Soft Cotton',
    description: 'Ivory handloom with blush lotus prints, sage-and-pink borders, and a breezy summer drape.',
    stock: 11,
  },
  {
    id: 'saree-jamdani-32',
    slug: 'cream-check-maroon-mandala-saree',
    name: 'Cream Check Maroon Mandala Saree',
    price: 3950,
    originalPrice: 5190,
    filename: 'WhatsApp Image 2026-08-27 at 5.29.29 AM (2).jpeg',
    colors: ['Cream', 'Maroon'],
    fabric: 'Handloom Cotton',
    description: 'Cream checked handloom with maroon mandala borders and a densely printed heritage pallu.',
    stock: 9,
  },
  {
    id: 'saree-jamdani-33',
    slug: 'slate-village-scene-soft-cotton-saree',
    name: 'Slate Village Scene Soft Cotton Saree',
    price: 4350,
    originalPrice: 5690,
    filename: 'WhatsApp Image 2026-08-27 at 5.29.30 AM (1).jpeg',
    colors: ['Slate', 'Ivory'],
    fabric: 'Soft Cotton',
    description: 'Slate cotton with a village-and-elephant pallu, scalloped borders, and ivory tassels.',
    stock: 8,
  },
  {
    id: 'saree-jamdani-34',
    slug: 'ivory-temple-doll-handloom-saree',
    name: 'Ivory Temple Doll Handloom Saree',
    price: 3550,
    originalPrice: 4690,
    filename: 'WhatsApp Image 2026-08-27 at 5.29.34 AM (2).jpeg',
    colors: ['Ivory', 'Black'],
    fabric: 'Handloom Cotton',
    description: 'Ivory-and-black handloom with temple-doll pallu panels and a graphic contrast drape.',
    stock: 10,
  },
  {
    id: 'saree-jamdani-35',
    slug: 'cream-paisley-maroon-drape-saree',
    name: 'Cream Paisley Maroon Drape Saree',
    price: 4150,
    originalPrice: 5390,
    filename: 'WhatsApp Image 2026-08-27 at 5.29.34 AM (3).jpeg',
    colors: ['Cream', 'Maroon', 'Black'],
    fabric: 'Soft Cotton',
    description: 'Cream cotton with oversized black paisleys, a maroon inner drape, and black contrast borders.',
    stock: 8,
  },
  {
    id: 'saree-jamdani-36',
    slug: 'beige-lotus-silver-zari-saree',
    name: 'Beige Lotus Silver Zari Soft Cotton Saree',
    price: 4650,
    originalPrice: 5990,
    filename: 'WhatsApp Image 2026-08-27 at 5.29.35 AM (1).jpeg',
    colors: ['Beige', 'Silver', 'Coral'],
    fabric: 'Soft Cotton / Silk',
    description: 'Beige cotton-silk with painterly lotuses, silver zari borders, and a luminous everyday luxury drape.',
    stock: 7,
  },
  {
    id: 'saree-jamdani-38',
    slug: 'temple-paisley-gold-border-saree',
    name: 'Temple Paisley Gold Border Saree',
    price: 4550,
    originalPrice: 5890,
    filename: 'WhatsApp Image 2026-08-27 at 5.29.36 AM (1).jpeg',
    colors: ['Ivory', 'Red', 'Gold'],
    fabric: 'Soft Cotton / Silk',
    description: 'Ivory cotton with red temple-paisley panels, sawtooth borders, and a gold tissue edge.',
    stock: 9,
  },
  {
    id: 'saree-jamdani-39',
    slug: 'handcrafted-soft-cotton-jamdani-saree',
    name: 'Handcrafted Soft Cotton Jamdani Saree',
    price: 3650,
    originalPrice: 4790,
    filename: 'WhatsApp Image 2026-08-27 at 5.29.37 AM.jpeg',
    colors: ['Ivory', 'Charcoal'],
    fabric: 'Jamdani',
    description: 'Handcrafted soft cotton jamdani with circular butis, a scalloped charcoal border, and an easy daily drape.',
    stock: 13,
    featured: true,
  },
  {
    id: 'saree-jamdani-40',
    slug: 'heritage-tree-of-life-handloom-saree',
    name: 'Heritage Tree of Life Handloom Saree',
    price: 4850,
    originalPrice: 6290,
    filename: 'WhatsApp Image 2026-08-27 at 5.29.37 AM (1).jpeg',
    colors: ['Beige', 'Black', 'Slate'],
    fabric: 'Handloom Cotton',
    description: 'Beige handloom with a tree-of-life pallu, striped and checked panels, and a black contrast border.',
    stock: 7,
  },
]

const jamdaniFolderProducts = jamdaniFolderEntries.map(createJamdaniFolderSaree)

export const sareeCollectionProducts: SareeProduct[] = [
  ...existingSareeCollectionProducts,
  ...jamdaniFolderProducts,
]

/** Alias matching the requested export name. */
export const sareeCollection = sareeCollectionProducts

export function isSareeProduct(product: Pick<ShopProduct, 'name' | 'slug' | 'category'>) {
  const text = [product.name, product.slug, product.category].join(' ').toLowerCase()
  return /\bsaree\b|\bsari\b|\bsarees\b|\bsaris\b/.test(text)
}

export function toSareeProduct(product: ShopProduct): SareeProduct {
  const existing = sareeCollectionProducts.find(
    (item) => item.slug.toLowerCase() === product.slug.trim().toLowerCase(),
  )

  return {
    ...product,
    fabric: existing?.fabric ?? 'Premium Fabric',
    blousePiece: existing?.blousePiece ?? 'Included (Unstitched)',
    inStock: (product.stock ?? 0) > 0,
    sizes: product.sizes?.length ? product.sizes : ['Free Size'],
    subCategory: existing?.subCategory ?? 'saree',
    originalPrice: existing?.originalPrice ?? product.comparePrice,
  }
}

export function mergeSareeCatalog(liveProducts: ShopProduct[]): SareeProduct[] {
  const liveSarees = liveProducts.filter(isSareeProduct).map(toSareeProduct)
  const taken = new Set(liveSarees.map((product) => product.slug.trim().toLowerCase()).filter(Boolean))
  const extras = sareeCollectionProducts.filter((product) => !taken.has(product.slug.toLowerCase()))
  return extras.length ? [...liveSarees, ...extras] : liveSarees
}

export function getSareeProductBySlug(slug: string, catalog: SareeProduct[] = sareeCollectionProducts): SareeProduct | undefined {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return catalog.find((product) => product.slug.toLowerCase() === normalized)
}
