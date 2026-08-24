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
  top: Math.round(height * 0.518),
  width: Math.round(width * 0.43),
  height: Math.round(height * 0.255),
}

// Neutral arch wall behind the model (no baked typography).
const sample = {
  left: Math.round(width * 0.52),
  top: Math.round(height * 0.14),
  width: Math.round(width * 0.18),
  height: Math.round(height * 0.3),
}

const sampleStats = await sharp(source).extract(sample).stats()
const background = {
  r: Math.round(sampleStats.channels[0]?.mean ?? 210),
  g: Math.round(sampleStats.channels[1]?.mean ?? 198),
  b: Math.round(sampleStats.channels[2]?.mean ?? 186),
}

const basePatch = await sharp({
  create: {
    width: overlay.width,
    height: overlay.height,
    channels: 3,
    background,
  },
})
  .blur(0.4)
  .png()
  .toBuffer()

const texturePatch = await sharp(source)
  .extract(sample)
  .blur(2.4)
  .resize(overlay.width, overlay.height, { fit: 'fill' })
  .linear(1, -8)
  .png()
  .toBuffer()

await sharp(source)
  .composite([
    { input: basePatch, left: overlay.left, top: overlay.top },
    { input: texturePatch, left: overlay.left, top: overlay.top, blend: 'soft-light' },
  ])
  .png({ compressionLevel: 9 })
  .toFile(inputPath)

console.log(`Cleaned ${inputPath} (${width}x${height})`)
