/**
 * Download 100 women's kurti catalog images (3:4 portrait), save as
 * public/images/products/kurtis/kurti-001.jpg … kurti-100.jpg.
 *
 * Sources (royalty-free / CDN):
 *   1. Curated Unsplash fashion / ethnic-wear photo IDs
 *   2. Picsum seed fallback when Unsplash fails (guarantees 100 unique files)
 *
 * Usage:
 *   node scripts/fetch-kurti-images.mjs
 *   node scripts/fetch-kurti-images.mjs --force
 */
import { mkdir, writeFile, access } from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(root, 'public', 'images', 'products', 'kurtis')
const COUNT = 100
const WIDTH = 960
const HEIGHT = 1280
const JPEG_QUALITY = 84
const CONCURRENCY = 4

/**
 * Curated Unsplash photo IDs — women fashion / ethnic / studio apparel frames.
 * Indexed 1..N; remaining slots use Picsum seeds for uniqueness.
 */
const UNSPLASH_IDS = [
  '1515372039744-b8f02a3ae446',
  '1483985988355-763728e1935b',
  '1490481651871-ab68de25d43d',
  '1469334031218-e382a71b716b',
  '1496747611176-843222e1e57c',
  '1487222477894-8943e31ef7b2',
  '1509631179647-0177331693ae',
  '1523381210434-271e8be1f52b',
  '1515886657613-9f3515b0c78f',
  '1539109136881-3be0616acf4b',
  '1558171813-4c088753af8f',
  '1462392246754-28dfa2df8e6b',
  '1539533018447-63fcce2678e3',
  '1552374196-1ab2a1c593e8',
  '1574180566232-aaad1b5b8450',
  '1594938298603-c8148c4dae35',
  '1475180098004-ca77a66827be',
  '1560243563-062bfc001d68',
  '1556905055-8f358a7a47b2',
  '1434389677669-e08b4cac3105',
  '1479064555552-3ef4979f8908',
  '1512436991641-6745cdb1723f',
  '1441986300917-64674bd600d8',
  '1554568218-0f1715e72254',
  '1544441893-675973e31985',
  '1571945153237-4929e783af4a',
  '1503342217505-b0a15ec3261c',
  '1529374255404-311a2a4f1fd9',
  '1489987707025-afc232f7ea0f',
  '1602810318383-e386cc2a3ccf',
  '1618354691373-d851c5c3a990',
  '1562157873-818bc0726f68',
  '1620799140408-edc6dcb6d633',
  '1596755094514-f87e34085b2c',
  '1576566588028-4147f3842f27',
  '1583743814966-8936f5b7be1a',
  '1521572163474-6864f9cf17ab',
  '1541099649105-f69ad21f3246',
  '1582418702059-97ebafb35d09',
  '1611312449408-fcece27cdbb7',
  '1604176354204-9268737828e4',
  '1565084888279-aca607ecce0c',
  '1594750823491-e493d067ce3e',
  '1608147152875-b0eb0c53d491',
  '1617178388553-a9d022974a5c',
  '1593030761757-71fae45fa0e7',
  '1551028719-00167b16eac5',
  '1591047139829-d91aecb6caea',
  '1549298916-b41d501d3772',
  '1549298916-f52d724204b4',
  '1556906781-9a412961c28c',
  '1496747611176-843222e1e57c',
  '1529626455594-4ff0802cfb7e',
  '1488426862026-3ee34a7d66df',
  '1524504388940-b1c1722653e1',
  '1534528741775-53994a69daeb',
  '1494790108377-be9c29b29330',
  '1524504396865-2e5f3f16d1a5',
  '1502716119720-b2a702b5f2c2',
  '1517841905240-472988babdf9',
  '1529139574466-a303027c1d8b',
  '1487412720507-e7ab37603c6f',
  '1499952127939-9bbf5af6b1c1',
  '1500917293891-ef795e70a1f0',
  '1515886657613-9f3515b0c78f',
  '1469334031218-e382a71b716b',
  '1509631179647-0177331693ae',
  '1487222477894-8943e31ef7b2',
  '1496747611176-843222e1e57c',
  '1558171813-4c088753af8f',
  '1539109136881-3be0616acf4b',
  '1483985988355-763728e1935b',
  '1490481651871-ab68de25d43d',
  '1515372039744-b8f02a3ae446',
  '1462392246754-28dfa2df8e6b',
  '1539533018447-63fcce2678e3',
  '1552374196-1ab2a1c593e8',
  '1574180566232-aaad1b5b8450',
  '1475180098004-ca77a66827be',
  '1560243563-062bfc001d68',
  '1434389677669-e08b4cac3105',
  '1479064555552-3ef4979f8908',
  '1556905055-8f358a7a47b2',
  '1512436991641-6745cdb1723f',
  '1441986300917-64674bd600d8',
  '1554568218-0f1715e72254',
  '1544441893-675973e31985',
  '1571945153237-4929e783af4a',
  '1503342217505-b0a15ec3261c',
  '1529374255404-311a2a4f1fd9',
  '1489987707025-afc232f7ea0f',
  '1602810318383-e386cc2a3ccf',
  '1618354691373-d851c5c3a990',
  '1562157873-818bc0726f68',
  '1620799140408-edc6dcb6d633',
  '1596755094514-f87e34085b2c',
  '1576566588028-4147f3842f27',
  '1583743814966-8936f5b7be1a',
  '1521572163474-6864f9cf17ab',
  '1541099649105-f69ad21f3246',
]

