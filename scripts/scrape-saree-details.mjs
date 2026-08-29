/**
 * SerpApi Google Lens scraper for SHIS Fashion saree detail images.
 *
 * Scans local saree listing photos, runs reverse-image search (visual matches),
 * downloads the top detail angles, and regenerates src/data/sareeLensDetails.generated.ts.
 *
 * Usage:
 *   npm run scrape:saree-details -- --dry-run --limit 3
 *   npm run scrape:saree-details -- --slug crimson-red-georgette-saree
 *   npm run scrape:saree-details
 *
 * Requires SERPAPI_API_KEY in .env.local (see .env.example).
 */
import { config as loadDotenv } from 'dotenv'
import {
  access,
  mkdir,
  readdir,
  readFile,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { constants as fsConstants } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
loadDotenv({ path: join(root, '.env.local') })
loadDotenv({ path: join(root, '.env') })

const SAREE_TS = join(root, 'src', 'data', 'sareeCollection.ts')
const GENERATED_TS = join(root, 'src', 'data', 'sareeLensDetails.generated.ts')
const MANIFEST_JSON = join(root, 'scripts', '.saree-lens-manifest.json')

const DEFAULT_SOURCE_DIRS = [
  join(root, 'public', 'collections', 'saree'),
  join(root, 'public', 'saree'),
]
const DEFAULT_OUTPUT_DIR = join(root, 'public', 'collections', 'saree', 'details')
const PUBLIC_DETAIL_PREFIX = '/collections/saree/details'

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const RELEVANCE_KEYWORDS = [
  'saree',
  'sari',
  'fabric',
  'textile',
  'weave',
  'border',
  'pallu',
  'drape',
  'handloom',
  'cotton',
  'silk',
  'jamdani',
  'close',
  'detail',
  'texture',
  'embroidery',
  'motif',
]
const MIN_IMAGE_EDGE = 480
const MAX_UPLOAD_BYTES = 500 * 1024
const USER_AGENT = 'SHIS-Fashion-Saree-Lens-Scraper/1.0 (+https://www.shisfashion.com)'

const EXT_MAP = {
  1: 'jpg',
  3: 'jpg',
  4: 'jpg',
  5: 'png',
  6: 'png',
  7: 'png',
}

function parseArgs(argv) {
  const args = {
    sourceDirs: [],
    outputDir: DEFAULT_OUTPUT_DIR,
    maxDetails: 3,
    limit: 0,
    slugs: [],
    dryRun: false,
    skipUpdate: false,
    delay: 2,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    switch (token) {
      case '--source-dir':
        args.sourceDirs.push(argv[++index])
        break
      case '--output-dir':
        args.outputDir = resolve(argv[++index])
        break
      case '--max-details':
        args.maxDetails = Number(argv[++index])
        break
      case '--limit':
        args.limit = Number(argv[++index])
        break
      case '--slug':
        args.slugs.push(argv[++index])
        break
      case '--dry-run':
        args.dryRun = true
        break
      case '--skip-update':
        args.skipUpdate = true
        break
      case '--delay':
        args.delay = Number(argv[++index])
        break
      default:
        break
    }
  }

  return args
}

async function fileExists(path) {
  try {
    await access(path, fsConstants.F_OK)
    return true
  } catch {
    return false
  }
}

async function readText(path) {
  return readFile(path, 'utf8')
}

function parseCreateSareeProducts(source) {
  const pattern =
    /createSaree\(\s*(\d+)\s*,\s*'([^']+)'\s*,\s*'([^']+)'[\s\S]*?\{[^}]*?(?:id:\s*'([^']+)')?[^}]*?\}\s*,\s*\)/gm
  const items = []

  for (const match of source.matchAll(pattern)) {
    const index = match[1]
    const slug = match[2]
    const name = match[3]
    const productId = match[4] || `saree-${index}`
    const ext = EXT_MAP[index] ?? 'jpg'
    const filename = `saree.${index}.${ext}`
    const candidates = DEFAULT_SOURCE_DIRS.flatMap((base) => [
      join(base, filename),
      join(root, 'public', 'saree', filename),
    ])

    items.push({
      productId,
      slug,
      name,
      primaryPublicPath: `/saree/${filename}`,
      sourceCandidates: candidates,
    })
  }

  return items
}

function parseJamdaniProducts(source) {
  const pattern =
    /\{\s*id:\s*'([^']+)'\s*,\s*slug:\s*'([^']+)'\s*,\s*name:\s*'([^']+)'\s*,[\s\S]*?filename:\s*'([^']+)'/gm
  const items = []

  for (const match of source.matchAll(pattern)) {
    const [, id, slug, name, filename] = match
    const candidates = [
      join(root, 'public', 'saree', 'jamdani', filename),
      join(root, 'public', 'collections', 'saree', 'jamdani', filename),
      join(root, 'public', 'collections', 'saree', filename),
    ]

    items.push({
      productId: id,
      slug,
      name,
      primaryPublicPath: `/saree/jamdani/${encodeURIComponent(filename)}`,
      sourceCandidates: candidates,
    })
  }

  return items
}

async function loadCatalog() {
  if (!(await fileExists(SAREE_TS))) {
    throw new Error(`Missing catalog file: ${SAREE_TS}`)
  }

  const source = await readText(SAREE_TS)
  const bySlug = new Map()

  for (const item of [...parseCreateSareeProducts(source), ...parseJamdaniProducts(source)]) {
    bySlug.set(item.slug.toLowerCase(), item)
  }

  return [...bySlug.values()]
}

async function resolveSourceDirs(cliDirs) {
  if (cliDirs.length) {
    return cliDirs.map((value) => resolve(value))
  }

  const resolved = []
  for (const path of DEFAULT_SOURCE_DIRS) {
    if (await fileExists(path)) {
      resolved.push(path)
    }
  }

  return resolved.length ? resolved : [join(root, 'public', 'saree')]
}

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)))
    } else if (entry.isFile()) {
      files.push(fullPath)
    }
  }

  return files
}

