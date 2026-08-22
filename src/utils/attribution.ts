export const CAMPAIGN_QUERY_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
  'ttclid',
  'msclkid',
] as const

export type CampaignQueryKey = (typeof CAMPAIGN_QUERY_KEYS)[number]

export interface CampaignAttribution {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  fbclid?: string
  gclid?: string
  ttclid?: string
  msclkid?: string
  landingPath?: string
  landingSearch?: string
  capturedAt?: string
}

const STORAGE_KEY = 'shis-fashion-attribution'
const FIRST_TOUCH_KEY = 'shis-fashion-attribution-first'

function sanitizeValue(value: string, maxLength = 180) {
  let next = ''
  for (const char of value) {
    const code = char.charCodeAt(0)
    if (code >= 32 && char !== '<' && char !== '>') {
      next += char
    }
  }

  return next.trim().slice(0, maxLength)
}

function readStorage(key: string): CampaignAttribution | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as CampaignAttribution
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function writeStorage(key: string, value: CampaignAttribution) {
  if (typeof window === 'undefined') {
    return
  }

  const serialized = JSON.stringify(value)
  window.sessionStorage.setItem(key, serialized)
  window.localStorage.setItem(key, serialized)
}

export function parseCampaignAttribution(search: string, pathname = ''): CampaignAttribution | null {
  const params = new URLSearchParams(search.startsWith('?') ? search : search ? `?${search}` : '')
  const next: CampaignAttribution = {}

  for (const key of CAMPAIGN_QUERY_KEYS) {
    const value = sanitizeValue(params.get(key) ?? '')
    if (value) {
      next[key] = value
    }
  }

  if (!Object.keys(next).length) {
    return null
  }

  const cleanPath = pathname.split('?')[0]?.split('#')[0] ?? ''
  if (cleanPath.startsWith('/')) {
    next.landingPath = sanitizeValue(cleanPath, 200)
  }

  const cleanSearch = params.toString()
  if (cleanSearch) {
    next.landingSearch = sanitizeValue(`?${cleanSearch}`, 300)
  }

  next.capturedAt = new Date().toISOString()
  return next
}

export function captureCampaignAttribution(search: string, pathname = ''): CampaignAttribution | null {
  const incoming = parseCampaignAttribution(search, pathname)
  if (!incoming) {
    return getStoredAttribution()
  }

  writeStorage(STORAGE_KEY, incoming)
  if (!readStorage(FIRST_TOUCH_KEY)) {
    writeStorage(FIRST_TOUCH_KEY, incoming)
  }

  return incoming
}

export function getStoredAttribution(): CampaignAttribution | null {
  return readStorage(STORAGE_KEY)
}

export function getFirstTouchAttribution(): CampaignAttribution | null {
  return readStorage(FIRST_TOUCH_KEY) ?? getStoredAttribution()
}

export function hasCampaignSignals(search: string): boolean {
  return parseCampaignAttribution(search) !== null
}

export function hasStoredCampaignAttribution(): boolean {
  const stored = getStoredAttribution()
  if (!stored) {
    return false
  }

  return CAMPAIGN_QUERY_KEYS.some((key) => Boolean(stored[key]))
}

export function getOrderAttribution(): CampaignAttribution | null {
  const lastTouch = getStoredAttribution()
  const firstTouch = getFirstTouchAttribution()
  if (!lastTouch && !firstTouch) {
    return null
  }

  return {
    ...(firstTouch ?? {}),
    ...(lastTouch ?? {}),
    landingPath: firstTouch?.landingPath ?? lastTouch?.landingPath,
    landingSearch: firstTouch?.landingSearch ?? lastTouch?.landingSearch,
    capturedAt: firstTouch?.capturedAt ?? lastTouch?.capturedAt,
  }
}

export function pickCampaignSearch(search: string): string {
  const params = new URLSearchParams(search)
  const next = new URLSearchParams()

  for (const key of CAMPAIGN_QUERY_KEYS) {
    const value = params.get(key)?.trim()
    if (value) {
      next.set(key, value)
    }
  }

  const query = next.toString()
  return query ? `?${query}` : ''
}

export function mergeCampaignSearch(targetSearch: string, sourceSearch: string): string {
  const target = new URLSearchParams(targetSearch.startsWith('?') ? targetSearch.slice(1) : targetSearch)
  const source = new URLSearchParams(sourceSearch.startsWith('?') ? sourceSearch.slice(1) : sourceSearch)

  for (const key of CAMPAIGN_QUERY_KEYS) {
    if (!target.get(key)) {
      const value = source.get(key)?.trim()
      if (value) {
        target.set(key, value)
      }
    }
  }

  const query = target.toString()
  return query ? `?${query}` : ''
}

function readCookie(name: string) {
  if (typeof document === 'undefined') {
    return ''
  }

  const parts = document.cookie.split(';')
  for (const part of parts) {
    const [cookieName, ...rest] = part.trim().split('=')
    if (cookieName === name) {
      return decodeURIComponent(rest.join('='))
    }
  }

  return ''
}

export function getMetaFbp(): string {
  return readCookie('_fbp')
}

export function getMetaFbc(): string {
  const cookie = readCookie('_fbc')
  if (cookie) {
    return cookie
  }

  const attribution = getStoredAttribution()
  const fbclid = attribution?.fbclid?.trim()
  if (!fbclid) {
    return ''
  }

  const capturedMs = attribution?.capturedAt ? Date.parse(attribution.capturedAt) : Date.now()
  const timestamp = Number.isFinite(capturedMs) ? Math.floor(capturedMs / 1000) : Math.floor(Date.now() / 1000)
  return `fb.1.${timestamp}.${fbclid}`
}
