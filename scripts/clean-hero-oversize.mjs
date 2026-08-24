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

// Marketing copy + feature callouts live on the left ~44% of the composite.
// Crop to the original studio photograph (model + arch background only).
const crop = {
  left: Math.round(width * 0.44),
  top: 0,
  width: Math.round(width * 0.56),
  height,
}

await sharp(source)
  .extract(crop)
  .png({ compressionLevel: 9 })
  .toFile(inputPath)

console.log(`Cleaned ${inputPath} — cropped to ${crop.width}x${crop.height} (removed embedded callouts and left marketing column)`)
