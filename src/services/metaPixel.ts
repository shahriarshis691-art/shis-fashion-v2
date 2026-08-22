import { sendMetaCapiEvent } from './metaCapi'
import { createMetaEventId, isMetaCapiEventName } from '../utils/metaEvents'

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

type FbqEventOptions = {
  eventID?: string
}

type FbqFunction = {
  (command: string, action: string, payload?: FbqArg, extra?: string | FbqEventOptions): void
  callMethod?: (command: string, action: string, payload?: FbqArg, extra?: string | FbqEventOptions) => void
  queue?: Array<[string, string, FbqArg | undefined, string | FbqEventOptions | undefined]>
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
  event_id?: string
}

export interface MetaPixelUserData {
  email?: string
  phone?: string
  firstName?: string
  city?: string
  country?: string
}

export interface MetaPixelTrackOptions {
  eventId?: string
  userData?: MetaPixelUserData
}

const PIXEL_SCRIPT_ID = 'shis-meta-pixel-sdk'
const PIXEL_SCRIPT_SRC = 'https://connect.facebook.net/en_US/fbevents.js'
const META_FALLBACK_CURRENCY = 'USD'
const INITIATE_CHECKOUT_DEDUPE_WINDOW_MS = 10000
const META_SUPPORTED_CURRENCIES = new Set([
  'AED', 'ARS', 'AUD', 'BOB', 'BDT', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'COP',
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
  private metaCurrencyWarningFilterInstalled = false
  private lastInitiateCheckoutSignature = ''
  private lastInitiateCheckoutTrackedAt = 0

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
    this.installMetaCurrencyWarningFilter()
    this.ensureSingleScript()

    if (!win.__shisPixelState.initializedIds.includes(this.pixelId)) {
      win.fbq?.('set', 'autoConfig', false, this.pixelId)
      win.fbq?.('init', this.pixelId)
      win.__shisPixelState.initializedIds.push(this.pixelId)
    }

    this.initialized = true
  }

  trackPageView(pathname: string, search = '', options?: MetaPixelTrackOptions): void {
    const pageKey = `${pathname}${search}`
    if (this.lastPageViewKey === pageKey) {
      return
    }

    this.lastPageViewKey = pageKey
    this.trackStandardEvent('PageView', undefined, options)
  }

  trackViewContent(payload: PixelBasePayload, options?: MetaPixelTrackOptions): void {
    this.trackStandardEvent('ViewContent', {
      content_name: payload.content_name ?? 'Product',
      content_ids: payload.content_ids ?? [],
      content_type: payload.content_type ?? 'product',
      value: payload.value ?? 0,
      currency: payload.currency ?? META_FALLBACK_CURRENCY,
      brand: payload.brand,
    }, options)
  }

  trackAddToCart(payload: PixelBasePayload, options?: MetaPixelTrackOptions): void {
    this.trackStandardEvent('AddToCart', {
      content_name: payload.content_name ?? 'Product',
      content_ids: payload.content_ids ?? [],
      content_type: payload.content_type ?? 'product',
      value: payload.value ?? 0,
      currency: payload.currency ?? META_FALLBACK_CURRENCY,
      brand: payload.brand,
    }, options)
  }

  trackInitiateCheckout(payload: PixelBasePayload, options?: MetaPixelTrackOptions): void {
    const eventPayload = {
      value: payload.value ?? 0,
      currency: payload.currency ?? META_FALLBACK_CURRENCY,
      content_type: payload.content_type ?? 'product',
      content_ids: payload.content_ids ?? [],
      brand: payload.brand,
    }

    const signature = [
      Number(eventPayload.value ?? 0),
      String(eventPayload.currency ?? META_FALLBACK_CURRENCY).trim().toUpperCase(),
      (eventPayload.content_ids ?? []).join(','),
      eventPayload.content_type ?? 'product',
    ].join('|')

    const now = Date.now()
    if (
      this.lastInitiateCheckoutSignature === signature
      && now - this.lastInitiateCheckoutTrackedAt < INITIATE_CHECKOUT_DEDUPE_WINDOW_MS
    ) {
      return
    }

    this.lastInitiateCheckoutSignature = signature
    this.lastInitiateCheckoutTrackedAt = now

    this.trackStandardEvent('InitiateCheckout', eventPayload, options)
  }

  trackPurchase(payload: PixelPurchasePayload, options?: MetaPixelTrackOptions): void {
    this.trackStandardEvent('Purchase', {
      value: payload.value,
      currency: payload.currency,
      content_type: payload.content_type ?? 'product',
      content_ids: payload.content_ids ?? [],
      content_name: payload.content_name ?? 'Order',
      brand: payload.brand,
    }, {
      ...options,
      eventId: options?.eventId ?? payload.event_id,
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

  private trackStandardEvent(eventName: string, payload?: FbqPayload, options?: MetaPixelTrackOptions): void {
    if (!import.meta.env.PROD || typeof window === 'undefined') {
      return
    }

    const fbq = (window as PixelWindow).fbq
    const eventId = options?.eventId?.trim() || createMetaEventId(eventName)
    const sanitizedPayload = this.sanitizePayload(payload)

    if (fbq) {
      try {
        if (sanitizedPayload) {
          fbq('track', eventName, sanitizedPayload, { eventID: eventId })
        } else {
          fbq('track', eventName, {}, { eventID: eventId })
        }
      } catch {
        // Ignore runtime errors to avoid blocking user flows.
      }
    }

    if (isMetaCapiEventName(eventName)) {
      sendMetaCapiEvent({
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        customData: sanitizedPayload,
        userData: options?.userData,
      })
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

    const stub: FbqFunction = ((command: string, action: string, payload?: FbqArg, extra?: string | FbqEventOptions) => {
      if (stub.callMethod) {
        stub.callMethod(command, action, payload, extra)
        return
      }

      stub.queue = stub.queue ?? []
      stub.queue.push([command, action, payload, extra ?? undefined])
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

  private installMetaCurrencyWarningFilter(): void {
    if (this.metaCurrencyWarningFilterInstalled || typeof window === 'undefined') {
      return
    }

    const warn = console.warn.bind(console)
    console.warn = (...args: unknown[]) => {
      const firstArg = typeof args[0] === 'string' ? args[0] : ''
      if (firstArg.includes('[Meta Pixel] - Invalid parameter format for currency')) {
        return
      }

      warn(...args)
    }

    this.metaCurrencyWarningFilterInstalled = true
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