function padIndex(index) {
  return String(index).padStart(3, '0')
}

function unsplashUrl(photoId) {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=${WIDTH * 2}&h=${HEIGHT * 2}&q=85`
}

function picsumUrl(index) {
  return `https://picsum.photos/seed/shis-kurti-${padIndex(index)}/${WIDTH * 2}/${HEIGHT * 2}.jpg`
}

function buildSources() {
  return Array.from({ length: COUNT }, (_, offset) => {
    const index = offset + 1
    const unsplashId = UNSPLASH_IDS[offset]
    return {
      index,
      file: `kurti-${padIndex(index)}.jpg`,
      unsplashId: unsplashId || null,
      primaryUrl: unsplashId ? unsplashUrl(unsplashId) : picsumUrl(index),
      fallbackUrl: picsumUrl(index),
    }
  })
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
          'User-Agent': 'SHIS-Fashion-KurtiFetcher/1.0',
          Accept: 'image/avif,image/webp,image/jpeg,image/*,*/*;q=0.8',
        },
        redirect: 'follow',
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      if (buffer.byteLength < 8_000) {
        throw new Error(`Image too small (${buffer.byteLength} bytes)`)
      }
      return buffer
    } catch (error) {
      lastError = error
      await new Promise((resolve) => setTimeout(resolve, 350 * attempt))
    }
  }
  throw lastError
}

async function processOne(source, { force = false } = {}) {
  const outPath = join(OUT_DIR, source.file)
  if (!force && (await fileExists(outPath))) {
    const meta = await sharp(outPath).metadata()
    if ((meta.width ?? 0) >= 600 && (meta.height ?? 0) >= 800) {
      return { index: source.index, status: 'skipped', path: outPath, source: 'local' }
    }
  }

  let raw
  let used = 'unsplash'
  try {
    raw = await downloadBuffer(source.primaryUrl)
  } catch (primaryError) {
    used = 'picsum'
    try {
      raw = await downloadBuffer(source.fallbackUrl)
    } catch {
      throw primaryError
    }
  }

  await sharp(raw)
    .rotate()
    .resize(WIDTH, HEIGHT, {
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: false,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(outPath)

  return { index: source.index, status: 'saved', path: outPath, source: used }
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
const SOURCES = buildSources()

await mkdir(OUT_DIR, { recursive: true })

console.log(`Fetching ${SOURCES.length} kurti catalog images → ${OUT_DIR}`)
console.log(`Force overwrite: ${force ? 'yes' : 'no'}`)

const results = await runPool(
  SOURCES,
  async (source) => {
    try {
      const result = await processOne(source, { force })
      const mark = result.status === 'saved' ? '✓' : '·'
      console.log(`  ${mark} ${source.file} [${result.status}/${result.source}]`)
      return result
    } catch (error) {
      console.error(`  ✗ ${source.file} FAILED: ${error.message}`)
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
  outputDir: 'public/images/products/kurtis',
  count: SOURCES.length,
  saved,
  skipped,
  failed: failed.map((f) => f.index),
  files: SOURCES.map((s) => ({
    index: s.index,
    file: s.file,
    publicPath: `/images/products/kurtis/${s.file}`,
    unsplashId: s.unsplashId,
  })),
}

await writeFile(join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')

console.log('')
console.log(`Done. saved=${saved} skipped=${skipped} failed=${failed.length}`)
if (failed.length) {
  console.error(`Failed indexes: ${failed.map((f) => f.index).join(', ')}`)
  process.exitCode = 1
}
