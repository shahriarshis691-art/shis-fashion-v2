const DEMO_IMAGE_HOSTS = ['images.unsplash.com', 'plus.unsplash.com']
const CLOUDINARY_HOST = 'res.cloudinary.com'

export const CATALOG_IMAGE_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"%3E%3Crect width="1200" height="1200" fill="%23f6f6f6"%3E%3C/rect%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="%23808080"%3ESHIS Fashion%3C/text%3E%3C/svg%3E'

export interface ManagedImageSource {
  images?: string[]
  galleryImages?: string[]
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

export function isPersistableMediaUrl(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  const lower = trimmed.toLowerCase()
  return !lower.startsWith('blob:') && !lower.startsWith('data:')
}

export function isBundledFallbackMediaUrl(value: string) {
  const normalized = value.trim().toLowerCase()
  return normalized.includes('featured-saree-collection.jpg')
    || normalized.includes('category-saree-blue.jpg')
    || normalized.includes('saree-category-new.jpg')
    || normalized.includes('featured-denim-collection.jpg')
    || normalized.includes('men-category.jpg')
    || normalized.includes('men-category.webp')
    || normalized.includes('featured-men-collection.jpg')
}

export function isRemoteMediaUrl(value: unknown): value is string {
  if (!isPersistableMediaUrl(value)) {
    return false
  }

  if (isBundledFallbackMediaUrl(value)) {
    return false
  }

  return /^https?:\/\//i.test(value.trim())
}

export function isOutdatedHardcodedMediaUrl(value: string) {
  const normalized = value.trim().toLowerCase()
  if (!normalized) {
    return true
  }

  return normalized.includes('og-image.svg')
    || normalized.includes('/og-image.png')
    || normalized.includes('images.unsplash.com')
    || normalized.includes('plus.unsplash.com')
    || normalized.includes('featured-men-collection.jpg')
    || normalized.includes('men-category.webp')
    || normalized.includes('category-saree-blue.jpg')
    || normalized.includes('timeless-oversize-hero')
}

export function pickPreferredMediaUrl(
  primary: string | undefined,
  extras: Array<string | undefined> = [],
  fallback = '',
) {
  const candidates = [primary, ...extras]
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => isPersistableMediaUrl(item))

  const remote = candidates.find((item) => isRemoteMediaUrl(item))
  if (remote) {
    return remote
  }

  return typeof fallback === 'string' ? fallback.trim() : ''
}

