import { formatBDT } from '../utils/currency'
import type { ShopProduct } from './shopData'

export const WESTERN_OUTFITS_LISTING_PATH = '/women?sub=western-outfits'
export const WESTERN_OUTFIT_SIZES = ['S', 'M', 'L', 'XL'] as const
export const WESTERN_OUTFIT_IMAGE_DIR = '/western'

export type WesternOutfitGroup = 'tops-blouses' | 'shorts-denim' | 'bottoms-skirts'
export type WesternListingFilter = 'all' | WesternOutfitGroup

export interface WesternOutfitProduct extends ShopProduct {
  sku: string
  westernGroup: WesternOutfitGroup
  tags: string[]
}

type WesternOutfitFields = ShopProduct & {
  westernGroup?: WesternOutfitGroup
  tags?: string[]
  sku?: string
}

interface WesternOutfitSeed {
  index: number
  slug: string
  name: string
  price: number
  group: WesternOutfitGroup
  colors: string[]
  description: string
  featured?: boolean
  newArrival?: boolean
  stock?: number
}

function westernImage(index: number) {
  return `${WESTERN_OUTFIT_IMAGE_DIR}/western-${index}.webp`
}

function createWesternOutfit(seed: WesternOutfitSeed): WesternOutfitProduct {
  const image = westernImage(seed.index)
  const sku = `WST-${String(seed.index).padStart(3, '0')}`

  return {
    id: `western-${seed.index}`,
    slug: seed.slug,
    name: seed.name,
    price: formatBDT(seed.price),
    category: 'western-outfits',
    brand: 'SHIS Fashion',
    image,
    galleryImages: [image],
    description: seed.description,
    sizes: [...WESTERN_OUTFIT_SIZES],
    colors: seed.colors,
    stock: seed.stock ?? 14,
    featured: seed.featured ?? false,
    newArrival: seed.newArrival ?? true,
    sku,
    westernGroup: seed.group,
    tags: ['western-outfits', 'western', seed.group, 'women'],
  }
}

