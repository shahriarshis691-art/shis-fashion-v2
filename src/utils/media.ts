const DEMO_IMAGE_HOSTS = ['images.unsplash.com', 'plus.unsplash.com']
const CLOUDINARY_HOST = 'res.cloudinary.com'

export interface ManagedImageSource {
  images?: string[]
  image?: string
  imageTitles?: string[]
  imageDescriptions?: string[]
}

export interface ManagedImageEntry {
  url: string
  title: string
  description: string
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
  const explicitImages = Array.isArray(source.images)
    ? source.images.filter((entry): entry is string => typeof entry === 'string')
    : []
  const legacyImage = typeof source.image === 'string' ? source.image.trim() : ''
  const images = explicitImages.length ? explicitImages : (legacyImage ? [legacyImage] : [])
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
