interface PixelWindow extends Window {
  fbq?: FbqFunction
  _fbq?: FbqFunction
  __shisPixelState?: {
    initializedIds: string[]
    scriptInjected: boolean
  }
}

type FbqPayload = Record<string, unknown>
type FbqArg = FbqPayload | string | number | boolean

type FbqFunction = {
  (command: string, action: string, payload?: FbqArg, extra?: string): void
  callMethod?: (command: string, action: string, payload?: FbqArg, extra?: string) => void
  queue?: Array<[string, string, FbqArg?, string?]>
  push?: FbqFunction
  loaded?: boolean
  version?: string
}

interface PixelBasePayload {
  content_name?: string
  content_ids?: string[]
  content_type?: string
  value?: number
  currency?: string
  brand?: string
}

interface PixelSearchPayload {
  search_string: string
}

interface PixelPurchasePayload extends PixelBasePayload {
  value: number
  currency: string
}

const PIXEL_SCRIPT_ID = 'shis-meta-pixel-sdk'
const PIXEL_SCRIPT_SRC = 'https://connect.facebook.net/en_US/fbevents.js'
const META_FALLBACK_CURRENCY = 'USD'
const META_SUPPORTED_CURRENCIES = new Set([
  'AED', 'ARS', 'AUD', 'BOB', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'COP',
  'CRC', 'CZK', 'DKK', 'DOP', 'DZD', 'EGP', 'EUR', 'GBP', 'GTQ', 'HKD',
  'HNL', 'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KES', 'KRW', 'MOP',
  'MXN', 'MYR', 'NIO', 'NOK', 'NZD', 'PEN', 'PHP', 'PKR', 'PLN', 'PYG',
  'QAR', 'RON', 'RUB', 'SAR', 'SEK', 'SGD', 'THB', 'TRY', 'TWD', 'UAH',
  'USD', 'UYU', 'VES', 'VND', 'ZAR',
])

class MetaPixelService {
  private readonly pixelId: string
  private initialized = false
  private lastPageViewKey = ''
  private missingPixelIdWarned = false

  constructor() {
    this.pixelId = (import.meta.env.VITE_META_PIXEL_ID ?? '').trim()
  }