const WESTERN_OUTFIT_SEEDS: WesternOutfitSeed[] = [
  // Tops & Blouses — crop tops, casual shirts, tank tops (1–24)
  {
    index: 1,
    slug: 'ivory-ribbed-crop-top',
    name: 'Ivory Ribbed Crop Top',
    price: 890,
    group: 'tops-blouses',
    colors: ['Ivory'],
    description: 'Soft ribbed crop top with a clean scoop neck — flat-lay ready staple for everyday western edits.',
    featured: true,
  },
  {
    index: 2,
    slug: 'black-square-neck-crop-top',
    name: 'Black Square Neck Crop Top',
    price: 950,
    group: 'tops-blouses',
    colors: ['Black'],
    description: 'Structured square-neck crop in matte black cotton stretch, cut for a polished hangar silhouette.',
  },
  {
    index: 3,
    slug: 'sage-tie-front-crop-blouse',
    name: 'Sage Tie-Front Crop Blouse',
    price: 1290,
    group: 'tops-blouses',
    colors: ['Sage'],
    description: 'Lightweight sage blouse with a soft tie-front and cropped hem for breezy Dhaka evenings.',
    featured: true,
  },
  {
    index: 4,
    slug: 'white-poplin-casual-shirt',
    name: 'White Poplin Casual Shirt',
    price: 1490,
    group: 'tops-blouses',
    colors: ['White'],
    description: 'Crisp white poplin shirt with a relaxed collar and clean cuff finish — classic western essential.',
    featured: true,
  },
  {
    index: 5,
    slug: 'blush-satin-cami-tank',
    name: 'Blush Satin Cami Tank',
    price: 990,
    group: 'tops-blouses',
    colors: ['Blush'],
    description: 'Fluid blush satin cami with adjustable straps and a soft V neckline for evening layering.',
  },
  {
    index: 6,
    slug: 'navy-relaxed-oxford-shirt',
    name: 'Navy Relaxed Oxford Shirt',
    price: 1590,
    group: 'tops-blouses',
    colors: ['Navy'],
    description: 'Breathable navy oxford with a soft shoulder and easy drape for work-to-weekend wear.',
  },
  {
    index: 7,
    slug: 'cream-halter-crop-top',
    name: 'Cream Halter Crop Top',
    price: 1090,
    group: 'tops-blouses',
    colors: ['Cream'],
    description: 'Cream halter crop with a secure back tie and smooth jersey body for clean mannequin styling.',
  },
  {
    index: 8,
    slug: 'terracotta-linen-tank',
    name: 'Terracotta Linen Tank',
    price: 1150,
    group: 'tops-blouses',
    colors: ['Terracotta'],
    description: 'Airy terracotta linen tank with a wide strap and straight hem for warm-weather western looks.',
  },
  {
    index: 9,
    slug: 'stripe-cotton-casual-shirt',
    name: 'Stripe Cotton Casual Shirt',
    price: 1550,
    group: 'tops-blouses',
    colors: ['Blue', 'White'],
    description: 'Fine blue-and-white stripe cotton shirt with a soft collar and everyday casual polish.',
    featured: true,
  },
  {
    index: 10,
    slug: 'olive-button-front-crop',
    name: 'Olive Button-Front Crop',
    price: 1190,
    group: 'tops-blouses',
    colors: ['Olive'],
    description: 'Olive button-front crop blouse with a neat placket and short sleeve for elevated basics.',
  },
  {
    index: 11,
    slug: 'charcoal-scoop-tank-top',
    name: 'Charcoal Scoop Tank Top',
    price: 850,
    group: 'tops-blouses',
    colors: ['Charcoal'],
    description: 'Minimal charcoal scoop tank in fine jersey — a wardrobe building block for western layering.',
  },
  {
    index: 12,
    slug: 'lilac-puff-sleeve-blouse',
    name: 'Lilac Puff Sleeve Blouse',
    price: 1690,
    group: 'tops-blouses',
    colors: ['Lilac'],
    description: 'Lilac blouse with soft puff sleeves and a gathered yoke for feminine western silhouettes.',
    featured: true,
  },
  {
    index: 13,
    slug: 'espresso-fitted-crop-tee',
    name: 'Espresso Fitted Crop Tee',
    price: 790,
    group: 'tops-blouses',
    colors: ['Espresso'],
    description: 'Fitted espresso crop tee with a clean crew neck and compact length for denim pairing.',
  },
  {
    index: 14,
    slug: 'sky-boxy-casual-shirt',
    name: 'Sky Boxy Casual Shirt',
    price: 1450,
    group: 'tops-blouses',
    colors: ['Sky Blue'],
    description: 'Boxy sky-blue cotton shirt with a dropped shoulder and easy hang for flat-lay styling.',
  },
  {
    index: 15,
    slug: 'wine-cowl-neck-tank',
    name: 'Wine Cowl Neck Tank',
    price: 1250,
    group: 'tops-blouses',
    colors: ['Wine'],
    description: 'Wine cowl-neck tank in fluid crepe with a soft drape for evening western edits.',
  },
  {
    index: 16,
    slug: 'mint-ruched-crop-top',
    name: 'Mint Ruched Crop Top',
    price: 1050,
    group: 'tops-blouses',
    colors: ['Mint'],
    description: 'Mint ruched crop with side gathers and a soft stretch body for a sculpted hangar look.',
  },
  {
    index: 17,
    slug: 'beige-mandarin-casual-shirt',
    name: 'Beige Mandarin Casual Shirt',
    price: 1520,
    group: 'tops-blouses',
    colors: ['Beige'],
    description: 'Beige mandarin-collar shirt with a clean placket and breathable cotton for refined casual days.',
  },
  {
    index: 18,
    slug: 'coral-spaghetti-tank',
    name: 'Coral Spaghetti Tank',
    price: 920,
    group: 'tops-blouses',
    colors: ['Coral'],
    description: 'Coral spaghetti-strap tank in soft stretch jersey with a straight cropped hem.',
  },
  {
    index: 19,
    slug: 'slate-oversized-casual-shirt',
    name: 'Slate Oversized Casual Shirt',
    price: 1650,
    group: 'tops-blouses',
    colors: ['Slate'],
    description: 'Slate oversized shirt with a longline hem and soft cotton handfeel for layering.',
    featured: true,
  },
  {
    index: 20,
    slug: 'peach-twist-front-crop',
    name: 'Peach Twist-Front Crop',
    price: 1120,
    group: 'tops-blouses',
    colors: ['Peach'],
    description: 'Peach twist-front crop top with a sculpted midriff and soft stretch for clean product shots.',
  },
  {
    index: 21,
    slug: 'ivory-sleeveless-blouse',
    name: 'Ivory Sleeveless Blouse',
    price: 1350,
    group: 'tops-blouses',
    colors: ['Ivory'],
    description: 'Ivory sleeveless blouse with a subtle pleat detail and tailored shoulder line.',
  },
  {
    index: 22,
    slug: 'ink-ribbed-tank-top',
    name: 'Ink Ribbed Tank Top',
    price: 880,
    group: 'tops-blouses',
    colors: ['Ink'],
    description: 'Deep ink ribbed tank with a high neck and compact stretch for everyday western basics.',
  },
  {
    index: 23,
    slug: 'mustard-camp-collar-shirt',
    name: 'Mustard Camp Collar Shirt',
    price: 1580,
    group: 'tops-blouses',
    colors: ['Mustard'],
    description: 'Mustard camp-collar shirt with a relaxed body and short sleeve for warm-weather polish.',
  },
  {
    index: 24,
    slug: 'stone-keyhole-crop-top',
    name: 'Stone Keyhole Crop Top',
    price: 1080,
    group: 'tops-blouses',
    colors: ['Stone'],
    description: 'Stone keyhole crop with a discreet front cutout and soft jersey for modern western wear.',
  },

  // Shorts & Denim (25–36)
  {
    index: 25,
    slug: 'light-wash-denim-shorts',
    name: 'Light Wash Denim Shorts',
    price: 1690,
    group: 'shorts-denim',
    colors: ['Light Wash'],
    description: 'Light-wash denim shorts with a mid rise and clean hem — staple western denim edit.',
    featured: true,
  },
  {
    index: 26,
    slug: 'indigo-high-rise-denim-shorts',
    name: 'Indigo High-Rise Denim Shorts',
    price: 1790,
    group: 'shorts-denim',
    colors: ['Indigo'],
    description: 'Indigo high-rise denim shorts with a tailored seat and classic five-pocket layout.',
    featured: true,
  },
  {
    index: 27,
    slug: 'black-raw-hem-denim-shorts',
    name: 'Black Raw Hem Denim Shorts',
    price: 1750,
    group: 'shorts-denim',
    colors: ['Black'],
    description: 'Black denim shorts with a raw hem finish and compact rise for bold western looks.',
  },
  {
    index: 28,
    slug: 'vintage-blue-mom-denim-shorts',
    name: 'Vintage Blue Mom Denim Shorts',
    price: 1850,
    group: 'shorts-denim',
    colors: ['Vintage Blue'],
    description: 'Vintage-wash mom denim shorts with a roomy seat and soft broken-in handfeel.',
  },
  {
    index: 29,
    slug: 'white-clean-denim-shorts',
    name: 'White Clean Denim Shorts',
    price: 1720,
    group: 'shorts-denim',
    colors: ['White'],
    description: 'Crisp white denim shorts with a clean finish and mid-thigh length for summer edits.',
  },
  {
    index: 30,
    slug: 'grey-washed-denim-shorts',
    name: 'Grey Washed Denim Shorts',
    price: 1680,
    group: 'shorts-denim',
    colors: ['Grey'],
    description: 'Soft grey washed denim shorts with a relaxed thigh and subtle fade for everyday wear.',
  },
  {
    index: 31,
    slug: 'mid-blue-cuffed-denim-shorts',
    name: 'Mid Blue Cuffed Denim Shorts',
    price: 1740,
    group: 'shorts-denim',
    colors: ['Mid Blue'],
    description: 'Mid-blue denim shorts with a turned cuff and classic hardware for hangar presentation.',
  },
  {
    index: 32,
    slug: 'charcoal-stretch-denim-shorts',
    name: 'Charcoal Stretch Denim Shorts',
    price: 1810,
    group: 'shorts-denim',
    colors: ['Charcoal'],
    description: 'Charcoal stretch denim shorts with a sculpted rise and flexible comfort for city days.',
  },
  {
    index: 33,
    slug: 'faded-indigo-bermuda-shorts',
    name: 'Faded Indigo Bermuda Shorts',
    price: 1890,
    group: 'shorts-denim',
    colors: ['Faded Indigo'],
    description: 'Faded indigo bermuda-length denim shorts with a straight leg and clean pocketing.',
    featured: true,
  },
  {
    index: 34,
    slug: 'sand-soft-denim-shorts',
    name: 'Sand Soft Denim Shorts',
    price: 1710,
    group: 'shorts-denim',
    colors: ['Sand'],
    description: 'Sand-tone soft denim shorts with a light wash and easy summer silhouette.',
  },
  {
    index: 35,
    slug: 'deep-navy-denim-shorts',
    name: 'Deep Navy Denim Shorts',
    price: 1760,
    group: 'shorts-denim',
    colors: ['Deep Navy'],
    description: 'Deep navy denim shorts with a polished finish and mid rise for refined western styling.',
  },
  {
    index: 36,
    slug: 'acid-wash-cut-off-shorts',
    name: 'Acid Wash Cut-Off Shorts',
    price: 1820,
    group: 'shorts-denim',
    colors: ['Acid Wash'],
    description: 'Acid-wash cut-off denim shorts with an uneven hem and statement vintage character.',
  },

  // Bottoms & Skirts — tailored trousers and skirts (37–50)
  {
    index: 37,
    slug: 'black-tailored-cigarette-trousers',
    name: 'Black Tailored Cigarette Trousers',
    price: 2190,
    group: 'bottoms-skirts',
    colors: ['Black'],
    description: 'Black cigarette trousers with a tailored waist and clean crease for sharp western bottoms.',
    featured: true,
  },
  {
    index: 38,
    slug: 'ivory-pleated-midi-skirt',
    name: 'Ivory Pleated Midi Skirt',
    price: 1990,
    group: 'bottoms-skirts',
    colors: ['Ivory'],
    description: 'Ivory pleated midi skirt with a soft swing and elastic-ready waist for elegant draping.',
    featured: true,
  },
  {
    index: 39,
    slug: 'beige-wide-leg-trousers',
    name: 'Beige Wide-Leg Trousers',
    price: 2290,
    group: 'bottoms-skirts',
    colors: ['Beige'],
    description: 'Beige wide-leg trousers with a fluid drape and high waist for modern western tailoring.',
  },
  {
    index: 40,
    slug: 'navy-a-line-midi-skirt',
    name: 'Navy A-Line Midi Skirt',
    price: 1890,
    group: 'bottoms-skirts',
    colors: ['Navy'],
    description: 'Navy A-line midi skirt with a structured waistband and smooth hang for flat-lay edits.',
  },
  {
    index: 41,
    slug: 'olive-straight-leg-trousers',
    name: 'Olive Straight-Leg Trousers',
    price: 2150,
    group: 'bottoms-skirts',
    colors: ['Olive'],
    description: 'Olive straight-leg trousers with a tailored hip and clean hem for everyday polish.',
  },
  {
    index: 42,
    slug: 'charcoal-wrap-midi-skirt',
    name: 'Charcoal Wrap Midi Skirt',
    price: 2050,
    group: 'bottoms-skirts',
    colors: ['Charcoal'],
    description: 'Charcoal wrap midi skirt with an adjustable tie and soft crepe handfeel.',
  },
  {
    index: 43,
    slug: 'cream-tailored-ankle-trousers',
    name: 'Cream Tailored Ankle Trousers',
    price: 2250,
    group: 'bottoms-skirts',
    colors: ['Cream'],
    description: 'Cream ankle-length trousers with a slim tailored leg and pressed crease finish.',
    featured: true,
  },
  {
    index: 44,
    slug: 'rust-bias-cut-skirt',
    name: 'Rust Bias-Cut Skirt',
    price: 1950,
    group: 'bottoms-skirts',
    colors: ['Rust'],
    description: 'Rust bias-cut skirt with a fluid swing and soft satin-back lining for evening wear.',
  },
  {
    index: 45,
    slug: 'slate-paperbag-trousers',
    name: 'Slate Paperbag Trousers',
    price: 2120,
    group: 'bottoms-skirts',
    colors: ['Slate'],
    description: 'Slate paperbag-waist trousers with a soft gather and tapered ankle for western workwear.',
  },
  {
    index: 46,
    slug: 'black-pencil-midi-skirt',
    name: 'Black Pencil Midi Skirt',
    price: 1850,
    group: 'bottoms-skirts',
    colors: ['Black'],
    description: 'Black pencil midi skirt with a clean back vent and structured waist for sharp silhouettes.',
  },
  {
    index: 47,
    slug: 'taupe-flare-trousers',
    name: 'Taupe Flare Trousers',
    price: 2350,
    group: 'bottoms-skirts',
    colors: ['Taupe'],
    description: 'Taupe flare trousers with a high rise and soft kick hem for elevated western bottoms.',
  },
  {
    index: 48,
    slug: 'blush-tiered-midi-skirt',
    name: 'Blush Tiered Midi Skirt',
    price: 1980,
    group: 'bottoms-skirts',
    colors: ['Blush'],
    description: 'Blush tiered midi skirt with light cotton tiers and an easy elastic waist.',
  },
  {
    index: 49,
    slug: 'ink-tailored-wide-trousers',
    name: 'Ink Tailored Wide Trousers',
    price: 2390,
    group: 'bottoms-skirts',
    colors: ['Ink'],
    description: 'Ink tailored wide trousers with a floating drape and pressed front for formal western looks.',
  },
  {
    index: 50,
    slug: 'stone-slit-midi-skirt',
    name: 'Stone Slit Midi Skirt',
    price: 1920,
    group: 'bottoms-skirts',
    colors: ['Stone'],
    description: 'Stone midi skirt with a discreet side slit and smooth waistband for clean mannequin display.',
    featured: true,
  },
]

