/**
 * Scan public/images/products/kurtis/ and generate src/data/kurtisCatalog.generated.ts
 *
 * Usage: node scripts/generate-kurtis-catalog.mjs
 */
import { readdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const KURTI_DIR = join(root, 'public', 'images', 'products', 'kurtis')
const OUT_FILE = join(root, 'src', 'data', 'kurtisCatalog.generated.ts')
const PUBLIC_PREFIX = '/images/products/kurtis'

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i

const ELEGANT_FALLBACKS = [
  'Classic Embroidered Kurti',
  'Floral Printed Anarkali Kurti',
  'Chikankari Cotton Kurti',
  'Straight Rayon Kurti',
  'Premium Lawn Kurti',
  'Festive Embroidered Kurti',
  'A-Line Cotton Kurti',
  'Designer Party Kurti',
  'Block Print Kurti',
  'Elegant Casual Kurti',
  'Handwork Beaded Kurti',
  'Digital Printed Kurti',
  'Linen Embroidered Kurti',
  'Mirror Work Kurti',
  'Pastel Summer Kurti',
]

const JUNK_PATTERNS = [
  /\s*_\s*Latest Pakistani.*$/i,
  /\s*_\s*Custom Stitched.*$/i,
  /\s*Pakistani Lawn Suits.*$/i,
  /\s*Custom Stitched Pakistan.*$/i,
  /\s*Latest Pakistani Salwar.*$/i,
  /\s*DM to Order.*$/i,
  /‼️.*$/i,
  /\s*LimitedStock.*$/i,
  /\s*_\s*Stylish & Chic by Pink Tulip.*$/i,
  /\s*_\s*Model\s+[A-Z0-9-]+.*$/i,
  /\s*_\s*\d[\d._]* USD.*$/i,
  /\s*Buy Button-Down Cotton Kurta\s*/i,
  /\s*\(\d+\s*pcs?\).*$/i,
  /\s*Size S & M Available.*$/i,
  /\s*WinterCollection.*$/i,
  /\s*RTW 1Pc Printed.*$/i,
]

const SIZE_SUFFIX =
  /\s*[-–]\s*(XXS|XXXL|XXL|XL|XS|S|M|L|Extra Large|Large|Medium|Small)\s*$/i

function shortHash(input) {
  return createHash('sha1').update(input).digest('hex').slice(0, 6)
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function toTitleCase(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 2 && word === word.toUpperCase()) {
        return word
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

function inferStyle(name) {
  const text = name.toLowerCase()
  if (/anarkali|flared/.test(text)) return 'anarkali'
  if (/chikankari|lucknowi/.test(text)) return 'chikankari'
  if (/a-line|a line/.test(text)) return 'a-line'
  if (/short|crop/.test(text)) return 'short'
  if (/long|maxi|farshi/.test(text)) return 'long'
  if (/embroider|handwork|bead|sequin|zari|mirror/.test(text)) return 'embroidered'
  if (/print|block|digital|bandhani|ikat|floral/.test(text)) return 'printed'
  return 'straight'
}

function inferFabric(name) {
  const text = name.toLowerCase()
  if (/linen/.test(text)) return 'Linen'
  if (/khaddar|dobby/.test(text)) return 'Khaddar'
  if (/georgette|chiffon/.test(text)) return 'Georgette'
  if (/silk|luxury/.test(text)) return 'Silk Blend'
  if (/lawn|cambric/.test(text)) return 'Lawn'
  if (/rayon|viscose/.test(text)) return 'Rayon'
  return 'Cotton'
}

function inferColors(name) {
  const text = name.toLowerCase()
  const palette = [
    ['Black', /\bblack\b/],
    ['White', /\bwhite|off-white|off white|porcelain\b/],
    ['Blue', /\bblue|azure|aqua|denim blue|midnight\b/],
    ['Green', /\bgreen|jade|pixie green|sea green\b/],
    ['Red', /\bred|ruby|maroon\b/],
    ['Sand', /\bsand|beige|cream|ivory|off-white\b/],
    ['Pink', /\bpink|rose\b/],
    ['Purple', /\bpurple|violet\b/],
    ['Yellow', /\byellow|amber|mustard|saffron\b/],
  ]

  const matches = palette.filter(([, pattern]) => pattern.test(text)).map(([color]) => color)
  return matches.length ? matches.slice(0, 2) : ['Multicolour']
}

/**
 * Bangladesh premium retail pricing tiers (numeric BDT; `formatBDT` adds ৳).
 *
 * 1. Daily casual / digital print singles …… 1,300 – 1,550
 * 2. Embroidered / chikankari / handwork ……… 1,850 – 2,350
 *    · Download / premium printed …………… 1,650 – 1,850
 * 3. Two-piece / co-ord sets ………………… 2,050 – 2,650
 *    · Plazzo / palazzo co-ords …………… 2,110 – 2,250
 * 4. Luxury / 3-piece festive ………………… 2,600 – 3,450
 */
function retailStep(min, max, index, step = 50) {
  const span = Math.max(0, max - min)
  const slots = Math.max(1, Math.floor(span / step))
  return min + ((index % (slots + 1)) * step)
}

function inferPrice(name, index, style = 'straight', filename = '') {
  const text = name.toLowerCase().trim()
  const file = filename.toLowerCase()
  const combined = `${text} ${file}`

  // Explicit product overrides
  if (text === 'chikankari cotton kurti') {
    return 2330
  }
  if (text === 'nairah mizyn kurti') {
    return 2180
  }

  // Tier 4 — Luxury / 3-piece festive: ৳2,600 – ৳3,450
  if (
    /\b3\s*piece\b|\b3pc\b|\b3-piece\b|\(\s*3\s*pcs?\s*\)/.test(combined) ||
    /party dress|festive collection/.test(text)
  ) {
    return retailStep(2600, 3450, index, 100)
  }
  if (/luxury/.test(text) && !/\b2\s*piece\b|\b2pc\b|\b2-piece\b|\(\s*2\s*pcs?\s*\)/.test(combined)) {
    return retailStep(2800, 3450, index, 100)
  }

  // Tier 3 — Two-piece / co-ord: ৳2,050 – ৳2,650 (Plazzo ৳2,110 – ৳2,250)
  if (/plazzo|palazzo/.test(combined)) {
    return retailStep(2110, 2250, index, 40)
  }
  if (
    /\b2\s*piece\b|\b2pc\b|\b2-piece\b|\(\s*2\s*pcs?\s*\)|co-?ord|co-order|farshi shalwar/.test(combined) ||
    /\bsuit\b/.test(combined)
  ) {
    return retailStep(2050, 2650, index, 50)
  }

  // Premium printed / Download Kurti: ৳1,650 – ৳1,850
  if (text === 'download kurti' || (/premium/.test(text) && /print/.test(text))) {
    return retailStep(1650, 1850, index, 40)
  }

  // Tier 2 — Heavy handwork / embroidered / chikankari singles: ৳1,850 – ৳2,350
  if (
    style === 'embroidered' ||
    style === 'chikankari' ||
    /embroider|handwork|chikankari|bead|sequin|zari|mirror|nairah/.test(text)
  ) {
    return retailStep(1850, 2350, index, 50)
  }

  // Brand / designer single without embroidery — mid premium printed band
  if (/designer|premium|sana safinaz|amberimran/.test(text)) {
    return retailStep(1650, 1850, index, 40)
  }

  // Tier 1 — Digital printed / daily casual singles: ৳1,300 – ৳1,550
  if (
    style === 'printed' ||
    style === 'a-line' ||
    /digital|print|a-line|casual|block print|summer outfit|beautiful dress/.test(text)
  ) {
    return retailStep(1300, 1550, index, 50)
  }

  // Default daily casual
  return retailStep(1300, 1550, index, 50)
}

function ensureKurtiTitle(title) {
  const trimmed = title.trim()
  if (!trimmed) {
    return 'Elegant Kurti'
  }

  if (/\bkurti\b/i.test(trimmed)) {
    return trimmed.replace(/\s+/g, ' ')
  }

  if (/\b(suit|salwar|anarkali|lawn suit)\b/i.test(trimmed)) {
    return trimmed.replace(/\s+Suit$/i, ' Kurti').replace(/\s+/g, ' ')
  }

  return `${trimmed} Kurti`.replace(/\s+/g, ' ')
}

function cleanFilenameToTitle(filename, index) {
  let base = filename.replace(IMAGE_EXT, '').trim()
  base = base.replace(/\s*\(\d+\)\s*$/g, '').trim()
  base = base.replace(SIZE_SUFFIX, '').trim()

  if (/^download\s*\(\d+\)$/i.test(base) || /^[a-f0-9]{16,}$/i.test(base)) {
    return ELEGANT_FALLBACKS[index % ELEGANT_FALLBACKS.length]
  }

  base = base.replace(/[_|]+/g, ' ')
  for (const pattern of JUNK_PATTERNS) {
    base = base.replace(pattern, '').trim()
  }

  base = base.replace(/\s+/g, ' ').trim()

  if (base.length > 72) {
    const segment = base.split(/\s[-–]\s/)[0]?.trim()
    base = segment && segment.length >= 8 ? segment : base.slice(0, 72).trim()
  }

  return ensureKurtiTitle(toTitleCase(base))
}

function publicImagePath(filename) {
  return `${PUBLIC_PREFIX}/${filename.split('/').map(encodeURIComponent).join('/')}`
}

function buildEntry(filename, index) {
  const name = cleanFilenameToTitle(filename, index)
  const slugBase = slugify(name) || `kurti-${String(index + 1).padStart(3, '0')}`
  const slug = `${slugBase}-${shortHash(filename)}`
  const style = inferStyle(name)
  const fabric = inferFabric(name)
  const colors = inferColors(name)
  const price = inferPrice(name, index, style, filename)
  const image = publicImagePath(filename)
  const sku = `KRT-${String(index + 1).padStart(3, '0')}`
  const description = `${name} in ${fabric.toLowerCase()} — a polished Indian ethnic piece for everyday and festive wear.`

  return {
    filename,
    id: `kurti-${String(index + 1).padStart(3, '0')}`,
    sku,
    slug,
    name,
    price,
    image,
    fabric,
    style,
    colors,
    description,
    featured: index < 8 || /premium|luxury|embroider|designer/i.test(name),
    newArrival: index < 20,
    stock: 12 + (index % 11),
  }
}

function serializeEntry(entry) {
  return `  {
    filename: ${JSON.stringify(entry.filename)},
    id: ${JSON.stringify(entry.id)},
    sku: ${JSON.stringify(entry.sku)},
    slug: ${JSON.stringify(entry.slug)},
    name: ${JSON.stringify(entry.name)},
    price: ${entry.price},
    image: ${JSON.stringify(entry.image)},
    fabric: ${JSON.stringify(entry.fabric)},
    style: ${JSON.stringify(entry.style)},
    colors: ${JSON.stringify(entry.colors)},
    description: ${JSON.stringify(entry.description)},
    featured: ${entry.featured},
    newArrival: ${entry.newArrival},
    stock: ${entry.stock},
  }`
}

const files = (await readdir(KURTI_DIR))
  .filter((file) => IMAGE_EXT.test(file) && file.toLowerCase() !== 'manifest.json')
  .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }))

if (!files.length) {
  console.warn(`No kurti images found in ${KURTI_DIR}`)
}

const entries = files.map((filename, index) => buildEntry(filename, index))

const generatedAt = new Date().toISOString()
const output = `/* eslint-disable */
// AUTO-GENERATED by scripts/generate-kurtis-catalog.mjs — do not edit manually.
// Re-run: npm run generate:kurtis-catalog

export interface GeneratedKurtiCatalogEntry {
  filename: string
  id: string
  sku: string
  slug: string
  name: string
  price: number
  image: string
  fabric: string
  style: string
  colors: string[]
  description: string
  featured: boolean
  newArrival: boolean
  stock: number
}

export const KURTI_CATALOG_GENERATED_AT = ${JSON.stringify(generatedAt)}
export const KURTI_CATALOG_IMAGE_COUNT = ${entries.length}

export const kurtiCatalogEntries: GeneratedKurtiCatalogEntry[] = [
${entries.map(serializeEntry).join(',\n')}
]
`

await writeFile(OUT_FILE, output, 'utf8')

console.log(`Generated ${entries.length} kurti catalog entries → ${OUT_FILE}`)