export function pickPreferredCategoryCoverUrl(
  primary: string | undefined,
  extras: Array<string | undefined> = [],
  fallback = '',
) {
  const candidates = [primary, ...extras]
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => isPersistableMediaUrl(item) && !isOutdatedHardcodedMediaUrl(item))

  const remote = candidates.find((item) => isRemoteMediaUrl(item) && !isOutdatedHardcodedMediaUrl(item))
  if (remote) {
    return remote
  }

  const bundled = candidates.find((item) => isBundledFallbackMediaUrl(item))
  if (bundled) {
    return bundled
  }

  const fallbackUrl = typeof fallback === 'string' ? fallback.trim() : ''
  if (fallbackUrl && !isOutdatedHardcodedMediaUrl(fallbackUrl)) {
    return fallbackUrl
  }

  return candidates[0] ?? fallbackUrl
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
  const galleryImages = Array.isArray(source.galleryImages)
    ? source.galleryImages.map((entry) => toTrimmedString(entry)).filter(Boolean)
    : []

  const priority = [
    toTrimmedString(source.featuredImage),
    toTrimmedString(source.thumbnail),
    toTrimmedString(source.coverImage),
    ...arrayImages,
    ...galleryImages,
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

export type CatalogImageFit = 'cover' | 'contain'

export function isSiteRelativeMediaUrl(url: string) {
  const trimmed = url.trim()
  return trimmed.startsWith('/') && !trimmed.startsWith('//')
}

const OPTIMIZED_PUBLIC_MEDIA_PATHS = new Set([
  '/brands/xeroxii.png',
  '/collections/full=shirts/64a33855-1f44-470a-bfc0-ce02135a94eb.png',
  '/collections/full=shirts/7131c1a9-6333-4b56-84b3-6ad6b8c0390b.png',
  '/collections/full=shirts/72d32a26-0458-48bc-a2ea-a3f81f6eeb24.png',
  '/collections/full=shirts/78fe0eb3-d79f-4470-9269-d8d375ea2c67.png',
  '/collections/full=shirts/c4c28e17-5096-4217-8cc8-e81ddd408e1d.png',
  '/collections/full=shirts/c5374993-6bcd-4563-952c-5c2b75a8ad54.png',
  '/collections/full=shirts/f10ed88f-2fe5-42b5-a248-4cf426f929ac.png',
  ...Array.from({ length: 13 }, (_, index) => `/collections/half-shirts/half-shirt-${index + 1}.jpg`),
  '/collections/kid-hero/kid-category.png',
  '/collections/kid-hero/Shis Fashion Streetwear Editorial.png',
  '/collections/men-2feature-image/men-feature2.png',
  '/collections/men-feature.png',
  '/collections/polo-hero-images/polo-collection-herimage.png',
  '/collections/saree-category-new.jpg',
  '/collections/women-category-main/women.category.png',
  '/hero/denim-homepage.jpg',
  '/hero/half-shirt-1.jpg',
  '/hero/hero-images/hero-image2.png',
  '/hero/hero-images/wedding.image.png',
  '/hero/kids/hero-soft-cotton-saree.jpg',
  '/hero/kids/kid-featured (2).png',
  '/hero/panjabi-hero-image/3cb91c65-0c83-4044-8224-d4713d26b0a3.png',
  '/hero/panjabi-hero-image/panjabi-hero-main.png',
  '/hero/saree-heroimage/homepage-hero-image.png',
  '/hero/shirt-hero-image/shirt-collection-image.png',
  '/hero/womens-baggy/womens-jeans-listing.png',
  '/homepage/40e0b639-d95a-42d5-aa38-f3d42a8e5589.png',
  '/homepage/category.png',
  ...Array.from({ length: 11 }, (_, index) => `/images/products/kids/Kid-Hero-${index + 1}.png`),
  '/images/products/kids/Kid-Hero-13.png',
  '/saree/aba8c50b-3f09-4cc8-93bb-8d89fb37e894.png',
  '/saree/dd718963-1aed-4441-94dc-8a20b143fdae.png',
  '/saree/saree.1.jpg',
  '/saree/saree.3.jpg',
  '/saree/saree.5.png',
  '/saree/saree.6.png',
  '/saree/saree.7.png',
])

function resolveOptimizedPublicMediaUrl(url: string) {
  if (!isSiteRelativeMediaUrl(url)) {
    return url
  }

  const hashIndex = url.indexOf('#')
  const queryIndex = url.indexOf('?')
  const end = Math.min(
    hashIndex === -1 ? url.length : hashIndex,
    queryIndex === -1 ? url.length : queryIndex,
  )
  const pathname = url.slice(0, end)
  const suffix = url.slice(end)
  let decodedPathname = pathname

  try {
    decodedPathname = decodeURIComponent(pathname)
  } catch {
    // Keep malformed URLs unchanged so the existing fallback behavior applies.
  }

  if (!OPTIMIZED_PUBLIC_MEDIA_PATHS.has(decodedPathname)) {
    return url
  }

  return `${encodePathnamePreservingSafeChars(decodedPathname.replace(/\.(jpe?g|png)$/i, '.webp'))}${suffix}`
}

export function isAbsoluteHttpUrl(url: string) {
  return /^https?:\/\//i.test(url.trim())
}

/** Cloudinary folder/id with no protocol, slash prefix, or file extension. */
export function isRawCloudinaryPublicId(url: string) {
  const trimmed = url.trim()
  if (
    !trimmed
    || isSiteRelativeMediaUrl(trimmed)
    || isAbsoluteHttpUrl(trimmed)
    || trimmed.startsWith('data:')
    || trimmed.startsWith('blob:')
    || trimmed.startsWith('//')
    || /[?#\s]/.test(trimmed)
    || /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(trimmed)
  ) {
    return false
  }

  return /^[\w-]+(?:\/[\w.-]+)+$/.test(trimmed)
}

function encodePathnamePreservingSafeChars(pathname: string) {
  return pathname
    .split('/')
    .map((segment, index) => {
      if (index === 0 && segment === '') {
        return ''
      }

      try {
        return encodeURI(decodeURIComponent(segment))
      } catch {
        return encodeURI(segment)
      }
    })
    .join('/')
}

export function normalizeDemoImageUrl(
  url: string,
  width: number,
  height: number,
  fit: CatalogImageFit = 'cover',
) {
  if (!url || !isDemoImageUrl(url)) {
    return url
  }

  try {
    const parsed = new URL(url)
    parsed.searchParams.set('auto', 'format')
    if (fit === 'contain') {
      parsed.searchParams.set('fit', 'max')
      parsed.searchParams.delete('crop')
      parsed.searchParams.set('w', String(width))
      parsed.searchParams.delete('h')
    } else {
      parsed.searchParams.set('fit', 'crop')
      parsed.searchParams.set('crop', 'faces,center')
      parsed.searchParams.set('w', String(width))
      parsed.searchParams.set('h', String(height))
    }
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

export function normalizeCloudinaryImageUrl(
  url: string,
  width: number,
  height: number,
  fit: CatalogImageFit = 'cover',
) {
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
    const w = Math.max(1, Math.round(width))
    const transformations =
      fit === 'contain'
        ? `f_auto,q_auto,c_limit,w_${w}`
        : `f_auto,q_auto,c_fill,g_top,w_${w},h_${Math.max(1, Math.round(height))}`
    parsed.pathname = `${prefix}${transformations}/${suffix}`
    return parsed.toString()
  } catch {
    return url
  }
}

export function sanitizeCatalogAssetUrl(url: string) {
  const trimmed = url.trim()
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed
  }

  if (isAbsoluteHttpUrl(trimmed)) {
    if (!trimmed.includes(' ') && !trimmed.includes('\n')) {
      return trimmed
    }

    try {
      const parsed = new URL(trimmed)
      parsed.pathname = encodePathnamePreservingSafeChars(parsed.pathname)
      return parsed.toString()
    } catch {
      return trimmed.replace(/ /g, '%20')
    }
  }

  if (isSiteRelativeMediaUrl(trimmed) || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    const hashIndex = trimmed.indexOf('#')
    const queryIndex = trimmed.indexOf('?')
    const end = Math.min(
      hashIndex === -1 ? trimmed.length : hashIndex,
      queryIndex === -1 ? trimmed.length : queryIndex,
    )
    const pathname = trimmed.slice(0, end)
    const rest = trimmed.slice(end)
    return `${encodePathnamePreservingSafeChars(pathname)}${rest}`
  }

  return trimmed
}

function buildCloudinaryUrlFromPublicId(
  publicId: string,
  width: number,
  height: number,
  fit: CatalogImageFit,
) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  if (!cloudName) {
    return publicId
  }

  const w = Math.max(1, Math.round(width))
  const transformations =
    fit === 'contain'
      ? `f_auto,q_auto,c_limit,w_${w}`
      : `f_auto,q_auto,c_fill,g_top,w_${w},h_${Math.max(1, Math.round(height))}`

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`
}

/**
 * Safe listing/PDP image resolver:
 * - `/collections/...`, `/saree/...`, `/images/...` stay site-relative
 * - `http(s):` URLs load as stored (Cloudinary, Firebase, etc.)
 * - Cloudinary transforms apply only to raw public IDs
 */
export function resolveCatalogImageSrc(
  url: string,
  width = 640,
  height = 853,
  fit: CatalogImageFit = 'cover',
) {
  const sanitized = resolveOptimizedPublicMediaUrl(sanitizeCatalogAssetUrl(url))
  if (!sanitized) {
    return sanitized
  }

  if (
    isSiteRelativeMediaUrl(sanitized)
    || sanitized.startsWith('./')
    || sanitized.startsWith('../')
    || sanitized.startsWith('data:')
    || sanitized.startsWith('blob:')
  ) {
    return sanitized
  }

  if (isAbsoluteHttpUrl(sanitized)) {
    return sanitized
  }

  if (isRawCloudinaryPublicId(sanitized)) {
    return buildCloudinaryUrlFromPublicId(sanitized, width, height, fit)
  }

  return sanitized
}

export function normalizeCatalogImageUrl(
  url: string,
  width: number,
  height: number,
  fit: CatalogImageFit = 'cover',
) {
  return resolveCatalogImageSrc(url, width, height, fit)
}

const DEFAULT_SRCSET_WIDTHS = [320, 480, 640, 768, 960]

export function buildCatalogSrcSet(
  url: string,
  width: number,
  height: number,
  widths: number[] = DEFAULT_SRCSET_WIDTHS,
  fit: CatalogImageFit = 'cover',
) {
  if (!url || !isRawCloudinaryPublicId(url.trim())) {
    return undefined
  }

  const aspect = height / Math.max(width, 1)
  const entries = widths.map((entryWidth) => {
    const w = Math.max(1, Math.round(entryWidth))
    const h = Math.max(1, Math.round(w * aspect))
    return `${normalizeCatalogImageUrl(url, w, h, fit)} ${w}w`
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
  fit: CatalogImageFit = 'cover',
) {
  return {
    src: normalizeCatalogImageUrl(url, width, height, fit) || url,
    srcSet: buildCatalogSrcSet(url, width, height, widths, fit),
    sizes,
  }
}

export function buildLqipUrl(url: string) {
  if (!url || url.startsWith('data:')) {
    return ''
  }

  try {
    const parsed = new URL(url)

    if (parsed.hostname.includes(CLOUDINARY_HOST)) {
      const marker = '/upload/'
      const markerIndex = parsed.pathname.indexOf(marker)
      if (markerIndex === -1) {
        return ''
      }

      const cleanPath = stripCloudinaryTransforms(parsed.pathname)
      const prefix = cleanPath.slice(0, cleanPath.indexOf(marker) + marker.length)
      const suffix = cleanPath.slice(cleanPath.indexOf(marker) + marker.length)
      parsed.pathname = `${prefix}f_auto,q_1,e_blur:800,c_fill,g_auto,w_32/${suffix}`
      return parsed.toString()
    }

    if (DEMO_IMAGE_HOSTS.some((host) => parsed.hostname.includes(host))) {
      parsed.searchParams.set('auto', 'format')
      parsed.searchParams.set('fit', 'crop')
      parsed.searchParams.set('w', '32')
      parsed.searchParams.set('q', '10')
      parsed.searchParams.set('blur', '40')
      return parsed.toString()
    }
  } catch {
    return ''
  }

  return ''
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
