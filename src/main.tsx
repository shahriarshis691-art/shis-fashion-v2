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

// Initialize analytics only in production builds
if (import.meta.env.PROD) {
  googleAnalytics.initialize()
  metaPixel.initialize()
  sessionReplay.initialize()
  incidentAlerts.initialize()
  errorMonitoring.initialize()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <CartProvider>
        <WishlistProvider>
          <RecentlyViewedProvider>
            <CustomerRecoveryProvider>
              <RouterProvider router={router} />
            </CustomerRecoveryProvider>
          </RecentlyViewedProvider>
        </WishlistProvider>
      </CartProvider>
    </ThemeProvider>
  </StrictMode>,
)
