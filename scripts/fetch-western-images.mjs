/**
 * Download 50 women's western-wear product / flat-lay images (no human models),
 * convert to lightweight WebP, and save as public/images/western/western-1.webp … western-50.webp.
 *
 * Usage: node scripts/fetch-western-images.mjs
 */
import { mkdir, writeFile, access } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(root, 'public', 'images', 'western')
const WIDTH = 960
const HEIGHT = 1280 // 3:4 portrait for listing cards
const WEBP_QUALITY = 82
const CONCURRENCY = 4

/**
 * Curated Unsplash CDN photo IDs — apparel / flat-lay / hanger / folded garment shots.
 * Prefer product-focused frames without faces. Each maps 1:1 to western-{n}.webp.
 */
const SOURCES = [
  // 1–24 Tops & shirts (crop tops, tanks, casual shirts, blouses)
  { index: 1, id: '1521572163474-6864f9cf17ab', label: 'white tee product' },
  { index: 2, id: '1583743814966-8936f5b7be1a', label: 'black tee flat' },
  { index: 3, id: '1576566588028-4147f3842f27', label: 'stripe shirt' },
  { index: 4, id: '1596755094514-f87e34085b2c', label: 'folded shirt' },
  { index: 5, id: '1620799140408-edc6dcb6d633', label: 'white blouse' },
  { index: 6, id: '1523381210434-271e8be1f52b', label: 'casual apparel hang' },
  { index: 7, id: '1562157873-818bc0726f68', label: 'stacked tees' },
  { index: 8, id: '1618354691373-d851c5c3a990', label: 'black tee hang' },
  { index: 9, id: '1602810318383-e386cc2a3ccf', label: 'casual shirts rack' },
  { index: 10, id: '1489987707025-afc232f7ea0f', label: 'shirts hanging' },
  { index: 11, id: '1529374255404-311a2a4f1fd9', label: 'graphic tee stack' },
  { index: 12, id: '1503342217505-b0a15ec3261c', label: 'tee flat detail' },
  { index: 13, id: '1571945153237-4929e783af4a', label: 'white cotton tee' },
  { index: 14, id: '1544441893-675973e31985', label: 'white shirt fold' },
  { index: 15, id: '1554568218-0f1715e72254', label: 'pastel shirts' },
  { index: 16, id: '1434389677669-e08b4cac3105', label: 'clothes hangers' },
  { index: 17, id: '1479064555552-3ef4979f8908', label: 'folded knit top' },
  { index: 18, id: '1556905055-8f358a7a47b2', label: 'rail of tops' },
  { index: 19, id: '1490481651871-ab68de25d43d', label: 'fashion flat arrangement' },
  { index: 20, id: '1512436991641-6745cdb1723f', label: 'apparel store rack' },
  { index: 21, id: '1441986300917-64674bd600d8', label: 'folded shirts shelf' },
  { index: 22, id: '1558171813-4c088753af8f', label: 'denim shirt hang' },
  { index: 23, id: '1469334031218-e382a71b716b', label: 'blouse detail' },
  { index: 24, id: '1515372039744-b8f02a3ae446', label: 'white top hang' },

  // 25–36 Shorts & denim
  { index: 25, id: '1539109136881-3be0616acf4b', label: 'denim short detail' },
  { index: 26, id: '1541099649105-f69ad21f3246', label: 'denim close' },
  { index: 27, id: '1549298916-b41d501d3772', label: 'footwear denim pairing' },
  { index: 28, id: '1582418702059-97ebafb35d09', label: 'denim jacket' },
  { index: 29, id: '1611312449408-fcece27cdbb7', label: 'denim jacket flat' },
  { index: 30, id: '1604176354204-9268737828e4', label: 'denim detail' },
  { index: 31, id: '1483985988355-763728e1935b', label: 'shopping bag denim edit' },
  { index: 32, id: '1565084888279-aca607ecce0c', label: 'denim wash' },
  { index: 33, id: '1594750823491-e493d067ce3e', label: 'tee and denim shorts flatlay' },
  { index: 34, id: '1608147152875-b0eb0c53d491', label: 'denim shirt product' },
  { index: 35, id: '1617178388553-a9d022974a5c', label: 'jeans belt flatlay' },
  { index: 36, id: '1593030761757-71fae45fa0e7', label: 'jeans shoes flatlay' },

  // 37–50 Bottoms & skirts / trousers
  { index: 37, id: '1509631179647-0177331693ae', label: 'tailored pants' },
  { index: 38, id: '1462392246754-28dfa2df8e6b', label: 'wardrobe trousers hang' },
  { index: 39, id: '1539533018447-63fcce2678e3', label: 'coat trousers edit' },
  { index: 40, id: '1487222477894-8943e31ef7b2', label: 'black pants hang' },
  { index: 41, id: '1552374196-1ab2a1c593e8', label: 'tailored pant texture' },
  { index: 42, id: '1549298916-f52d724204b4', label: 'sneaker pant flat' },
  { index: 43, id: '1574180566232-aaad1b5b8450', label: 'linen pant hang' },
  { index: 44, id: '1556906781-9a412961c28c', label: 'sneakers pants flat' },
  { index: 45, id: '1551028719-00167b16eac5', label: 'jacket bottoms edit' },
  { index: 46, id: '1591047139829-d91aecb6caea', label: 'bomber pant pairing' },
  { index: 47, id: '1594938298603-c8148c4dae35', label: 'suit pant texture' },
  { index: 48, id: '1475180098004-ca77a66827be', label: 'skirt fabric fold' },
  { index: 49, id: '1560243563-062bfc001d68', label: 'clothes rail bottoms' },
  { index: 50, id: '1496747611176-843222e1e57c', label: 'white dress skirt hang' },
]

