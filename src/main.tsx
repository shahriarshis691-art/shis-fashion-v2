import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { RecentlyViewedProvider } from './context/RecentlyViewedContext'
import { CustomerRecoveryProvider } from './context/CustomerRecoveryContext'
import { router } from './router'
import { metaPixel } from './services/metaPixel'
import { googleAnalytics } from './services/googleAnalytics'
import { sessionReplay } from './services/sessionReplay'
import { errorMonitoring } from './services/errorMonitoring'
import { incidentAlerts } from './services/incidentAlerts'
import Lenis from 'lenis'

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

// Initialize Lenis for smooth scrolling
if (typeof window !== 'undefined') {
const lenis = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    touchMultiplier: 2,
    infinite: false,
  })

  function raf(time: number) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }

  requestAnimationFrame(raf)
}

scheduleAnalyticsBoot()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <CustomerRecoveryProvider>
        <CartProvider>
          <WishlistProvider>
            <RecentlyViewedProvider>
              <RouterProvider router={router} />
            </RecentlyViewedProvider>
          </WishlistProvider>
        </CartProvider>
      </CustomerRecoveryProvider>
    </ThemeProvider>
  </StrictMode>,
)
