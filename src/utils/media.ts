const DEMO_IMAGE_HOSTS = ['images.unsplash.com', 'plus.unsplash.com']
const CLOUDINARY_HOST = 'res.cloudinary.com'

export interface ManagedImageSource {
  images?: string[]
  image?: string
  featuredImage?: string
  thumbnail?: string
  coverImage?: string
  imageTitles?: string[]
  imageDescriptions?: string[]
}

export interface ManagedImageEntry {
  url: string
  title: string
  description: string
}

function toTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function uniqueNonEmpty(values: string[]) {
  const seen = new Set<string>()
  return values.filter((value) => {
    if (!value || seen.has(value)) {
      return false
    }
    seen.add(value)
    return true
  })
}

function collectProductImageCandidates(source: ManagedImageSource) {
  const arrayImages = Array.isArray(source.images)
    ? source.images.map((entry) => toTrimmedString(entry)).filter(Boolean)
    : []

  const priority = [
    toTrimmedString(source.featuredImage),
    toTrimmedString(source.thumbnail),
    toTrimmedString(source.coverImage),
    ...arrayImages,
    toTrimmedString(source.image),
  ]

  return uniqueNonEmpty(priority)
}

export function getProductImage(source: ManagedImageSource, fallback = '') {
  return collectProductImageCandidates(source)[0] ?? fallback
}

export function isDemoImageUrl(url?: string) {
  if (!url) {
    return false
  }

  try {
    const parsed = new URL(url)
    return DEMO_IMAGE_HOSTS.some((host) => parsed.hostname.includes(host))
  } catch {
    return false
  }
}

export function normalizeDemoImageUrl(url: string, width: number, height: number) {
  if (!url || !isDemoImageUrl(url)) {
    return url
  }

  try {
    const parsed = new URL(url)
    parsed.searchParams.set('auto', 'format')
    parsed.searchParams.set('fit', 'crop')
    parsed.searchParams.set('crop', 'faces,center')
    parsed.searchParams.set('w', String(width))
    parsed.searchParams.set('h', String(height))
    parsed.searchParams.set('q', '80')
    return parsed.toString()
  } catch {
    return url
  }
}

function isCloudinaryTransformSegment(segment: string) {
  if (!segment || /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(segment)) {
    return false
  }

  if (/^v\d+$/.test(segment)) {
    return false
  }

  return segment.includes(',')
    || /^(f_auto|q_auto|c_[a-z]+|g_[a-z_]+|w_\d+|h_\d+|dpr_|e_|fl_|t_)/i.test(segment)
}

function stripCloudinaryTransforms(pathname: string) {
  const marker = '/upload/'
  const markerIndex = pathname.indexOf(marker)
  if (markerIndex === -1) {
    return pathname
  }

  const prefix = pathname.slice(0, markerIndex + marker.length)
  const rest = pathname.slice(markerIndex + marker.length).split('/').filter(Boolean)
  while (rest.length && isCloudinaryTransformSegment(rest[0] ?? '')) {
    rest.shift()
  }

  return `${prefix}${rest.join('/')}`
}

export function normalizeCloudinaryImageUrl(url: string, width: number, height: number) {
  if (!url) {
    return url
  }

  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes(CLOUDINARY_HOST)) {
      return url
    }

    const marker = '/upload/'
    const markerIndex = parsed.pathname.indexOf(marker)
    if (markerIndex === -1) {
      return url
    }

    const cleanPath = stripCloudinaryTransforms(parsed.pathname)
    const prefix = cleanPath.slice(0, cleanPath.indexOf(marker) + marker.length)
    const suffix = cleanPath.slice(cleanPath.indexOf(marker) + marker.length)
    const transformations = `f_auto,q_auto,c_fill,g_auto,w_${Math.max(1, Math.round(width))},h_${Math.max(1, Math.round(height))}`
    parsed.pathname = `${prefix}${transformations}/${suffix}`
    return parsed.toString()
  } catch {
    return url
  }
}

export function normalizeCatalogImageUrl(url: string, width: number, height: number) {
  const cloudinaryUrl = normalizeCloudinaryImageUrl(url, width, height)
  return normalizeDemoImageUrl(cloudinaryUrl, width, height)
}

const DEFAULT_SRCSET_WIDTHS = [480, 768, 960, 1400]

export function buildCatalogSrcSet(
  url: string,
  width: number,
  height: number,
  widths: number[] = DEFAULT_SRCSET_WIDTHS,
) {
  if (!url) {
    return undefined
  }

  const aspect = height / Math.max(width, 1)
  const entries = widths.map((entryWidth) => {
    const w = Math.max(1, Math.round(entryWidth))
    const h = Math.max(1, Math.round(w * aspect))
    return `${normalizeCatalogImageUrl(url, w, h)} ${w}w`
  })
  const uniqueSrcs = new Set(entries.map((entry) => entry.split(' ')[0]))
  return uniqueSrcs.size > 1 ? entries.join(', ') : undefined
}

export function catalogImageAttrs(
  url: string,
  width: number,
  height: number,
  sizes: string,
  widths?: number[],
) {
  return {
    src: normalizeCatalogImageUrl(url, width, height) || url,
    srcSet: buildCatalogSrcSet(url, width, height, widths),
    sizes,
  }
}

export function getManagedImageEntries(source: ManagedImageSource, minLength = 0): ManagedImageEntry[] {
  const images = collectProductImageCandidates(source)
  const total = Math.max(images.length, minLength)

  return Array.from({ length: total }, (_, index) => ({
    url: images[index] ?? '',
    title: typeof source.imageTitles?.[index] === 'string' ? source.imageTitles[index] ?? '' : '',
    description: typeof source.imageDescriptions?.[index] === 'string' ? source.imageDescriptions[index] ?? '' : '',
  }))
}

export function compactManagedImages(source: ManagedImageSource) {
  const entries = getManagedImageEntries(source).filter((entry) => entry.url)

  return {
    images: entries.map((entry) => entry.url),
    imageTitles: entries.map((entry) => entry.title.trim()),
    imageDescriptions: entries.map((entry) => entry.description.trim()),
  }
}
