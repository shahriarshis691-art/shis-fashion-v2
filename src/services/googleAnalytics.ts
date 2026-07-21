/*
 * Google Analytics (GA4) Service
 * Requires VITE_GA_MEASUREMENT_ID in environment variables
 */

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: any[]) => void
  }
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
    window.gtag = function gtag(...args: any[]): void {
      window.dataLayer?.push(args)
    }

    window.gtag && window.gtag('js', new Date())
    window.gtag && window.gtag('config', this.measurementId, {
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
    window.gtag('event', 'page_view', {
      page_path: window.location.pathname,
      page_location: window.location.href,
      page_title: document.title,
    })
  }
}

export const googleAnalytics = new GoogleAnalyticsService()
