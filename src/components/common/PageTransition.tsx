import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(true)
  const prevPathRef = useRef(location.pathname)

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname
      setIsVisible(false)
      const timeout = setTimeout(() => {
        setIsVisible(true)
      }, 16)
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [location.pathname])

  return (
    <div
      key={location.pathname}
      className={
        isVisible
          ? 'opacity-100 translate-y-0 transition-all duration-180 ease-[cubic-bezier(0.16,1,0.3,1)]'
          : 'opacity-0 translate-y-[4px] transition-all duration-180 ease-[cubic-bezier(0.16,1,0.3,1)]'
      }
    >
      {children}
    </div>
  )
}
