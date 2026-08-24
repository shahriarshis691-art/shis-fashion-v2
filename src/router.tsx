/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, useEffect, useState, type ReactElement } from 'react'
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Loading from './components/ui/Loading'
import ErrorBoundary from './components/common/ErrorBoundary'
import { onAdminAuthChanged } from './firebase/adminService'

const HomePage = lazy(() => import('./pages/HomePage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const CollectionListingPage = lazy(() => import('./pages/CollectionListingPage'))
const NewArrivalsPage = lazy(() => import('./pages/NewArrivalsPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const BrandsPage = lazy(() => import('./pages/BrandsPage'))
const BrandDetailPage = lazy(() => import('./pages/BrandDetailPage'))
const FounderDetailPage = lazy(() => import('./pages/FounderDetailPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const OrderLookupPage = lazy(() => import('./pages/OrderLookupPage'))
const SalePage = lazy(() => import('./pages/SalePage'))
const HalfShirtCollectionPage = lazy(() => import('./pages/HalfShirtCollectionPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const withSuspense = (element: ReactElement) => (
  <ErrorBoundary>
    <Suspense fallback={<Loading />}>{element}</Suspense>
  </ErrorBoundary>
)

function RedirectPreserveSearch({ to }: { to: string }) {
  const location = useLocation()
  return <Navigate to={{ pathname: to, search: location.search, hash: location.hash }} replace />
}

function AdminRouteGuard({ children }: { children: ReactElement }) {
  const [user, setUser] = useState<{ uid: string; email: string | null } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const unsubscribe = onAdminAuthChanged((nextUser) => {
      setUser(nextUser)
      setReady(true)
    })

    return unsubscribe
  }, [])

  if (!ready) {
    return <Loading />
  }

  if (!user) {
    return <Navigate to="/shis-admin/login" replace />
  }

  return children
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: withSuspense(<HomePage />),
      },
      {
        path: 'shop',
        element: withSuspense(<ShopPage />),
      },
      {
        path: 'women',
        element: withSuspense(<ShopPage />),
      },
      {
        path: 'men',
        element: withSuspense(<ShopPage />),
      },
      {
        path: 'kids',
        element: withSuspense(<ShopPage />),
      },
      {
        path: 'sarees',
        element: withSuspense(<ShopPage />),
      },
      {
        path: 'saree',
        element: <RedirectPreserveSearch to="/sarees" />,
      },
      {
        path: 'shop/new-arrivals',
        element: withSuspense(<NewArrivalsPage />),
      },
      {
        path: 'new-arrivals',
        element: withSuspense(<NewArrivalsPage />),
      },
      {
        path: 'best-sellers',
        element: <RedirectPreserveSearch to="/shop/best-sellers" />,
      },
      {
        path: 'shop/:slug',
        element: withSuspense(<ShopPage />),
      },
      {
        path: 'shop/:category/:productSlug',
        element: withSuspense(<ProductDetailPage />),
      },
      {
        path: 'collections/half-shirt',
        element: withSuspense(<HalfShirtCollectionPage />),
      },
      {
        path: 'collections/:slug',
        element: withSuspense(<CollectionListingPage />),
      },
      {
        path: 'product/:productSlug',
        element: withSuspense(<ProductDetailPage />),
      },
      {
        path: 'cart',
        element: withSuspense(<CartPage />),
      },
      {
        path: 'checkout',
        element: withSuspense(<CheckoutPage />),
      },
      {
        path: 'order-success',
        element: withSuspense(<OrderSuccessPage />),
      },
      {
        path: 'about',
        element: withSuspense(<AboutPage />),
      },
      {
        path: 'contact',
        element: withSuspense(<ContactPage />),
      },
      {
        path: 'brands',
        element: withSuspense(<BrandsPage />),
      },
      {
        path: 'brands/:slug',
        element: withSuspense(<BrandDetailPage />),
      },
      {
        path: 'founder',
        element: withSuspense(<FounderDetailPage />),
      },
      {
        path: 'sale',
        element: withSuspense(<SalePage />),
      },
      {
        path: 'privacy',
        element: withSuspense(<PrivacyPage />),
      },
      {
        path: 'terms',
        element: withSuspense(<TermsPage />),
      },
      {
        path: 'track-order',
        element: withSuspense(<OrderLookupPage />),
      },
      {
        path: 'admin',
        element: withSuspense(<AdminRouteGuard><AdminPage initialView="dashboard" /></AdminRouteGuard>),
      },
      {
        path: 'shis-admin',
        children: [
          {
            index: true,
            element: <Navigate to="/shis-admin/login" replace />,
          },
          {
            path: 'login',
            element: withSuspense(<AdminPage initialView="login" />),
          },
          {
            path: 'dashboard',
            element: withSuspense(<AdminRouteGuard><AdminPage initialView="dashboard" /></AdminRouteGuard>),
          },
        ],
      },
      {
        path: '*',
        element: withSuspense(<NotFoundPage />),
      },
    ],
  },
])
