import { useEffect } from 'react'
import Lenis from 'lenis'
import { getPrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'

/**
 * Owns the single desktop Lenis instance and preserves native mobile scrolling.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const root = document.documentElement
    let frameId: number | null = null
    let lenis: Lenis | null = null

    const stopLenis = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
        frameId = null
      }
      lenis?.destroy()
      lenis = null
    }

    const startLenis = () => {
      if (lenis) {
        return
      }

      lenis = new Lenis({
        duration: 1.2,
        easing: (time: number) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
        touchMultiplier: 1.5,
        infinite: false,
      })

      const raf = (time: number) => {
        lenis?.raf(time)
        frameId = window.requestAnimationFrame(raf)
      }

      frameId = window.requestAnimationFrame(raf)
    }

    const applyMotionPreference = () => {
      const nextReduced = getPrefersReducedMotion()
      const useNativeScrolling = nextReduced || window.innerWidth < 768

      root.classList.toggle('luxury-scroll', !nextReduced)
      root.classList.toggle('reduce-motion', nextReduced)
      root.style.scrollBehavior = useNativeScrolling ? 'auto' : 'smooth'

      if (useNativeScrolling) {
        stopLenis()
      } else {
        startLenis()
      }
    }

    applyMotionPreference()

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    media.addEventListener('change', applyMotionPreference)
    window.addEventListener('resize', applyMotionPreference)

    return () => {
      stopLenis()
      media.removeEventListener('change', applyMotionPreference)
      window.removeEventListener('resize', applyMotionPreference)
      root.classList.remove('luxury-scroll', 'reduce-motion')
      root.style.scrollBehavior = ''
    }
  }, [])

  return null
}
