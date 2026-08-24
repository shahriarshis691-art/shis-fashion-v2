import { existsSync } from 'node:fs'
import sharp from 'sharp'

const inputPath = 'public/hero/timeless-oversize-hero.png'
const backupPath = 'public/hero/timeless-oversize-hero.source.png'

if (!existsSync(backupPath)) {
  throw new Error(`Missing source backup at ${backupPath}`)
}

const source = backupPath
const image = sharp(source)
const { width = 0, height = 0 } = await image.metadata()

if (!width || !height) {
  throw new Error('Unable to read hero image dimensions.')
}

const overlay = {
  left: 0,
  top: Math.round(height * 0.505),
  width: Math.round(width * 0.44),
  height: Math.round(height * 0.285),
}

// Plain wall sample from the right background (no typography).
const sample = {
  left: Math.round(width * 0.78),
  top: Math.round(height * 0.12),
  width: Math.round(width * 0.16),
  height: Math.round(height * 0.28),
}

const patch = await sharp(source)
  .extract(sample)
  .modulate({ brightness: 1.03, saturation: 0.92 })
  .blur(1.2)
  .resize(overlay.width, overlay.height, { fit: 'fill' })
  .toBuffer()

await sharp(source)
  .composite([{ input: patch, left: overlay.left, top: overlay.top }])
  .png({ compressionLevel: 9 })
  .toFile(inputPath)

console.log(`Cleaned ${inputPath} (${width}x${height})`)