export const westernOutfitsCollectionProducts: WesternOutfitProduct[] =
  WESTERN_OUTFIT_SEEDS.map(createWesternOutfit)

export const WESTERN_LISTING_FILTER_OPTIONS: Array<{
  value: WesternListingFilter
  label: string
  countLabel?: boolean
}> = [
  { value: 'all', label: 'All Western', countLabel: true },
  { value: 'tops-blouses', label: 'Tops & Blouses' },
  { value: 'shorts-denim', label: 'Shorts & Denim' },
  { value: 'bottoms-skirts', label: 'Bottoms & Skirts' },
]

export function getWesternOutfitProductBySlug(slug: string): WesternOutfitProduct | undefined {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return westernOutfitsCollectionProducts.find(
    (product) => product.slug === normalized || String(product.id) === normalized || product.sku.toLowerCase() === normalized,
  )
}

export function isWesternOutfitProduct(
  product: Pick<ShopProduct, 'name' | 'slug' | 'category'> & { tags?: string[] },
) {
  const tags = (product.tags ?? []).map((tag) => tag.trim().toLowerCase())
  if (tags.includes('western-outfits') || tags.includes('western')) {
    return true
  }

  const text = [product.name, product.slug, product.category].join(' ').toLowerCase()
  return /western[\s_-]?outfit|western-outfits|womens?[\s_-]?western/.test(text)
}

