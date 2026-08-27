import { lazy, Suspense } from 'react'
import { useLocation } from 'react-router-dom'
import Loading from '../components/ui/Loading'

const CategoryHubPage = lazy(() => import('./CategoryHubPage'))
const ShopPage = lazy(() => import('./ShopPage'))

function shouldShowProductListing(pathname: string, search: string) {
  const segment = pathname.replace(/\/$/, '').split('/').filter(Boolean)[0]
  if (segment !== 'women' && segment !== 'men') {
    return false
  }

  const params = new URLSearchParams(search)
  return Boolean(params.get('sub')?.trim() || params.get('q')?.trim())
}

export default function SegmentLandingPage() {
  const location = useLocation()
  const showListing = shouldShowProductListing(location.pathname, location.search)

  return (
    <Suspense fallback={<Loading />}>
      {showListing ? <ShopPage /> : <CategoryHubPage />}
    </Suspense>
  )
}
