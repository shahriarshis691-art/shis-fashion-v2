import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import ScrollToTop from '../components/common/ScrollToTop'
import PageTransition from '../components/common/PageTransition'
import { metaPixel } from '../services/metaPixel'

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://shisfashion.com').replace(/\/$/, '')

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null

  if (!element) {
    element = document.createElement(selector.startsWith('link') ? 'link' : 'meta') as HTMLMetaElement | HTMLLinkElement
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value))
}

function getRouteMetadata(pathname: string) {
  if (pathname === '/') {
    return {
      title: 'SHIS Fashion | Premium Essentials',
      description: 'Premium fashion essentials designed with elevated comfort, texture, and timeless style.',
    }
  }

  if (pathname === '/shop/new-arrivals') {
    return {
      title: 'New Arrivals | SHIS Fashion',
      description: 'Discover the latest arrivals from SHIS Fashion with elevated comfort and premium styling.',
    }
  }

  if (pathname === '/shop/best-sellers') {
    return {
      title: 'Best Sellers | SHIS Fashion',
      description: 'Browse the most in-demand SHIS Fashion pieces curated from the live collection.',
    }
  }

  if (pathname.startsWith('/shop/')) {
    return {
      title: 'Shop Collection | SHIS Fashion',
      description: 'Explore category-specific SHIS Fashion collections and shop premium essentials.',
    }
  }

  if (pathname === '/checkout') {
    return {
      title: 'Checkout | SHIS Fashion',
      description: 'Complete your SHIS Fashion order with our fast mobile-friendly checkout.',
    }
  }

  if (pathname === '/cart') {
    return {
      title: 'Cart | SHIS Fashion',
      description: 'Review your selected SHIS Fashion products before checkout.',
    }
  }

  if (pathname === '/about') {
    return {
      title: 'About | SHIS Fashion',
      description: 'Learn about SHIS Fashion and our premium design approach built around comfort and luxury.',
    }
  }

  if (pathname === '/contact') {
    return {
      title: 'Contact | SHIS Fashion',
      description: 'Get in touch with SHIS Fashion for customer support, order help, and brand inquiries.',
    }
  }

  if (pathname === '/brands') {
    return {
      title: 'Brands and Founder | SHIS Group',
      description: 'Explore XEROXII, CERAVO, and RANGKUTIR with brand details, founder profile, and direct contact options.',
    }
  }

  return {
    title: 'SHIS Fashion',
    description: 'Premium fashion essentials with refined comfort and timeless styling.',
  }
}

export default function MainLayout() {
  const location = useLocation()

  useEffect(() => {
    // Track PageView on every page change
    metaPixel.pageView()
  }, [location.pathname])

  useEffect(() => {
    const metadata = getRouteMetadata(location.pathname)
    const canonicalUrl = `${SITE_URL}${location.pathname === '/' ? '' : location.pathname}`

    document.title = metadata.title
    upsertMeta('meta[name="description"]', { name: 'description', content: metadata.description })
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: metadata.title })
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: metadata.description })
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: metadata.title })
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: metadata.description })
    upsertMeta('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl })
  }, [location.pathname])

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
