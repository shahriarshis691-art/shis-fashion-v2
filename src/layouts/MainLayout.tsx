import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import ScrollToTop from '../components/common/ScrollToTop'
import PageTransition from '../components/common/PageTransition'
import { metaPixel } from '../services/metaPixel'

export default function MainLayout() {
  const location = useLocation()

  useEffect(() => {
    // Track PageView on every page change
    metaPixel.pageView()
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <ScrollToTop />
      <Navbar />
      <main className="page-shell min-h-screen pt-24">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  )
}
