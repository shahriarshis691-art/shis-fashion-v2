/**
 * Meta Pixel (Facebook Pixel) Analytics Service
 * Handles all pixel event tracking across the application
 * Requires VITE_META_PIXEL_ID environment variable
 */

// Extend Window interface to include fbq
interface FacebookPixelWindow extends Window {
  fbq?: (command: string, ...args: Array<string | Record<string, unknown>>) => void
}

interface ViewContentData {
  content_name?: string
  content_ids?: string[]
  content_type?: string
  value?: number
  currency?: string
}

interface AddToCartData {
  content_name?: string
  content_ids?: string[]
  content_type?: string
  value?: number
  currency?: string
}

interface SearchData {
  search_string?: string
}

interface InitiateCheckoutData {
  value?: number
  currency?: string
  content_type?: string
  content_ids?: string[]
}

interface PurchaseData {
  value: number
  currency: string
  content_type?: string
  content_ids?: string[]
  content_name?: string
}

class MetaPixelService {
  private pixelId: string | null = null
  private isInitialized = false
  private hasWarnedMissingId = false

  constructor() {
    this.pixelId = import.meta.env.VITE_META_PIXEL_ID || null
  }

  /**
   * Initialize Meta Pixel on app startup
   * Loads the Facebook Pixel SDK script and initializes tracking
   */
  initialize(): void {
    if (this.isInitialized) {
      if (import.meta.env.DEV) {
        console.warn('[MetaPixel] Pixel already initialized, skipping')
      }
      return
    }

    if (!this.pixelId) {
      if (import.meta.env.DEV && !this.hasWarnedMissingId) {
        console.warn('[MetaPixel] Meta Pixel ID not found in environment variables. Set VITE_META_PIXEL_ID.')
        this.hasWarnedMissingId = true
      }
      return
    }

    if (!import.meta.env.PROD) {
      return
    }

    try {
      this.loadPixelScript()
      this.isInitialized = true
      if (import.meta.env.DEV) {
        console.log('[MetaPixel] Initialized successfully with ID:', this.pixelId)
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[MetaPixel] Initialization failed:', error)
      }
    }
  }

  /**
   * Load Meta Pixel script from CDN
   */
  private loadPixelScript(): void {
    // Create and inject pixel script
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)

    // Initialize fbq function
    const fbq = function fbq(command: string, ...args: Array<string | Record<string, unknown>>): void {
      const q = ((fbq as unknown as Record<string, unknown>).q = (fbq as unknown as Record<string, unknown>).q || []) as Array<Array<string | Record<string, unknown>>>
      q.push([command, ...args])
    }
    fbq.push = fbq

    // Set up pixel
    ;(window as FacebookPixelWindow).fbq = fbq
    ;(window as FacebookPixelWindow).fbq?.('init', this.pixelId ?? '')
  }

  /**
   * Fire PageView event (called on every page)
   */
  pageView(): void {
    if (!import.meta.env.PROD) return
    if (!this.isInitialized || !this.pixelId) return
    try {
      ;(window as FacebookPixelWindow).fbq?.('track', 'PageView')
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[MetaPixel] PageView tracking failed:', error)
      }
    }
  }

  /**
   * Fire ViewContent event (on product details page)
   */
  viewContent(data: ViewContentData): void {
    if (!import.meta.env.PROD) return
    if (!this.isInitialized || !this.pixelId) return
    try {
      ;(window as FacebookPixelWindow).fbq?.('track', 'ViewContent', {
        content_name: data.content_name || 'Product',
        content_ids: data.content_ids || [],
        content_type: data.content_type || 'product',
        value: data.value || 0,
        currency: data.currency || 'BDT',
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[MetaPixel] ViewContent tracking failed:', error)
      }
    }
  }

  /**
   * Fire Search event (when user performs search)
   */
  search(data: SearchData): void {
    if (!import.meta.env.PROD) return
    if (!this.isInitialized || !this.pixelId) return
    try {
      ;(window as FacebookPixelWindow).fbq?.('track', 'Search', {
        search_string: data.search_string || '',
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[MetaPixel] Search tracking failed:', error)
      }
    }
  }

  /**
   * Fire AddToCart event (when add to cart button clicked)
   */
  addToCart(data: AddToCartData): void {
    if (!import.meta.env.PROD) return
    if (!this.isInitialized || !this.pixelId) return
    try {
      ;(window as FacebookPixelWindow).fbq?.('track', 'AddToCart', {
        content_name: data.content_name || 'Product',
        content_ids: data.content_ids || [],
        content_type: data.content_type || 'product',
        value: data.value || 0,
        currency: data.currency || 'BDT',
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[MetaPixel] AddToCart tracking failed:', error)
      }
    }
  }

  /**
   * Fire InitiateCheckout event (when checkout begins)
   */
  initiateCheckout(data: InitiateCheckoutData): void {
    if (!import.meta.env.PROD) return
    if (!this.isInitialized || !this.pixelId) return
    try {
      ;(window as FacebookPixelWindow).fbq?.('track', 'InitiateCheckout', {
        value: data.value || 0,
        currency: data.currency || 'BDT',
        content_type: data.content_type || 'product',
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[MetaPixel] InitiateCheckout tracking failed:', error)
      }
    }
  }

  /**
   * Fire Purchase event (only after successful order)
   */
  purchase(data: PurchaseData): void {
    if (!import.meta.env.PROD) return
    if (!this.isInitialized || !this.pixelId) return
    try {
      ;(window as FacebookPixelWindow).fbq?.('track', 'Purchase', {
        value: data.value,
        currency: data.currency,
        content_type: data.content_type || 'product',
        content_ids: data.content_ids || [],
        content_name: data.content_name || 'Order',
      })
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[MetaPixel] Purchase tracking failed:', error)
      }
    }
  }

  /**
   * Check if pixel is initialized
   */
  isReady(): boolean {
    return this.isInitialized && !!this.pixelId
  }

  /**
   * Get current pixel ID (for debugging)
   */
  getPixelId(): string | null {
    return this.pixelId
  }
}

// Export singleton instance
export const metaPixel = new MetaPixelService()
