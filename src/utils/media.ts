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

    const prefix = parsed.pathname.slice(0, markerIndex + marker.length)
    const suffix = parsed.pathname.slice(markerIndex + marker.length)
    const transformations = `f_auto,q_auto,c_fill,g_auto,w_${width},h_${height}`
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
