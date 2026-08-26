import { formatBDT } from '../utils/currency'
import type { ShopProduct } from './shopData'

export const KURTIS_LISTING_PATH = '/women?sub=kurti'
export const KURTI_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const
export const KURTI_IMAGE_DIR = '/images/products/kurtis'
export const KURTI_PAGE_SIZE = 24

export interface KurtiProduct extends ShopProduct {
  sku: string
  fabric: string
  style: KurtiStyle
  inStock: boolean
  tags: string[]
}

export type KurtiStyle =
  | 'anarkali'
  | 'straight'
  | 'a-line'
  | 'chikankari'
  | 'printed'
  | 'embroidered'
  | 'short'
  | 'long'

type KurtiSeed = {
  slug: string
  name: string
  price: number
  colors: string[]
  fabric: string
  style: KurtiStyle
  description: string
  featured?: boolean
  newArrival?: boolean
  stock?: number
}

function padIndex(index: number) {
  return String(index).padStart(3, '0')
}

function kurtiImage(index: number) {
  return `${KURTI_IMAGE_DIR}/kurti-${padIndex(index)}.jpg`
}

function createKurti(index: number, seed: KurtiSeed): KurtiProduct {
  const image = kurtiImage(index)
  const sku = `KRT-${padIndex(index)}`

  return {
    id: `kurti-${padIndex(index)}`,
    sku,
    slug: seed.slug,
    name: seed.name,
    price: formatBDT(seed.price),
    category: 'kurti',
    brand: 'SHIS Fashion',
    image,
    galleryImages: [image],
    description: seed.description,
    sizes: [...KURTI_SIZES],
    colors: seed.colors,
    stock: seed.stock ?? 14 + (index % 9),
    featured: Boolean(seed.featured),
    newArrival: seed.newArrival ?? index <= 24,
    fabric: seed.fabric,
    style: seed.style,
    inStock: true,
    tags: ['kurti', 'women', seed.style, seed.fabric.toLowerCase().replace(/\s+/g, '-')],
  }
}

/**
 * 100 realistic Indian women's kurti titles — mapped 1:1 to kurti-001.jpg … kurti-100.jpg.
 * Prices are BDT retail ranges typical for mid-premium ethnic wear.
 */
