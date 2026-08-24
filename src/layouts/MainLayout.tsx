import { useEffect, useMemo, useRef, useState, lazy, Suspense, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import NewsletterCard from '../components/layout/NewsletterCard'
import ScrollToTop from '../components/common/ScrollToTop'
import PageTransition from '../components/common/PageTransition'
import SoftLaunchGate from '../components/common/SoftLaunchGate'
import SmoothScroll from '../components/common/SmoothScroll'
import { useWelcomePopup } from '../hooks/useWelcomePopup'
import { metaPixel } from '../services/metaPixel'
import { googleAnalytics } from '../services/googleAnalytics'
import { incidentAlerts } from '../services/incidentAlerts'
import { applySeoMetadata, setRuntimeSeoOverrides } from '../utils/seo'
import { evaluateSoftLaunchAccess } from '../services/softLaunch'
import { captureCampaignAttribution } from '../utils/attribution'
import { subscribeToHomepageContent, subscribeNewsletter } from '../firebase/adminService'
import { normalizeCatalogImageUrl } from '../utils/media'

const GOOGLE_SITE_VERIFICATION = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION ?? ''
const STABILIZATION_HEARTBEAT_SESSION_KEY = 'shis-stabilization-heartbeat-sent'

const MiniCartConfirmation = lazy(() => import('../components/common/MiniCartConfirmation'))
const WelcomePopup = lazy(() => import('../components/common/WelcomePopup'))
const AbandonedCartBanner = lazy(() => import('../components/common/AbandonedCartBanner'))
const WhatsAppWidget = lazy(() => import('../components/common/WhatsAppWidget'))

function DeferredChrome({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }

    if (typeof win.requestIdleCallback === 'function') {
      const idleId = win.requestIdleCallback(() => setReady(true), { timeout: 1200 })
      return () => win.cancelIdleCallback?.(idleId)
    }

    const timeoutId = window.setTimeout(() => setReady(true), 400)
    return () => window.clearTimeout(timeoutId)
  }, [])

  if (!ready) {
    return null
  }

  return children
}

function getOversizedCampaignLandingPath(pathname: string, search: string) {
  const params = new URLSearchParams(search)
  const campaign = [
    params.get('utm_campaign'),
    params.get('campaign'),
    params.get('meta_campaign'),
    params.get('fb_campaign'),
  ].filter(Boolean).join(' ').trim().toLowerCase()

  const isOversizedCampaign = campaign.includes('oversized')
    || (campaign.includes('tee') && !campaign.includes('saree') && !campaign.includes('kids'))

  if (!isOversizedCampaign) {
    return null
  }

  if (pathname === '/shop/oversized-tee' || pathname === '/shop/oversized-tee/') {
    return null
  }

  return { pathname: '/shop/oversized-tee', search }
}

function shouldSendStabilizationHeartbeat() {
  if (typeof window === 'undefined') {
    return false
  }

  if (window.sessionStorage.getItem(STABILIZATION_HEARTBEAT_SESSION_KEY) === '1') {
    return false
  }

  window.sessionStorage.setItem(STABILIZATION_HEARTBEAT_SESSION_KEY, '1')
  return true
}

