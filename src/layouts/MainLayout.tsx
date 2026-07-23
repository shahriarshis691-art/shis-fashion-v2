import { useEffect, useMemo, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import ScrollToTop from '../components/common/ScrollToTop'
import PageTransition from '../components/common/PageTransition'
import SoftLaunchGate from '../components/common/SoftLaunchGate'
import { metaPixel } from '../services/metaPixel'
import { googleAnalytics } from '../services/googleAnalytics'
import { incidentAlerts } from '../services/incidentAlerts'
import { applySeoMetadata } from '../utils/seo'
import { evaluateSoftLaunchAccess } from '../services/softLaunch'

const GOOGLE_SITE_VERIFICATION = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION ?? ''

export default function MainLayout() {
  const location = useLocation()
  const lastSoftLaunchEventRef = useRef('')
  const softLaunchDecision = useMemo(
    () => evaluateSoftLaunchAccess(location.pathname, location.search),
    [location.pathname, location.search],
  )

  useEffect(() => {
    // Track PageView on every page change
    metaPixel.pageView()
    googleAnalytics.pageView()
  }, [location.pathname])

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
      <ScrollToTop />
      <Navbar />
      <main className="page-shell min-h-screen">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  )
}
