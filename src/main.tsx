import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { CartProvider } from './context/CartContext'
import { CartDrawerProvider } from './context/CartDrawerContext'
import { WishlistProvider } from './context/WishlistContext'
import { RecentlyViewedProvider } from './context/RecentlyViewedContext'
import { CustomerRecoveryProvider } from './context/CustomerRecoveryContext'
import { router } from './router'
import { metaPixel } from './services/metaPixel'
import { googleAnalytics } from './services/googleAnalytics'
import { sessionReplay } from './services/sessionReplay'
import { errorMonitoring } from './services/errorMonitoring'
import { incidentAlerts } from './services/incidentAlerts'

/**
 * Defer third-party analytics boot so LCP/INP on first paint is not blocked
 * by gtag / pixel / clarity script injection.
 */
function scheduleAnalyticsBoot() {
  if (!import.meta.env.PROD) {
    return
  }

  const boot = () => {
    googleAnalytics.initialize()
    metaPixel.initialize()
    sessionReplay.initialize()
    incidentAlerts.initialize()
    errorMonitoring.initialize()
  }

  const win = window as Window & {
    requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number
  }

  if (typeof win.requestIdleCallback === 'function') {
    win.requestIdleCallback(boot, { timeout: 3500 })
    return
  }

  window.setTimeout(boot, 1800)
}

scheduleAnalyticsBoot()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <CustomerRecoveryProvider>
        <CartProvider>
          <CartDrawerProvider>
          <WishlistProvider>
            <RecentlyViewedProvider>
              <RouterProvider router={router} />
            </RecentlyViewedProvider>
          </WishlistProvider>
          </CartDrawerProvider>
        </CartProvider>
      </CustomerRecoveryProvider>
    </ThemeProvider>
  </StrictMode>,
)