async function findLocalSource(item, sourceDirs) {
  const checked = new Set()

  for (const candidate of item.sourceCandidates) {
    const resolved = resolve(candidate)
    if (checked.has(resolved)) {
      continue
    }
    checked.add(resolved)
    if (await fileExists(resolved)) {
      return resolved
    }
  }

  const slugish = item.slug.replace(/-/g, ' ').toLowerCase()
  for (const sourceDir of sourceDirs) {
    if (!(await fileExists(sourceDir))) {
      continue
    }

    const files = await walkFiles(sourceDir)
    for (const path of files) {
      if (!IMAGE_EXTENSIONS.has(extname(path).toLowerCase())) {
        continue
      }

      const stem = basename(path, extname(path)).toLowerCase()
      if (stem.includes(item.slug.toLowerCase()) || stem.includes(slugish)) {
        return path
      }
    }
  }

  return null
}

async function compressForUpload(filePath) {
  const raw = await readFile(filePath)
  const originalExt = extname(filePath).toLowerCase().replace('.', '') || 'jpg'

  if (raw.length <= MAX_UPLOAD_BYTES) {
    return { buffer: raw, ext: originalExt }
  }

  let quality = 88
  let buffer = await sharp(filePath).jpeg({ quality, mozjpeg: true }).toBuffer()

  while (buffer.length > MAX_UPLOAD_BYTES && quality >= 45) {
    quality -= 8
    buffer = await sharp(filePath).jpeg({ quality, mozjpeg: true }).toBuffer()
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    buffer = await sharp(filePath)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toBuffer()
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error(`Unable to compress ${basename(filePath)} below 500 KB for SerpApi upload.`)
  }

  return { buffer, ext: 'jpg' }
}

