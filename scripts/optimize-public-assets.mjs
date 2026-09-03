import { readdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const publicRoot = path.resolve('public')
const ONE_MEGABYTE = 1024 * 1024
const CARD_LIMIT_BYTES = 200 * 1024
const HERO_LIMIT_BYTES = 600 * 1024
const WEDDING_BANNER = 'hero/hero-images/wedding.image.png'
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const shouldPrune = process.argv.includes('--prune')

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const filePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await walk(filePath))
    } else {
      files.push(filePath)
    }
  }

  return files
}

function toPublicUrl(filePath) {
  return `/${path.relative(publicRoot, filePath).split(path.sep).join('/')}`
}

function isHero(relativePath) {
  return relativePath.startsWith('hero/')
}

async function encodeWithinBudget(sourcePath, destinationPath, hero) {
  const metadata = await sharp(sourcePath, { animated: false }).metadata()
  const initialWidth = Math.min(metadata.width ?? 1, hero ? 1920 : 1200)
  const byteLimit = hero ? HERO_LIMIT_BYTES : CARD_LIMIT_BYTES
  const startingQuality = hero ? 86 : 76
  let width = initialWidth

  for (;;) {
    for (let quality = startingQuality; quality >= 56; quality -= 4) {
      const buffer = await sharp(sourcePath, { animated: false })
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality, effort: 4, smartSubsample: true })
        .toBuffer()

      if (buffer.length > byteLimit) {
        continue
      }

      await writeFile(destinationPath, buffer)
      const output = await sharp(destinationPath, { animated: false }).metadata()
      return {
        bytes: buffer.length,
        quality,
        width: output.width ?? width,
        height: output.height ?? metadata.height ?? 0,
      }
    }

    if (width <= 480) {
      throw new Error(`Unable to encode ${sourcePath} within its byte budget.`)
    }

    width = Math.max(480, Math.round(width * 0.85))
  }
}

const candidates = (await walk(publicRoot))
  .filter((filePath) => IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase()))

const optimized = []
for (const sourcePath of candidates) {
  const relativePath = path.relative(publicRoot, sourcePath).split(path.sep).join('/')
  const sourceStats = await stat(sourcePath)
  if (sourceStats.size <= ONE_MEGABYTE && relativePath !== WEDDING_BANNER) {
    continue
  }

  const destinationPath = sourcePath.replace(/\.(jpe?g|png|webp|avif)$/i, '.webp')
  const hero = isHero(relativePath)
  const result = await encodeWithinBudget(sourcePath, destinationPath, hero)
  optimized.push({
    from: toPublicUrl(sourcePath),
    to: toPublicUrl(destinationPath),
    kind: hero ? 'hero' : 'card',
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    quality: result.quality,
  })

  if (shouldPrune) {
    await rm(sourcePath)
  }
}

optimized.sort((left, right) => left.from.localeCompare(right.from))
for (const item of optimized) {
  console.log(`${item.kind}\t${item.bytes}\t${item.width}x${item.height}\tq${item.quality}\t${item.from}\t${item.to}`)
}

console.log(`Optimized ${optimized.length} public assets${shouldPrune ? ' and pruned their originals' : ''}.`)
