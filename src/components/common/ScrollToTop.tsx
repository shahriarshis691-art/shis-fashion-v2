import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, search } = useLocation()
  const prevPathRef = useRef(pathname)

  useEffect(() => {
    const isSameRoute = prevPathRef.current === pathname
    prevPathRef.current = pathname

    if (isSameRoute) {
      return
    }

    window.scrollTo(0, 0)
  }, [pathname, search])

  return null
}