async function uploadImage(filePath, apiKey) {
  const { buffer, ext } = await compressForUpload(filePath)
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
  const form = new FormData()
  form.append('api_key', apiKey)
  form.append('image', new Blob([buffer], { type: mime }), `upload.${ext}`)

  const response = await fetch('https://serpapi.com/image', {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    throw new Error(`SerpApi upload failed (${response.status}): ${await response.text()}`)
  }

  const body = await response.json()
  if (!body.image_id) {
    throw new Error(`SerpApi upload failed for ${basename(filePath)}: ${JSON.stringify(body)}`)
  }

  return String(body.image_id)
}

async function searchGoogleLens(imageId, apiKey) {
  const params = new URLSearchParams({
    engine: 'google_lens',
    image_id: imageId,
    type: 'visual_matches',
    hl: 'en',
    country: 'bd',
    api_key: apiKey,
  })

  const response = await fetch(`https://serpapi.com/search.json?${params}`, {
    signal: AbortSignal.timeout(90_000),
  })

  if (!response.ok) {
    throw new Error(`SerpApi search failed (${response.status}): ${await response.text()}`)
  }

  return response.json()
}

function scoreVisualMatch(match) {
  const imageUrl = String(match.image || match.thumbnail || '')
  if (!imageUrl) {
    return -1
  }

  const width = Number(match.image_width || match.thumbnail_width || 0)
  const height = Number(match.image_height || match.thumbnail_height || 0)
  const edge = Math.max(width, height)
  if (edge && edge < MIN_IMAGE_EDGE) {
    return -1
  }

  const haystack = ['title', 'link', 'source']
    .map((key) => String(match[key] || ''))
    .join(' ')
    .toLowerCase()
  const keywordHits = RELEVANCE_KEYWORDS.filter((token) => haystack.includes(token)).length
  const resolutionScore = width && height ? (width * height) / 1_000_000 : 0.35
  const positionPenalty = Number(match.position || 99) * 0.01

  return resolutionScore + keywordHits * 0.45 - positionPenalty
}

function pickVisualMatches(results, limit) {
  const matches = results.visual_matches || []
  const ranked = []

  for (const match of matches) {
    const score = scoreVisualMatch(match)
    if (score <= 0) {
      continue
    }

    const imageUrl = String(match.image || match.thumbnail || '')
    if (!imageUrl.startsWith('http')) {
      continue
    }

    ranked.push({ score, match })
  }

  ranked.sort((left, right) => right.score - left.score)

  const selected = []
  const seenUrls = new Set()

  for (const { match } of ranked) {
    const imageUrl = String(match.image || match.thumbnail)
    const normalized = imageUrl.split('?', 1)[0].toLowerCase()
    if (seenUrls.has(normalized)) {
      continue
    }

    seenUrls.add(normalized)
    selected.push(match)
    if (selected.length >= limit) {
      break
    }
  }

  return selected
}

function guessExtension(url, contentType) {
  const urlExt = extname(new URL(url).pathname).toLowerCase()
  if (IMAGE_EXTENSIONS.has(urlExt)) {
    return urlExt
  }

  const lowered = String(contentType || '').toLowerCase()
  if (lowered.includes('jpeg') || lowered.includes('jpg')) {
    return '.jpg'
  }
  if (lowered.includes('png')) {
    return '.png'
  }
  if (lowered.includes('webp')) {
    return '.webp'
  }

  return '.jpg'
}

async function downloadImage(url, destination) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(60_000),
  })

  if (!response.ok) {
    throw new Error(`Download failed (${response.status}) for ${url}`)
  }

  const ext = guessExtension(url, response.headers.get('content-type'))
  const finalPath = extname(destination) ? destination : `${destination}${ext}`
  await mkdir(dirname(finalPath), { recursive: true })

  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(finalPath, buffer)

  if (finalPath !== destination && (await fileExists(destination))) {
    await unlink(destination)
  }

  return finalPath
}

function publicDetailPath(slug, index, extension) {
  const ext = extension.startsWith('.') ? extension : `.${extension}`
  return `${PUBLIC_DETAIL_PREFIX}/${slug}-detail-${index}${ext}`
}

async function writeGeneratedTs(detailMap) {
  const lines = [
    '/** Auto-generated by scripts/scrape-saree-details.mjs — do not edit manually. */',
    'export const SAREE_LENS_DETAIL_IMAGES: Record<string, string[]> = {',
  ]

  for (const slug of Object.keys(detailMap).sort()) {
    const paths = detailMap[slug]
    if (!paths?.length) {
      continue
    }
    lines.push(`  '${slug}': [${paths.map((path) => `'${path}'`).join(', ')}],`)
  }

  lines.push('}', '')
  await writeFile(GENERATED_TS, lines.join('\n'), 'utf8')
}

