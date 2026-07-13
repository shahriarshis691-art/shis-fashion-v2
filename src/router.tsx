/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ReactElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Loading from './components/ui/Loading'

const HomePage = lazy(() => import('./pages/HomePage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const ShopCategoryPage = lazy(() => import('./pages/ShopCategoryPage'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'))
const NewArrivalsPage = lazy(() => import('./pages/NewArrivalsPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

const withSuspense = (element: ReactElement) => <Suspense fallback={<Loading />}>{element}</Suspense>

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
        path: 'shop/new-arrivals',
        element: withSuspense(<NewArrivalsPage />),
      },
      {
        path: 'shop/:slug',
        element: withSuspense(<ShopCategoryPage />),
      },
      {
        path: 'shop/:category/:productSlug',
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
        path: 'admin',
        element: <Navigate to="/shis-admin/login" replace />,
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
            element: withSuspense(<AdminPage initialView="dashboard" />),
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
