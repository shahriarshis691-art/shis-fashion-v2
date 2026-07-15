/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, useEffect, useState, type ReactElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Loading from './components/ui/Loading'
import { consumeAdminAccessDeniedFlag, onAdminAuthChanged } from './firebase/adminService'
import HomePage from './pages/HomePage'
import ShopPage from './pages/ShopPage'
import ProductDetailPage from './pages/ProductDetailPage'

const NewArrivalsPage = lazy(() => import('./pages/NewArrivalsPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const withSuspense = (element: ReactElement) => <Suspense fallback={<Loading />}>{element}</Suspense>

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
    if (consumeAdminAccessDeniedFlag()) {
      return <Navigate to="/" replace state={{ adminAccessDenied: true }} />
    }

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
        element: <HomePage />,
      },
      {
        path: 'shop',
        element: <ShopPage />,
      },
      {
        path: 'shop/new-arrivals',
        element: withSuspense(<NewArrivalsPage />),
      },
      {
        path: 'shop/:slug',
        element: <ShopPage />,
      },
      {
        path: 'shop/:category/:productSlug',
        element: <ProductDetailPage />,
      },
      {
        path: 'product/:productSlug',
        element: <ProductDetailPage />,
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
        ],
      },
      {
        path: '*',
        element: withSuspense(<NotFoundPage />),
      },
    ],
  },
])