export function inferWesternOutfitGroup(product: ShopProduct): WesternOutfitGroup {
  const tagged = product as WesternOutfitFields
  if (
    tagged.westernGroup === 'tops-blouses' ||
    tagged.westernGroup === 'shorts-denim' ||
    tagged.westernGroup === 'bottoms-skirts'
  ) {
    return tagged.westernGroup
  }

  const tags = (tagged.tags ?? []).map((tag) => tag.trim().toLowerCase())
  if (tags.includes('tops-blouses')) return 'tops-blouses'
  if (tags.includes('shorts-denim')) return 'shorts-denim'
  if (tags.includes('bottoms-skirts')) return 'bottoms-skirts'

  const haystack = [product.name, product.slug, product.category, product.description, ...(tagged.tags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (/short|denim short|bermuda|cut-?off/.test(haystack)) {
    return 'shorts-denim'
  }

  if (/skirt|trouser|pant|cigarette|wide-?leg|pencil|midi skirt|flare/.test(haystack)) {
    return 'bottoms-skirts'
  }

  return 'tops-blouses'
}

export function matchesWesternListingFilter(product: ShopProduct, filter: WesternListingFilter) {
  if (filter === 'all') {
    return true
  }

  return inferWesternOutfitGroup(product) === filter
}

export function mergeWesternOutfitsCatalog(liveProducts: ShopProduct[]): ShopProduct[] {
  const taken = new Set(
    liveProducts.map((product) => product.slug.trim().toLowerCase()).filter(Boolean),
  )

  const extras = westernOutfitsCollectionProducts.filter(
    (product) => !taken.has(product.slug.toLowerCase()),
  )

  return extras.length ? [...liveProducts, ...extras] : liveProducts
}
