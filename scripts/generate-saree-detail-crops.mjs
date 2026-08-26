import { mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT_SIZE = 800

/** Normalized crop centers [x, y] tuned to fabric body vs border/aanchal on each listing photo. */
const CROPS = {
  1: { texture: [0.50, 0.64], border: [0.84, 0.58] },
  3: { texture: [0.64, 0.74], border: [0.20, 0.44] },
  4: { texture: [0.34, 0.74], border: [0.68, 0.56] },
  5: { texture: [0.66, 0.70], border: [0.18, 0.52] },
  6: { texture: [0.48, 0.48], border: [0.90, 0.58] },
  7: { texture: [0.60, 0.62], border: [0.78, 0.42] },
}

const SOURCES = [
  { index: 1, id: 'saree-crimson-red', file: 'saree.1.jpg' },
  { index: 3, id: 'saree-olive-green', file: 'saree.3.jpg' },
  { index: 4, id: 'saree-4', file: 'saree.4.jpg' },
  { index: 5, id: 'saree-5', file: 'saree.5.png' },
  { index: 6, id: 'saree-6', file: 'saree.6.png' },
  { index: 7, id: 'saree-7', file: 'saree.7.png' },
]

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function extractBox(width, height, centerX, centerY) {
  const cropSize = Math.max(280, Math.round(Math.min(width, height) * 0.30))
  const size = Math.min(width, height, cropSize)
  const left = Math.round(clamp(centerX * width - size / 2, 0, width - size))
  const top = Math.round(clamp(centerY * height - size / 2, 0, height - size))
  return { left, top, width: size, height: size }
}

async function writeMacro(sourcePath, box, outputPath) {
  await sharp(sourcePath)
    .extract(box)
    .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .normalize({ lower: 2, upper: 98 })
    .sharpen({ sigma: 1.15, m1: 0.7, m2: 0.35, x1: 2, y2: 10 })
    .jpeg({ quality: 92, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(outputPath)
}

await mkdir(join(root, 'public', 'saree'), { recursive: true })

for (const source of SOURCES) {
  const sourcePath = join(root, 'public', 'saree', source.file)
  const meta = await sharp(sourcePath).metadata()
  const width = meta.width ?? 0
  const height = meta.height ?? 0
  if (!width || !height) {
    throw new Error(`Unable to read ${source.file}`)
  }

  const hints = CROPS[source.index]
  const textureBox = extractBox(width, height, hints.texture[0], hints.texture[1])
  const borderBox = extractBox(width, height, hints.border[0], hints.border[1])

  const textureOut = join(root, 'public', 'saree', `saree.${source.index}-texture.jpg`)
  const borderOut = join(root, 'public', 'saree', `saree.${source.index}-border.jpg`)

  await writeMacro(sourcePath, textureBox, textureOut)
  await writeMacro(sourcePath, borderBox, borderOut)

  console.log(
    `${source.id}: texture ${textureBox.width}px → ${OUTPUT_SIZE}, border ${borderBox.width}px → ${OUTPUT_SIZE}`,
  )
}
