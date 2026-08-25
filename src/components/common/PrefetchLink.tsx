import { useEffect, useRef, type ComponentProps, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

type PrefetchLinkProps = Omit<ComponentProps<typeof Link>, 'prefetch'> & {
  children: ReactNode
  /** Dynamic import factory invoked once when the link enters (near) the viewport. */
  prefetchModule?: () => Promise<unknown>
  rootMargin?: string
}

/**
 * React Router Link with IntersectionObserver-based route chunk prefetch
 * (Vite equivalent of Next.js `<Link prefetch>`).
 */
export default function PrefetchLink({
  children,
  prefetchModule,
  rootMargin = '240px 0px',
  onMouseEnter,
  onFocus,
  ...props
}: PrefetchLinkProps) {
  const nodeRef = useRef<HTMLAnchorElement | null>(null)
  const prefetchedRef = useRef(false)

  const runPrefetch = () => {
    if (prefetchedRef.current || !prefetchModule) {
      return
    }

    prefetchedRef.current = true
    void prefetchModule()
  }

  useEffect(() => {
    const node = nodeRef.current
    if (!node || !prefetchModule) {
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          runPrefetch()
          observer.disconnect()
        }
      },
      { rootMargin, threshold: 0.01 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [prefetchModule, rootMargin])

  return (
    <Link
      {...props}
      ref={nodeRef}
      onMouseEnter={(event) => {
        runPrefetch()
        onMouseEnter?.(event)
      }}
      onFocus={(event) => {
        runPrefetch()
        onFocus?.(event)
      }}
    >
      {children}
    </Link>
  )
}
