import { useEffect, useRef } from 'react'
import { rafThrottle } from './useRafThrottle'
import { getPrefersReducedMotion } from './usePrefersReducedMotion'

export function useParallax(
  ref: React.RefObject<HTMLElement | null>,
  speed = 0.03,
  enabled = true,
) {
  const boundsRef = useRef<{ top: number; height: number } | null>(null)

  useEffect(() => {
    if (!enabled) return

    const node = ref.current
    if (!node) return

    if (getPrefersReducedMotion()) return

    const updateBounds = () => {
      const rect = node.getBoundingClientRect()
      boundsRef.current = {
        top: rect.top + window.scrollY,
        height: rect.height,
      }
    }

    const applyTransform = () => {
      if (!boundsRef.current) {
        updateBounds()
        if (!boundsRef.current) return
      }

      const scrollY = window.scrollY
      const { top, height } = boundsRef.current
      const windowHeight = window.innerHeight

      if (top + height < scrollY - windowHeight || top > scrollY + windowHeight * 2) {
        return
      }

      const center = top + height / 2 - scrollY
      const offset = (center - windowHeight / 2) * speed
      node.style.transform = `translate3d(0, ${offset}px, 0)`
    }

    const throttledApply = rafThrottle(applyTransform)

    updateBounds()
    window.addEventListener('scroll', throttledApply, { passive: true })
    window.addEventListener('resize', updateBounds)

    applyTransform()

    return () => {
      window.removeEventListener('scroll', throttledApply)
      window.removeEventListener('resize', updateBounds)
      throttledApply.cancel()
    }
  }, [enabled, ref, speed])
}