function unsplashUrl(photoId) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${WIDTH * 2}&h=${HEIGHT * 2}&q=85`
}

async function fileExists(path) {
  try {
    await access(path, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

async function downloadBuffer(url, retries = 3) {
  let lastError
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SHIS-Fashion-ImageFetcher/1.0',
          Accept: 'image/avif,image/webp,image/*,*/*;q=0.8',
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
    }
  }
  throw lastError
}

async function processOne(source, { force = false } = {}) {
  const outPath = join(OUT_DIR, `western-${source.index}.webp`)
  if (!force && (await fileExists(outPath))) {
    const meta = await sharp(outPath).metadata()
    if ((meta.width ?? 0) >= 600 && (meta.height ?? 0) >= 800) {
      return { index: source.index, status: 'skipped', path: outPath }
    }
  }

  const url = unsplashUrl(source.id)
  const raw = await downloadBuffer(url)
  await sharp(raw)
    .rotate()
    .resize(WIDTH, HEIGHT, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: false,
    })
    .webp({ quality: WEBP_QUALITY, effort: 5 })
    .toFile(outPath)

  return { index: source.index, status: 'saved', path: outPath, label: source.label }
}

async function runPool(items, worker, concurrency) {
  const results = []
  let cursor = 0

  async function next() {
    while (cursor < items.length) {
      const current = cursor
      cursor += 1
      results[current] = await worker(items[current])
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()))
  return results
}

const force = process.argv.includes('--force')

await mkdir(OUT_DIR, { recursive: true })

console.log(`Fetching ${SOURCES.length} western product images → ${OUT_DIR}`)
console.log(`Force overwrite: ${force ? 'yes' : 'no'}`)

const results = await runPool(
  SOURCES,
  async (source) => {
    try {
      const result = await processOne(source, { force })
      const mark = result.status === 'saved' ? '✓' : '·'
      console.log(`  ${mark} western-${source.index}.webp (${source.label}) [${result.status}]`)
      return result
    } catch (error) {
      console.error(`  ✗ western-${source.index}.webp FAILED: ${error.message}`)
      return { index: source.index, status: 'error', error: String(error.message) }
    }
  },
  CONCURRENCY,
)

const saved = results.filter((r) => r?.status === 'saved').length
const skipped = results.filter((r) => r?.status === 'skipped').length
const failed = results.filter((r) => r?.status === 'error')

const manifest = {
  generatedAt: new Date().toISOString(),
  outputDir: 'public/images/western',
  count: SOURCES.length,
  saved,
  skipped,
  failed: failed.map((f) => f.index),
  files: SOURCES.map((s) => ({
    index: s.index,
    file: `western-${s.index}.webp`,
    publicPath: `/images/western/western-${s.index}.webp`,
    unsplashId: s.id,
    label: s.label,
  })),
}

await writeFile(join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

console.log('')
console.log(`Done. saved=${saved} skipped=${skipped} failed=${failed.length}`)
if (failed.length) {
  console.error(`Failed indexes: ${failed.map((f) => f.index).join(', ')}`)
  process.exitCode = 1
}
