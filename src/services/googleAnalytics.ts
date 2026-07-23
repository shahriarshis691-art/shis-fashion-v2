/*
 * Google Analytics (GA4) Service
 * Requires VITE_GA_MEASUREMENT_ID in environment variables
 */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

interface AnalyticsItem {
  item_id: string
  item_name: string
  item_category?: string
  price?: number
  quantity?: number
}

interface CheckoutPayload {
  value: number
  currency?: string
  items: AnalyticsItem[]
}

interface PurchasePayload extends CheckoutPayload {
  transaction_id: string
}

interface ItemListPayload {
  item_list_id: string
  item_list_name: string
  items: AnalyticsItem[]
  currency?: string
}

class GoogleAnalyticsService {
  private measurementId: string | null = null
  private initialized = false

  constructor() {
    this.measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || null
  }

  initialize(): void {
    if (this.initialized) return
    if (!this.measurementId) {
      return
    }

    window.dataLayer = window.dataLayer || []
    window.gtag = (...args: unknown[]): void => {
      window.dataLayer?.push(args)
    }

    window.gtag('js', new Date())
    window.gtag('config', this.measurementId, {
      send_page_view: false,
    })

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`
    document.head.appendChild(script)

    this.initialized = true
  }

  pageView(): void {
    if (!this.initialized || !this.measurementId || !window.gtag) return
    this.track('page_view', {
      page_path: window.location.pathname,
      page_location: window.location.href,
      page_title: document.title,
    })
  }

  search(searchTerm: string): void {
    if (!searchTerm.trim()) {
      return
    }

    this.track('search', {
      search_term: searchTerm.trim(),
    })
  }

  viewItem(item: AnalyticsItem, currency = 'BDT'): void {
    this.track('view_item', {
      currency,
      value: item.price ?? 0,
      items: [item],
    })
  }

  addToBag(item: AnalyticsItem, currency = 'BDT'): void {
    this.track('add_to_cart', {
      currency,
      value: (item.price ?? 0) * (item.quantity ?? 1),
      items: [item],
    })
  }

  beginCheckout(payload: CheckoutPayload): void {
    this.track('begin_checkout', {
      currency: payload.currency ?? 'BDT',
      value: payload.value,
      items: payload.items,
    })
  }

  purchase(payload: PurchasePayload): void {
    this.track('purchase', {
      transaction_id: payload.transaction_id,
      currency: payload.currency ?? 'BDT',
      value: payload.value,
      items: payload.items,
    })
  }

  viewItemList(payload: ItemListPayload): void {
    this.track('view_item_list', {
      item_list_id: payload.item_list_id,
      item_list_name: payload.item_list_name,
      currency: payload.currency ?? 'BDT',
      items: payload.items,
    })
  }

  trackEvent(eventName: string, params: Record<string, unknown>): void {
    this.track(eventName, params)
  }

  private track(eventName: string, params: Record<string, unknown>): void {
    if (!this.initialized || !this.measurementId || !window.gtag) {
      return
    }

    window.gtag('event', eventName, params)
  }
}

export const googleAnalytics = new GoogleAnalyticsService()