export default function MainLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const lastSoftLaunchEventRef = useRef('')
  const lastTrackedPathRef = useRef('')
  const softLaunchDecision = useMemo(
    () => evaluateSoftLaunchAccess(location.pathname, location.search),
    [location.pathname, location.search],
  )
  const [heroImage, setHeroImage] = useState('')

  const { isPopupOpen, closePopup, completePopup } = useWelcomePopup()
  const oversizedCampaignLanding = useMemo(
    () => getOversizedCampaignLandingPath(location.pathname, location.search),
    [location.pathname, location.search],
  )

  useEffect(() => {
    captureCampaignAttribution(location.search, location.pathname)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!oversizedCampaignLanding) {
      return
    }

    navigate(oversizedCampaignLanding, { replace: true })
  }, [navigate, oversizedCampaignLanding])

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => {
      const normalized = normalizeCatalogImageUrl(content.heroImage ?? '', 1400, 900)
      setHeroImage(normalized)
      setRuntimeSeoOverrides({
        home: content.seo?.home,
        shop: content.seo?.shop,
        oversized: content.seo?.oversized,
      })
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const routeKey = `${location.pathname}${location.search}`
    if (lastTrackedPathRef.current === routeKey) {
      return
    }

    lastTrackedPathRef.current = routeKey
    metaPixel.trackPageView(location.pathname, location.search)
    googleAnalytics.pageView()
  }, [location.pathname, location.search])

  useEffect(() => {
    applySeoMetadata(location.pathname)

    if (GOOGLE_SITE_VERIFICATION) {
      let element = document.head.querySelector('meta[name="google-site-verification"]') as HTMLMetaElement | null
      if (!element) {
        element = document.createElement('meta')
        document.head.appendChild(element)
      }

      element.setAttribute('name', 'google-site-verification')
      element.setAttribute('content', GOOGLE_SITE_VERIFICATION)
    }
  }, [location.pathname])

  useEffect(() => {
    if (!shouldSendStabilizationHeartbeat()) {
      return
    }

    googleAnalytics.trackEvent('stabilization_heartbeat', {
      path: location.pathname,
      soft_launch_mode: softLaunchDecision.mode,
      soft_launch_allowed: softLaunchDecision.allowed,
      launch_mode_enabled: String(import.meta.env.VITE_LAUNCH_MODE ?? 'false').trim().toLowerCase() === 'true',
      ga_configured: Boolean(import.meta.env.VITE_GA_MEASUREMENT_ID),
      meta_pixel_configured: Boolean(import.meta.env.VITE_META_PIXEL_ID),
    })
  }, [location.pathname, softLaunchDecision.allowed, softLaunchDecision.mode])

  useEffect(() => {
    const eventKey = [
      location.pathname,
      location.search,
      softLaunchDecision.mode,
      softLaunchDecision.reason,
      softLaunchDecision.allowed ? 'allow' : 'block',
    ].join('|')

    if (lastSoftLaunchEventRef.current === eventKey) {
      return
    }

    lastSoftLaunchEventRef.current = eventKey

    googleAnalytics.trackEvent('soft_launch_decision', {
      mode: softLaunchDecision.mode,
      reason: softLaunchDecision.reason,
      bucket: softLaunchDecision.bucket,
      allowed: softLaunchDecision.allowed,
      path: location.pathname,
    })

    if (!softLaunchDecision.allowed) {
      googleAnalytics.trackEvent('soft_launch_blocked', {
        mode: softLaunchDecision.mode,
        reason: softLaunchDecision.reason,
        bucket: softLaunchDecision.bucket,
      })

      incidentAlerts.notify({
        source: 'soft-launch',
        message: `Blocked access (${softLaunchDecision.mode}:${softLaunchDecision.reason}) on ${location.pathname}`,
        fatal: false,
      })
    }
  }, [
    location.pathname,
    location.search,
    softLaunchDecision.allowed,
    softLaunchDecision.bucket,
    softLaunchDecision.mode,
    softLaunchDecision.reason,
  ])

  const handleSubscribe = async (email: string) => {
    const result = await subscribeNewsletter(email)
    return result
  }

  const handleWelcomeBack = (email: string) => {
    completePopup(email)
  }

  if (!softLaunchDecision.allowed) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        <ScrollToTop />
        <SoftLaunchGate decision={softLaunchDecision} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <SmoothScroll />
      <ScrollToTop />
      <Navbar />
      <main className="page-shell min-h-screen">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      {!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/shis-admin') ? <NewsletterCard /> : null}
      <Footer />
      <DeferredChrome>
        <Suspense fallback={null}>
          <AbandonedCartBanner isWelcomePopupOpen={isPopupOpen} />
          <MiniCartConfirmation />
          {!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/shis-admin') ? <WhatsAppWidget /> : null}
          {!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/shis-admin') ? (
            <WelcomePopup
              isOpen={isPopupOpen}
              onClose={closePopup}
              onSubscribe={handleSubscribe}
              onWelcomeBack={handleWelcomeBack}
              heroImage={heroImage}
            />
          ) : null}
        </Suspense>
      </DeferredChrome>
    </div>
  )
}