async function loadManifest() {
  if (!(await fileExists(MANIFEST_JSON))) {
    return { products: {} }
  }

  return JSON.parse(await readFile(MANIFEST_JSON, 'utf8'))
}

async function saveManifest(payload) {
  await writeFile(MANIFEST_JSON, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

function sleep(seconds) {
  return new Promise((resolvePromise) => {
    setTimeout(resolvePromise, Math.max(0, seconds) * 1000)
  })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const apiKey = String(process.env.SERPAPI_API_KEY || '').trim()

  if (!args.dryRun && !apiKey) {
    console.error('ERROR: Set SERPAPI_API_KEY in .env.local before running.')
    console.error("  Add: SERPAPI_API_KEY=your_key_here")
    process.exit(1)
  }

  let catalog = await loadCatalog()

  if (args.slugs.length) {
    const wanted = new Set(args.slugs.map((slug) => slug.trim().toLowerCase()))
    catalog = catalog.filter((item) => wanted.has(item.slug.toLowerCase()))
  }

  if (args.limit > 0) {
    catalog = catalog.slice(0, args.limit)
  }

  const sourceDirs = await resolveSourceDirs(args.sourceDirs)
  const outputDir = resolve(args.outputDir)
  const detailMap = {}
  const manifest = await loadManifest()
  const manifestProducts = manifest.products || (manifest.products = {})

  console.log(`Catalog items: ${catalog.length}`)
  console.log(`Source dirs: ${sourceDirs.join(', ')}`)
  console.log(`Output dir: ${outputDir}`)
  console.log(`Mode: ${args.dryRun ? 'DRY RUN' : 'LIVE'}`)

  for (const [index, item] of catalog.entries()) {
    const sourcePath = await findLocalSource(item, sourceDirs)
    console.log(`\n[${index + 1}/${catalog.length}] ${item.slug}`)

    if (!sourcePath) {
      console.log('  SKIP: local source image not found')
      continue
    }

    console.log(`  source: ${relative(root, sourcePath)}`)

    if (args.dryRun) {
      for (let detailIndex = 1; detailIndex <= args.maxDetails; detailIndex += 1) {
        console.log(`  would download -> ${publicDetailPath(item.slug, detailIndex, '.jpg')}`)
      }
      continue
    }

    try {
      const imageId = await uploadImage(sourcePath, apiKey)
      const results = await searchGoogleLens(imageId, apiKey)
      const matches = pickVisualMatches(results, args.maxDetails)

      if (!matches.length) {
        console.log('  WARN: no visual matches passed quality filters')
        continue
      }

      const savedPaths = []
      for (const [detailIndex, match] of matches.entries()) {
        const imageUrl = String(match.image || match.thumbnail)
        const destination = join(outputDir, `${item.slug}-detail-${detailIndex + 1}.jpg`)

        try {
          const finalPath = await downloadImage(imageUrl, destination)
          const publicPath = publicDetailPath(item.slug, detailIndex + 1, extname(finalPath))
          savedPaths.push(publicPath)
          console.log(`  saved: ${relative(root, finalPath)} (${match.source || 'unknown source'})`)
        } catch (error) {
          console.log(`  WARN: download failed for match #${detailIndex + 1}: ${error.message}`)
        }
      }

      if (savedPaths.length) {
        detailMap[item.slug.toLowerCase()] = savedPaths
        manifestProducts[item.slug.toLowerCase()] = {
          productId: item.productId,
          name: item.name,
          source: relative(root, sourcePath),
          detailPaths: savedPaths,
        }
      }
    } catch (error) {
      console.log(`  ERROR: SerpApi search failed: ${error.message}`)
    }

    if (index < catalog.length - 1) {
      await sleep(args.delay)
    }
  }

  if (!args.dryRun) {
    await saveManifest(manifest)

    if (!args.skipUpdate) {
      const merged = {}
      for (const [slug, payload] of Object.entries(manifestProducts)) {
        merged[slug.toLowerCase()] = payload.detailPaths || []
      }
      Object.assign(merged, detailMap)
      await writeGeneratedTs(merged)
      console.log(`\nUpdated ${relative(root, GENERATED_TS)}`)
    }
  }

  console.log('\nDone.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