  initialize(): void {
    if (!import.meta.env.PROD || typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    if (!this.pixelId) {
      if (!this.missingPixelIdWarned) {
        this.missingPixelIdWarned = true
        console.warn('[MetaPixel] Missing VITE_META_PIXEL_ID in production. Pixel tracking disabled.')
      }
      return
    }

    if (this.initialized) {
      return
    }

    const win = window as PixelWindow
    if (!win.__shisPixelState) {
      win.__shisPixelState = {
        initializedIds: [],
        scriptInjected: false,
      }
    }

    this.ensureFbqStub(win)
    this.ensureSingleScript()

    if (!win.__shisPixelState.initializedIds.includes(this.pixelId)) {
      win.fbq?.('set', 'autoConfig', false, this.pixelId)
      win.fbq?.('init', this.pixelId)
      win.__shisPixelState.initializedIds.push(this.pixelId)
    }

    this.initialized = true
  }

  trackPageView(pathname: string, search = ''): void {
    const pageKey = `${pathname}${search}`
    if (this.lastPageViewKey === pageKey) {
      return
    }

    this.lastPageViewKey = pageKey
    this.trackStandardEvent('PageView')
  }

  trackViewContent(payload: PixelBasePayload): void {
    this.trackStandardEvent('ViewContent', {
      content_name: payload.content_name ?? 'Product',
      content_ids: payload.content_ids ?? [],
      content_type: payload.content_type ?? 'product',
      value: payload.value ?? 0,
      currency: payload.currency ?? 'BDT',
      brand: payload.brand,
    })
  }

  trackAddToCart(payload: PixelBasePayload): void {
    this.trackStandardEvent('AddToCart', {
      content_name: payload.content_name ?? 'Product',
      content_ids: payload.content_ids ?? [],
      content_type: payload.content_type ?? 'product',
      value: payload.value ?? 0,
      currency: payload.currency ?? 'BDT',
      brand: payload.brand,
    })
  }

  trackInitiateCheckout(payload: PixelBasePayload): void {
    this.trackStandardEvent('InitiateCheckout', {
      value: payload.value ?? 0,
      currency: payload.currency ?? 'BDT',
      content_type: payload.content_type ?? 'product',
      content_ids: payload.content_ids ?? [],
      brand: payload.brand,
    })
  }

  trackPurchase(payload: PixelPurchasePayload): void {
    this.trackStandardEvent('Purchase', {
      value: payload.value,
      currency: payload.currency,
      content_type: payload.content_type ?? 'product',
      content_ids: payload.content_ids ?? [],
      content_name: payload.content_name ?? 'Order',
      brand: payload.brand,
    })
  }

  trackSearch(payload: PixelSearchPayload): void {
    this.trackStandardEvent('Search', {
      search_string: payload.search_string,
    })
  }

  trackLead(payload: PixelBasePayload = {}): void {
    this.trackStandardEvent('Lead', { ...payload })
  }

  trackCompleteRegistration(payload: PixelBasePayload = {}): void {
    this.trackStandardEvent('CompleteRegistration', { ...payload })
  }

  getPixelId(): string {
    return this.pixelId
  }

  private trackStandardEvent(eventName: string, payload?: FbqPayload): void {
    if (!import.meta.env.PROD || typeof window === 'undefined') {
      return
    }

    const fbq = (window as PixelWindow).fbq
    if (!fbq) {
      return
    }

    try {
      const sanitizedPayload = this.sanitizePayload(payload)

      if (sanitizedPayload) {
        fbq('track', eventName, sanitizedPayload)
      } else {
        fbq('track', eventName)
      }
    } catch {
      // Ignore runtime errors to avoid blocking user flows.
    }
  }

  private sanitizePayload(payload?: FbqPayload): FbqPayload | undefined {
    if (!payload) {
      return undefined
    }

    const sanitized: FbqPayload = { ...payload }

    if ('currency' in sanitized) {
      const rawCurrency = sanitized.currency
      if (typeof rawCurrency === 'string') {
        const normalizedCurrency = rawCurrency.trim().toUpperCase()
        if (/^[A-Z]{3}$/.test(normalizedCurrency) && META_SUPPORTED_CURRENCIES.has(normalizedCurrency)) {
          sanitized.currency = normalizedCurrency
        } else {
          sanitized.currency = META_FALLBACK_CURRENCY
        }
      } else {
        sanitized.currency = META_FALLBACK_CURRENCY
      }
    }

    if ('value' in sanitized) {
      const numericValue = Number(sanitized.value)
      if (Number.isFinite(numericValue)) {
        sanitized.value = numericValue
        if (!('currency' in sanitized)) {
          sanitized.currency = META_FALLBACK_CURRENCY
        }
      } else {
        delete sanitized.value
        if ('currency' in sanitized) {
          delete sanitized.currency
        }
      }
    }

    return Object.keys(sanitized).length ? sanitized : undefined
  }

  private ensureFbqStub(win: PixelWindow): void {
    if (win.fbq && typeof win.fbq === 'function') {
      return
    }

    const stub: FbqFunction = ((command: string, action: string, payload?: FbqArg, extra?: string) => {
      if (stub.callMethod) {
        stub.callMethod(command, action, payload, extra)
        return
      }

      stub.queue = stub.queue ?? []
      stub.queue.push([command, action, payload, extra])
    }) as FbqFunction

    stub.queue = []
    stub.loaded = true
    stub.version = '2.0'
    stub.push = stub
    win.fbq = stub

    if (!win._fbq) {
      win._fbq = stub
    }
  }

  private ensureSingleScript(): void {
    const byId = document.getElementById(PIXEL_SCRIPT_ID) as HTMLScriptElement | null
    const bySrc = document.querySelector(`script[src="${PIXEL_SCRIPT_SRC}"]`) as HTMLScriptElement | null
    const byContainsSrc = document.querySelector('script[src*="connect.facebook.net/en_US/fbevents.js"]') as HTMLScriptElement | null
    const existing = byId ?? bySrc ?? byContainsSrc

    if (existing) {
      if (!existing.id) {
        existing.id = PIXEL_SCRIPT_ID
      }
      return
    }

    const script = document.createElement('script')
    script.id = PIXEL_SCRIPT_ID
    script.async = true
    script.src = PIXEL_SCRIPT_SRC
    document.head.appendChild(script)
  }
}

export const metaPixel = new MetaPixelService()
