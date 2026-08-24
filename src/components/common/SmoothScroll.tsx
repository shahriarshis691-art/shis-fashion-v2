import { useEffect } from 'react'
import { getPrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

/**
 * Native compositor scrolling — not Lenis.
 * JS scroll hijacking (Lenis/Locomotive) fights iOS momentum, sticky headers,
 * and Intersection Observer, and typically regresses INP/CLS on mobile.
 * Apple-grade smoothness comes from GPU layers + native overflow, not a scroll library.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const root = document.documentElement

    const apply = () => {
      const reduced = getPrefersReducedMotion()
      root.classList.toggle('luxury-scroll', !reduced)
      root.classList.toggle('reduce-motion', reduced)
      if (reduced || window.innerWidth < 768) {
        root.style.scrollBehavior = 'auto'
      } else {
        root.style.scrollBehavior = 'smooth'
      }
    }

    apply()

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    media.addEventListener('change', apply)
    return () => {
      media.removeEventListener('change', apply)
      root.classList.remove('luxury-scroll', 'reduce-motion')
      root.style.scrollBehavior = ''
    }
  }, [])

  return null
}