const KURTI_SEEDS: KurtiSeed[] = [
  { slug: 'floral-printed-anarkali-kurti', name: 'Floral Printed Anarkali Kurti', price: 2190, colors: ['Rose', 'Ivory'], fabric: 'Rayon', style: 'anarkali', description: 'Flared anarkali silhouette with soft floral print and a light everyday drape.', featured: true, newArrival: true },
  { slug: 'embroidered-straight-rayon-kurti', name: 'Embroidered Straight Rayon Kurti', price: 1890, colors: ['Navy'], fabric: 'Rayon', style: 'embroidered', description: 'Clean straight cut with tonal embroidery along the yoke and cuffs.' },
  { slug: 'chikankari-cotton-kurti', name: 'Chikankari Cotton Kurti', price: 2490, colors: ['White', 'Mint'], fabric: 'Cotton', style: 'chikankari', description: 'Hand-feel chikankari motifs on breathable cotton for polished daywear.', featured: true },
  { slug: 'mustard-block-print-a-line-kurti', name: 'Mustard Block Print A-Line Kurti', price: 1790, colors: ['Mustard'], fabric: 'Cotton', style: 'a-line', description: 'Warm mustard block print with an easy A-line sweep.' },
  { slug: 'maroon-mirror-work-kurti', name: 'Maroon Mirror Work Kurti', price: 2690, colors: ['Maroon'], fabric: 'Georgette', style: 'embroidered', description: 'Festive maroon kurti with subtle mirror accents and soft georgette fall.', featured: true },
  { slug: 'indigo-tie-dye-straight-kurti', name: 'Indigo Tie-Dye Straight Kurti', price: 1690, colors: ['Indigo'], fabric: 'Cotton', style: 'straight', description: 'Artisan indigo tie-dye on a straight silhouette for casual ethnic edits.' },
  { slug: 'peach-chanderi-anarkali-kurti', name: 'Peach Chanderi Anarkali Kurti', price: 2890, colors: ['Peach'], fabric: 'Chanderi', style: 'anarkali', description: 'Airy peach chanderi with a graceful anarkali flare and soft sheen.', featured: true, newArrival: true },
  { slug: 'olive-printed-short-kurti', name: 'Olive Printed Short Kurti', price: 1490, colors: ['Olive'], fabric: 'Cotton', style: 'short', description: 'Compact short kurti with olive botanical print for layered looks.' },
  { slug: 'ivory-lucknowi-chikankari-kurti', name: 'Ivory Lucknowi Chikankari Kurti', price: 2790, colors: ['Ivory'], fabric: 'Cotton', style: 'chikankari', description: 'Classic ivory Lucknowi embroidery on a soft cotton body.', featured: true },
  { slug: 'teal-embroidered-long-kurti', name: 'Teal Embroidered Long Kurti', price: 2390, colors: ['Teal'], fabric: 'Rayon', style: 'long', description: 'Floor-skimming teal kurti with delicate front panel embroidery.' },
  { slug: 'coral-bandhani-print-kurti', name: 'Coral Bandhani Print Kurti', price: 1890, colors: ['Coral'], fabric: 'Georgette', style: 'printed', description: 'Vibrant coral bandhani print with a light festive finish.' },
  { slug: 'black-sequin-yoke-straight-kurti', name: 'Black Sequin Yoke Straight Kurti', price: 2590, colors: ['Black'], fabric: 'Rayon', style: 'straight', description: 'Sleek black straight kurti with a refined sequin yoke.', featured: true },
  { slug: 'lavender-floral-a-line-kurti', name: 'Lavender Floral A-Line Kurti', price: 1750, colors: ['Lavender'], fabric: 'Cotton', style: 'a-line', description: 'Soft lavender florals on an A-line cut for breezy daytime wear.' },
  { slug: 'rust-ikat-print-kurti', name: 'Rust Ikat Print Kurti', price: 1990, colors: ['Rust'], fabric: 'Cotton', style: 'printed', description: 'Rust ikat motifs with a relaxed straight body and side slits.' },
  { slug: 'mint-green-embroidered-kurti', name: 'Mint Green Embroidered Kurti', price: 2090, colors: ['Mint'], fabric: 'Cotton', style: 'embroidered', description: 'Fresh mint cotton with delicate white thread embroidery.' },
  { slug: 'wine-velvet-trim-anarkali-kurti', name: 'Wine Velvet Trim Anarkali Kurti', price: 2990, colors: ['Wine'], fabric: 'Velvet Blend', style: 'anarkali', description: 'Deep wine anarkali with velvet-trimmed neckline for evening wear.', featured: true },
  { slug: 'sky-blue-chikankari-kurti', name: 'Sky Blue Chikankari Kurti', price: 2450, colors: ['Sky Blue'], fabric: 'Cotton', style: 'chikankari', description: 'Airy sky-blue chikankari with classic shadow-work detail.' },
  { slug: 'beige-linen-straight-kurti', name: 'Beige Linen Straight Kurti', price: 1890, colors: ['Beige'], fabric: 'Linen', style: 'straight', description: 'Natural beige linen with a tailored straight silhouette.' },
  { slug: 'magenta-printed-anarkali-kurti', name: 'Magenta Printed Anarkali Kurti', price: 2290, colors: ['Magenta'], fabric: 'Georgette', style: 'anarkali', description: 'Bold magenta print with a fluid anarkali flare.', newArrival: true },
  { slug: 'grey-pin-tuck-short-kurti', name: 'Grey Pin-Tuck Short Kurti', price: 1590, colors: ['Grey'], fabric: 'Cotton', style: 'short', description: 'Modern grey short kurti with pin-tuck front detailing.' },
  { slug: 'emerald-zari-border-kurti', name: 'Emerald Zari Border Kurti', price: 2690, colors: ['Emerald'], fabric: 'Silk Blend', style: 'embroidered', description: 'Emerald kurti finished with a slim zari border for festive polish.', featured: true },
  { slug: 'cream-gota-patti-kurti', name: 'Cream Gota Patti Kurti', price: 2550, colors: ['Cream'], fabric: 'Cotton Silk', style: 'embroidered', description: 'Cream base with delicate gota patti accents along the hem.' },
  { slug: 'turquoise-printed-long-kurti', name: 'Turquoise Printed Long Kurti', price: 2150, colors: ['Turquoise'], fabric: 'Rayon', style: 'long', description: 'Long turquoise print kurti with side slits for easy movement.' },
  { slug: 'pink-floral-chikankari-kurti', name: 'Pink Floral Chikankari Kurti', price: 2650, colors: ['Pink'], fabric: 'Cotton', style: 'chikankari', description: 'Soft pink cotton with floral chikankari all-over craft.', featured: true, newArrival: true },
  { slug: 'navy-geometric-print-kurti', name: 'Navy Geometric Print Kurti', price: 1690, colors: ['Navy'], fabric: 'Cotton', style: 'printed', description: 'Navy geometric print on a structured straight cut.' },
  { slug: 'saffron-block-print-a-line-kurti', name: 'Saffron Block Print A-Line Kurti', price: 1850, colors: ['Saffron'], fabric: 'Cotton', style: 'a-line', description: 'Saffron block print A-line kurti with artisan edge.' },
  { slug: 'charcoal-embroidered-straight-kurti', name: 'Charcoal Embroidered Straight Kurti', price: 1990, colors: ['Charcoal'], fabric: 'Rayon', style: 'embroidered', description: 'Charcoal straight kurti with minimal tonal embroidery.' },
  { slug: 'fuchsia-anarkali-kurti', name: 'Fuchsia Anarkali Kurti', price: 2390, colors: ['Fuchsia'], fabric: 'Georgette', style: 'anarkali', description: 'Statement fuchsia anarkali with soft gathers and a clean neckline.', featured: true },
  { slug: 'white-cotton-lace-kurti', name: 'White Cotton Lace Kurti', price: 1790, colors: ['White'], fabric: 'Cotton', style: 'short', description: 'Crisp white cotton with lace-trimmed hem for summer layering.' },
  { slug: 'bronze-foil-print-kurti', name: 'Bronze Foil Print Kurti', price: 2090, colors: ['Bronze', 'Black'], fabric: 'Rayon', style: 'printed', description: 'Bronze foil motifs on a deep base for evening ethnic wear.' },
  { slug: 'sage-green-linen-kurti', name: 'Sage Green Linen Kurti', price: 1950, colors: ['Sage'], fabric: 'Linen', style: 'straight', description: 'Breathable sage linen with a refined straight profile.' },
  { slug: 'royal-blue-embroidered-kurti', name: 'Royal Blue Embroidered Kurti', price: 2490, colors: ['Royal Blue'], fabric: 'Silk Blend', style: 'embroidered', description: 'Royal blue kurti with gold-thread embroidery on the yoke.', featured: true },
  { slug: 'apricot-printed-a-line-kurti', name: 'Apricot Printed A-Line Kurti', price: 1720, colors: ['Apricot'], fabric: 'Cotton', style: 'a-line', description: 'Soft apricot floral print with a flattering A-line cut.' },
  { slug: 'plum-velvet-yoke-kurti', name: 'Plum Velvet Yoke Kurti', price: 2750, colors: ['Plum'], fabric: 'Velvet Blend', style: 'straight', description: 'Plum kurti with a velvet yoke detail for winter festivities.' },
  { slug: 'aqua-chikankari-long-kurti', name: 'Aqua Chikankari Long Kurti', price: 2850, colors: ['Aqua'], fabric: 'Cotton', style: 'chikankari', description: 'Long aqua chikankari kurti with airy sleeve volume.', newArrival: true },
  { slug: 'coffee-brown-straight-kurti', name: 'Coffee Brown Straight Kurti', price: 1650, colors: ['Coffee'], fabric: 'Cotton', style: 'straight', description: 'Coffee brown everyday kurti with clean lines and side slits.' },
  { slug: 'lemon-yellow-printed-kurti', name: 'Lemon Yellow Printed Kurti', price: 1590, colors: ['Lemon'], fabric: 'Cotton', style: 'printed', description: 'Bright lemon print for sunny daytime ethnic looks.' },
  { slug: 'silver-grey-anarkali-kurti', name: 'Silver Grey Anarkali Kurti', price: 2590, colors: ['Silver Grey'], fabric: 'Georgette', style: 'anarkali', description: 'Elegant silver-grey anarkali with soft shimmer.', featured: true },
  { slug: 'terracotta-block-print-kurti', name: 'Terracotta Block Print Kurti', price: 1890, colors: ['Terracotta'], fabric: 'Cotton', style: 'printed', description: 'Terracotta block print with artisan border accents.' },
  { slug: 'pearl-white-embroidered-kurti', name: 'Pearl White Embroidered Kurti', price: 2290, colors: ['Pearl'], fabric: 'Cotton Silk', style: 'embroidered', description: 'Pearl-white base with refined thread embroidery.' },
  { slug: 'jade-green-straight-kurti', name: 'Jade Green Straight Kurti', price: 1790, colors: ['Jade'], fabric: 'Rayon', style: 'straight', description: 'Jade green straight kurti with a modern mandarin collar.' },
  { slug: 'blush-pink-a-line-kurti', name: 'Blush Pink A-Line Kurti', price: 1850, colors: ['Blush'], fabric: 'Cotton', style: 'a-line', description: 'Blush pink A-line kurti with soft gathers at the waist.' },
  { slug: 'deep-purple-chikankari-kurti', name: 'Deep Purple Chikankari Kurti', price: 2690, colors: ['Purple'], fabric: 'Cotton', style: 'chikankari', description: 'Deep purple cotton with classic white chikankari work.', featured: true },
  { slug: 'amber-gold-printed-kurti', name: 'Amber Gold Printed Kurti', price: 1990, colors: ['Amber'], fabric: 'Georgette', style: 'printed', description: 'Amber-gold print with a light festive georgette finish.' },
  { slug: 'forest-green-long-kurti', name: 'Forest Green Long Kurti', price: 2150, colors: ['Forest Green'], fabric: 'Rayon', style: 'long', description: 'Long forest-green kurti for elegant everyday ethnic wear.' },
  { slug: 'lilac-embroidered-short-kurti', name: 'Lilac Embroidered Short Kurti', price: 1690, colors: ['Lilac'], fabric: 'Cotton', style: 'short', description: 'Lilac short kurti with delicate floral embroidery.' },
  { slug: 'crimson-anarkali-kurti', name: 'Crimson Anarkali Kurti', price: 2490, colors: ['Crimson'], fabric: 'Georgette', style: 'anarkali', description: 'Crimson flared anarkali for festive and wedding guest edits.', featured: true, newArrival: true },
  { slug: 'sand-beige-chikankari-kurti', name: 'Sand Beige Chikankari Kurti', price: 2550, colors: ['Sand'], fabric: 'Cotton', style: 'chikankari', description: 'Sand beige chikankari with a soft neutral palette.' },
  { slug: 'electric-blue-printed-kurti', name: 'Electric Blue Printed Kurti', price: 1750, colors: ['Electric Blue'], fabric: 'Cotton', style: 'printed', description: 'Electric blue print for bold daytime styling.' },
  { slug: 'mauve-straight-rayon-kurti', name: 'Mauve Straight Rayon Kurti', price: 1820, colors: ['Mauve'], fabric: 'Rayon', style: 'straight', description: 'Mauve rayon straight kurti with a silky everyday finish.' },
  { slug: 'gold-zardozi-yoke-kurti', name: 'Gold Zardozi Yoke Kurti', price: 3190, colors: ['Ivory', 'Gold'], fabric: 'Silk Blend', style: 'embroidered', description: 'Ivory silk-blend kurti with gold zardozi yoke detailing.', featured: true },
  { slug: 'seafoam-printed-a-line-kurti', name: 'Seafoam Printed A-Line Kurti', price: 1710, colors: ['Seafoam'], fabric: 'Cotton', style: 'a-line', description: 'Seafoam print A-line kurti for cool summer days.' },
  { slug: 'burgundy-long-embroidered-kurti', name: 'Burgundy Long Embroidered Kurti', price: 2590, colors: ['Burgundy'], fabric: 'Rayon', style: 'long', description: 'Burgundy long kurti with front embroidered panel.' },
  { slug: 'pastel-yellow-chikankari-kurti', name: 'Pastel Yellow Chikankari Kurti', price: 2480, colors: ['Pastel Yellow'], fabric: 'Cotton', style: 'chikankari', description: 'Pastel yellow chikankari with soft shadow embroidery.' },
  { slug: 'slate-blue-straight-kurti', name: 'Slate Blue Straight Kurti', price: 1680, colors: ['Slate Blue'], fabric: 'Cotton', style: 'straight', description: 'Slate blue everyday straight kurti with clean finishing.' },
  { slug: 'rose-quartz-anarkali-kurti', name: 'Rose Quartz Anarkali Kurti', price: 2350, colors: ['Rose Quartz'], fabric: 'Georgette', style: 'anarkali', description: 'Rose quartz anarkali with soft romantic flare.', newArrival: true },
  { slug: 'copper-block-print-kurti', name: 'Copper Block Print Kurti', price: 1920, colors: ['Copper'], fabric: 'Cotton', style: 'printed', description: 'Copper block print with traditional border framing.' },
  { slug: 'ivory-embroidered-a-line-kurti', name: 'Ivory Embroidered A-Line Kurti', price: 2250, colors: ['Ivory'], fabric: 'Cotton', style: 'a-line', description: 'Ivory A-line kurti with subtle tonal embroidery.', featured: true },
  { slug: 'midnight-blue-short-kurti', name: 'Midnight Blue Short Kurti', price: 1550, colors: ['Midnight Blue'], fabric: 'Cotton', style: 'short', description: 'Midnight blue short kurti for easy pairing with jeans or palazzo.' },
  { slug: 'pistachio-chikankari-kurti', name: 'Pistachio Chikankari Kurti', price: 2620, colors: ['Pistachio'], fabric: 'Cotton', style: 'chikankari', description: 'Pistachio green chikankari with fresh seasonal colour.', featured: true },
  { slug: 'ruby-red-printed-kurti', name: 'Ruby Red Printed Kurti', price: 1880, colors: ['Ruby'], fabric: 'Rayon', style: 'printed', description: 'Ruby red print kurti with a lively festive character.' },
  { slug: 'ash-grey-linen-kurti', name: 'Ash Grey Linen Kurti', price: 1980, colors: ['Ash Grey'], fabric: 'Linen', style: 'straight', description: 'Ash grey linen for structured minimal ethnic wear.' },
  { slug: 'orchid-purple-anarkali-kurti', name: 'Orchid Purple Anarkali Kurti', price: 2450, colors: ['Orchid'], fabric: 'Georgette', style: 'anarkali', description: 'Orchid purple anarkali with soft layered volume.' },
  { slug: 'honey-gold-embroidered-kurti', name: 'Honey Gold Embroidered Kurti', price: 2720, colors: ['Honey'], fabric: 'Silk Blend', style: 'embroidered', description: 'Honey gold kurti with delicate embroidered motifs.', featured: true },
  { slug: 'celadon-printed-long-kurti', name: 'Celadon Printed Long Kurti', price: 2080, colors: ['Celadon'], fabric: 'Rayon', style: 'long', description: 'Celadon print long kurti for refined everyday draping.' },
  { slug: 'cherry-blossom-a-line-kurti', name: 'Cherry Blossom A-Line Kurti', price: 1760, colors: ['Cherry'], fabric: 'Cotton', style: 'a-line', description: 'Cherry blossom print on a soft A-line body.' },
  { slug: 'onyx-black-chikankari-kurti', name: 'Onyx Black Chikankari Kurti', price: 2790, colors: ['Black'], fabric: 'Cotton', style: 'chikankari', description: 'Onyx black chikankari with contrasting white threadwork.', featured: true },
  { slug: 'tangerine-printed-short-kurti', name: 'Tangerine Printed Short Kurti', price: 1520, colors: ['Tangerine'], fabric: 'Cotton', style: 'short', description: 'Tangerine print short kurti for bright casual styling.' },
  { slug: 'smoke-lilac-straight-kurti', name: 'Smoke Lilac Straight Kurti', price: 1810, colors: ['Smoke Lilac'], fabric: 'Rayon', style: 'straight', description: 'Smoke lilac straight kurti with a modern soft finish.' },
  { slug: 'champagne-anarkali-kurti', name: 'Champagne Anarkali Kurti', price: 2890, colors: ['Champagne'], fabric: 'Georgette', style: 'anarkali', description: 'Champagne anarkali with elegant sheen for occasions.', featured: true, newArrival: true },
  { slug: 'indigo-chikankari-kurti', name: 'Indigo Chikankari Kurti', price: 2580, colors: ['Indigo'], fabric: 'Cotton', style: 'chikankari', description: 'Indigo cotton with traditional white chikankari motifs.' },
  { slug: 'marigold-printed-kurti', name: 'Marigold Printed Kurti', price: 1670, colors: ['Marigold'], fabric: 'Cotton', style: 'printed', description: 'Marigold print kurti inspired by festive florals.' },
  { slug: 'steel-blue-embroidered-kurti', name: 'Steel Blue Embroidered Kurti', price: 2120, colors: ['Steel Blue'], fabric: 'Rayon', style: 'embroidered', description: 'Steel blue kurti with refined front embroidery.' },
  { slug: 'almond-linen-a-line-kurti', name: 'Almond Linen A-Line Kurti', price: 2050, colors: ['Almond'], fabric: 'Linen', style: 'a-line', description: 'Almond linen A-line kurti for breathable elegance.' },
  { slug: 'scarlet-long-kurti', name: 'Scarlet Long Kurti', price: 2220, colors: ['Scarlet'], fabric: 'Rayon', style: 'long', description: 'Scarlet long kurti with a clean festive presence.' },
  { slug: 'pearl-blush-chikankari-kurti', name: 'Pearl Blush Chikankari Kurti', price: 2680, colors: ['Pearl Blush'], fabric: 'Cotton', style: 'chikankari', description: 'Pearl blush chikankari with soft romantic detailing.', featured: true },
  { slug: 'graphite-straight-kurti', name: 'Graphite Straight Kurti', price: 1640, colors: ['Graphite'], fabric: 'Cotton', style: 'straight', description: 'Graphite grey straight kurti for minimal everyday wear.' },
  { slug: 'sunset-orange-anarkali-kurti', name: 'Sunset Orange Anarkali Kurti', price: 2380, colors: ['Sunset Orange'], fabric: 'Georgette', style: 'anarkali', description: 'Sunset orange anarkali with a lively festive flare.', newArrival: true },
  { slug: 'moss-green-printed-kurti', name: 'Moss Green Printed Kurti', price: 1730, colors: ['Moss'], fabric: 'Cotton', style: 'printed', description: 'Moss green botanical print for earthy ethnic styling.' },
  { slug: 'dusty-rose-embroidered-kurti', name: 'Dusty Rose Embroidered Kurti', price: 2180, colors: ['Dusty Rose'], fabric: 'Cotton', style: 'embroidered', description: 'Dusty rose kurti with delicate floral embroidery.' },
  { slug: 'arctic-white-short-kurti', name: 'Arctic White Short Kurti', price: 1480, colors: ['Arctic White'], fabric: 'Cotton', style: 'short', description: 'Arctic white short kurti for crisp summer layering.' },
  { slug: 'sapphire-straight-kurti', name: 'Sapphire Straight Kurti', price: 1860, colors: ['Sapphire'], fabric: 'Rayon', style: 'straight', description: 'Sapphire straight kurti with polished everyday colour.' },
  { slug: 'mehendi-green-anarkali-kurti', name: 'Mehendi Green Anarkali Kurti', price: 2520, colors: ['Mehendi'], fabric: 'Georgette', style: 'anarkali', description: 'Mehendi green anarkali suited for wedding season looks.', featured: true },
  { slug: 'buttercream-chikankari-kurti', name: 'Buttercream Chikankari Kurti', price: 2540, colors: ['Buttercream'], fabric: 'Cotton', style: 'chikankari', description: 'Buttercream chikankari with soft tonal embroidery.' },
  { slug: 'cinnamon-block-print-kurti', name: 'Cinnamon Block Print Kurti', price: 1910, colors: ['Cinnamon'], fabric: 'Cotton', style: 'printed', description: 'Cinnamon block print with warm artisan character.' },
  { slug: 'ice-blue-a-line-kurti', name: 'Ice Blue A-Line Kurti', price: 1770, colors: ['Ice Blue'], fabric: 'Cotton', style: 'a-line', description: 'Ice blue A-line kurti for cool, light styling.' },
  { slug: 'garnet-embroidered-long-kurti', name: 'Garnet Embroidered Long Kurti', price: 2660, colors: ['Garnet'], fabric: 'Silk Blend', style: 'long', description: 'Garnet long kurti with rich embroidered accents.', featured: true },
  { slug: 'soft-coral-straight-kurti', name: 'Soft Coral Straight Kurti', price: 1700, colors: ['Soft Coral'], fabric: 'Rayon', style: 'straight', description: 'Soft coral straight kurti for warm-weather ease.' },
  { slug: 'opal-white-anarkali-kurti', name: 'Opal White Anarkali Kurti', price: 2420, colors: ['Opal'], fabric: 'Georgette', style: 'anarkali', description: 'Opal white anarkali with a luminous festive drape.', newArrival: true },
  { slug: 'fern-green-chikankari-kurti', name: 'Fern Green Chikankari Kurti', price: 2610, colors: ['Fern'], fabric: 'Cotton', style: 'chikankari', description: 'Fern green chikankari with crisp white motifs.' },
  { slug: 'mulberry-printed-kurti', name: 'Mulberry Printed Kurti', price: 1840, colors: ['Mulberry'], fabric: 'Cotton', style: 'printed', description: 'Mulberry print kurti with a rich seasonal tone.' },
  { slug: 'cloud-grey-embroidered-kurti', name: 'Cloud Grey Embroidered Kurti', price: 2070, colors: ['Cloud Grey'], fabric: 'Rayon', style: 'embroidered', description: 'Cloud grey kurti with soft tonal embroidery.' },
  { slug: 'papaya-short-print-kurti', name: 'Papaya Short Print Kurti', price: 1510, colors: ['Papaya'], fabric: 'Cotton', style: 'short', description: 'Papaya print short kurti for playful casual pairing.' },
  { slug: 'azure-long-kurti', name: 'Azure Long Kurti', price: 2140, colors: ['Azure'], fabric: 'Rayon', style: 'long', description: 'Azure long kurti with an easy, elegant line.' },
  { slug: 'silk-ivory-a-line-kurti', name: 'Silk Ivory A-Line Kurti', price: 2780, colors: ['Ivory'], fabric: 'Silk Blend', style: 'a-line', description: 'Silk-ivory A-line kurti with a premium soft sheen.', featured: true },
  { slug: 'raspberry-anarkali-kurti', name: 'Raspberry Anarkali Kurti', price: 2470, colors: ['Raspberry'], fabric: 'Georgette', style: 'anarkali', description: 'Raspberry anarkali with vibrant festive energy.' },
  { slug: 'seafoam-chikankari-kurti', name: 'Seafoam Chikankari Kurti', price: 2570, colors: ['Seafoam'], fabric: 'Cotton', style: 'chikankari', description: 'Seafoam chikankari for a cool, refined look.' },
  { slug: 'walnut-straight-kurti', name: 'Walnut Straight Kurti', price: 1660, colors: ['Walnut'], fabric: 'Cotton', style: 'straight', description: 'Walnut brown straight kurti for grounded everyday wear.' },
  { slug: 'flamingo-printed-kurti', name: 'Flamingo Printed Kurti', price: 1740, colors: ['Flamingo'], fabric: 'Cotton', style: 'printed', description: 'Flamingo print kurti with lively floral energy.', newArrival: true },
  { slug: 'obsidian-embroidered-kurti', name: 'Obsidian Embroidered Kurti', price: 2710, colors: ['Obsidian'], fabric: 'Silk Blend', style: 'embroidered', description: 'Obsidian black embroidered kurti for evening ethnic polish.', featured: true },
]

