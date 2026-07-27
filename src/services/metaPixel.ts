interface PixelWindow extends Window {
  fbq?: FbqFunction
  _fbq?: FbqFunction
  __shisPixelState?: {
    initializedIds: string[]
    scriptInjected: boolean
  }
}

type FbqPayload = Record<string, unknown>

type FbqFunction = {
  (command: string, action: string, payload?: FbqPayload): void
  callMethod?: (command: string, action: string, payload?: FbqPayload) => void
  queue?: Array<[string, string, FbqPayload?]>
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

class MetaPixelService {
  private readonly pixelId: string
  private initialized = false
  private lastPageViewKey = ''

  constructor() {
    this.pixelId = (import.meta.env.VITE_META_PIXEL_ID ?? '').trim()
  }

  initialize(): void {
    if (!import.meta.env.PROD || typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    if (!this.pixelId) {
      throw new Error('[MetaPixel] Missing required VITE_META_PIXEL_ID in production.')
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
      if (payload) {
        fbq('track', eventName, payload)
      } else {
        fbq('track', eventName)
      }
    } catch {
      // Ignore runtime errors to avoid blocking user flows.
    }
  }

  private ensureFbqStub(win: PixelWindow): void {
    if (win.fbq && typeof win.fbq === 'function') {
      return
    }

    const stub: FbqFunction = ((command: string, action: string, payload?: FbqPayload) => {
      if (stub.callMethod) {
        stub.callMethod(command, action, payload)
        return
      }

      stub.queue = stub.queue ?? []
      stub.queue.push([command, action, payload])
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
