/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, useEffect, useState, type ReactElement } from 'react'
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Loading from './components/ui/Loading'
import ErrorBoundary from './components/common/ErrorBoundary'

const HomePage = lazy(() => import('./pages/HomePage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const SegmentLandingPage = lazy(() => import('./pages/SegmentLandingPage'))
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
const KidsOversizedTeeCollectionPage = lazy(() => import('./pages/KidsOversizedTeeCollectionPage'))
const OversizedTeeCollectionPage = lazy(() => import('./pages/OversizedTeeCollectionPage'))
const KidsProductDetailPage = lazy(() => import('./pages/KidsProductDetailPage'))
const SareeCollectionPage = lazy(() => import('./pages/SareeCollectionPage'))
const SareeProductDetailPage = lazy(() => import('./pages/SareeProductDetailPage'))
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
    let active = true
    let unsubscribe = () => {}

    void import('./firebase/adminService').then(({ onAdminAuthChanged }) => {
      if (!active) {
        return
      }
      unsubscribe = onAdminAuthChanged((nextUser) => {
        setUser(nextUser)
        setReady(true)
      })
    })

    return () => {
      active = false
      unsubscribe()
    }
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
        element: withSuspense(<SegmentLandingPage />),
      },
      {
        path: 'women/womens-baggy',
        element: withSuspense(<ShopPage />),
      },
      {
        path: 'women/womens-baggy-jeans',
        element: <Navigate to="/women/womens-baggy" replace />,
      },
      {
        path: 'men',
        element: withSuspense(<SegmentLandingPage />),
      },
      {
        path: 'men/pants',
        element: withSuspense(<ShopPage />),
      },
      {
        path: 'men/denim',
        element: <Navigate to="/men/pants" replace />,
      },
      {
        path: 'men/half-shirts',
        element: withSuspense(<ShopPage />),
      },
      {
        path: 'men/panjabi',
        element: withSuspense(<ShopPage />),
      },
      {
        path: 'kids',
        element: withSuspense(<KidsOversizedTeeCollectionPage />),
      },
      {
        path: 'kids/:productSlug',
        element: withSuspense(<KidsProductDetailPage />),
      },
      {
        path: 'category/women',
        element: <Navigate to="/women" replace />,
      },
      {
        path: 'category/men',
        element: <Navigate to="/men" replace />,
      },
      {
        path: 'category/kids',
        element: <Navigate to="/kids" replace />,
      },
      {
        path: 'sarees',
        element: withSuspense(<SareeCollectionPage />),
      },
      {
        path: 'sarees/:productSlug',
        element: withSuspense(<SareeProductDetailPage />),
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
        path: 'shop/oversized-tee',
        element: <Navigate to="/collections/oversized-tee" replace />,
      },
      {
        path: 'oversized-tee',
        element: withSuspense(<OversizedTeeCollectionPage />),
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
        path: 'collections/men-pants',
        element: <Navigate to="/men/pants" replace />,
      },
      {
        path: 'collections/mens-pants',
        element: <Navigate to="/men/pants" replace />,
      },
      {
        path: 'collections/half-shirt',
        element: <Navigate to="/men/half-shirts" replace />,
      },
      {
        path: 'collections/half-shirts/:productSlug',
        element: withSuspense(<ProductDetailPage />),
      },
      {
        path: 'collections/half-shirts',
        element: <Navigate to="/men/half-shirts" replace />,
      },
      {
        path: 'collections/oversized-tee/:productSlug',
        element: withSuspense(<ProductDetailPage />),
      },
      {
        path: 'collections/oversized-tee',
        element: withSuspense(<OversizedTeeCollectionPage />),
      },
      {
        path: 'collections/womens-baggy',
        element: <Navigate to="/women/womens-baggy" replace />,
      },
      {
        path: 'collections/womens-baggy-jeans',
        element: <Navigate to="/women/womens-baggy" replace />,
      },
      {
        path: 'collections/kids',
        element: <RedirectPreserveSearch to="/kids" />,
      },
      {
        path: 'collections/kids-oversized-tee',
        element: <RedirectPreserveSearch to="/kids" />,
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