if (KURTI_SEEDS.length !== 100) {
  throw new Error(`Expected 100 kurti seeds, found ${KURTI_SEEDS.length}`)
}

export const kurtisCollectionProducts: KurtiProduct[] = KURTI_SEEDS.map((seed, offset) =>
  createKurti(offset + 1, seed),
)

export function getKurtiProductBySlug(slug: string): KurtiProduct | undefined {
  const normalized = slug.trim().toLowerCase()
  if (!normalized) {
    return undefined
  }

  return kurtisCollectionProducts.find(
    (product) =>
      product.slug === normalized ||
      String(product.id) === normalized ||
      product.sku.toLowerCase() === normalized,
  )
}

export function isKurtiProduct(
  product: Pick<ShopProduct, 'name' | 'slug' | 'category'> & { tags?: string[] },
) {
  const tags = (product.tags ?? []).map((tag) => tag.trim().toLowerCase())
  if (tags.includes('kurti') || tags.includes('kurtis')) {
    return true
  }

  const text = [product.name, product.slug, product.category].join(' ').toLowerCase()
  return /\bkurti\b|\bkurtis\b|\banarkali\b|\bchikankari\b/.test(text)
}

export function mergeKurtisCatalog(liveProducts: ShopProduct[]): ShopProduct[] {
  const taken = new Set(
    liveProducts.map((product) => product.slug.trim().toLowerCase()).filter(Boolean),
  )

  const extras = kurtisCollectionProducts.filter(
    (product) => !taken.has(product.slug.toLowerCase()),
  )

  return extras.length ? [...liveProducts, ...extras] : liveProducts
}
