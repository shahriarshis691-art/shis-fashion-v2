import { existsSync } from 'node:fs'
import sharp from 'sharp'

const inputPath = 'public/hero/timeless-oversize-hero.png'
const backupPath = 'public/hero/timeless-oversize-hero.source.png'

if (!existsSync(backupPath)) {
  throw new Error(`Missing source backup at ${backupPath}`)
}

const source = backupPath
const { width = 0, height = 0 } = await sharp(source).metadata()

if (!width || !height) {
  throw new Error('Unable to read hero image dimensions.')
}

// Feature callouts + circular icons (left column, mid-lower).
const overlay = {
  left: 0,
  top: Math.round(height * 0.515),
  width: Math.round(width * 0.44),
  height: Math.round(height * 0.265),
}

// Plain arch wall on the right — no typography or subject.
const sample = {
  left: Math.round(width * 0.74),
  top: overlay.top,
  width: Math.round(width * 0.14),
  height: overlay.height,
}

const wallPatch = await sharp(source)
  .extract(sample)
  .blur(0.8)
  .resize(overlay.width, overlay.height, { fit: 'fill' })
  .png()
  .toBuffer()

await sharp(source)
  .composite([{ input: wallPatch, left: overlay.left, top: overlay.top }])
  .png({ compressionLevel: 9 })
  .toFile(inputPath)

console.log(`Cleaned ${inputPath} (${width}x${height})`)
