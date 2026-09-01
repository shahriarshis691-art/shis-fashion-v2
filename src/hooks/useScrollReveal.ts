import { useEffect, useRef } from 'react'
import { getPrefersReducedMotion } from './usePrefersReducedMotion'

interface ScrollRevealOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

const observed = new WeakMap<Element, () => void>()
let sharedObserver: IntersectionObserver | null = null

function getSharedObserver(threshold: number, rootMargin: string) {
  if (typeof window === 'undefined') {
    return null
  }

  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue
          }

          observed.get(entry.target)?.()
          sharedObserver?.unobserve(entry.target)
        }
      },
      { rootMargin, threshold },
    )
  }

  return sharedObserver
}

export function useScrollReveal<T extends HTMLElement>(
  options: ScrollRevealOptions = {},
) {
  const { threshold = 0.15, rootMargin = '0px 0px -10% 0px', once = true } = options
  const nodeRef = useRef<T | null>(null)

  useEffect(() => {
    const node = nodeRef.current
    if (!node) {
      return
    }

    if (getPrefersReducedMotion()) {
      node.classList.add('scroll-revealed')
      return
    }

    const observer = getSharedObserver(threshold, rootMargin)
    if (!observer) {
      node.classList.add('scroll-revealed')
      return
    }

    const reveal = () => {
      node.classList.add('scroll-revealed')
      observed.delete(node)
      if (once) {
        observer?.unobserve(node)
      }
    }

    observed.set(node, reveal)
    observer.observe(node)

    return () => {
      observed.delete(node)
      observer.unobserve(node)
    }
  }, [threshold, rootMargin, once])

  return nodeRef
}

export function useScrollProgress<T extends HTMLElement>() {
  const nodeRef = useRef<T | null>(null)
  const frameRef = useRef(0)

  useEffect(() => {
    const node = nodeRef.current
    if (!node) {
      return
    }

    if (getPrefersReducedMotion()) {
      return
    }

    const updateProgress = () => {
      const rect = node.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const elementHeight = rect.height

      const visibleTop = Math.max(0, -rect.top)
      const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)
      const progress = Math.max(0, Math.min(1, visibleTop / (elementHeight || 1)))

      const isInView = rect.top < windowHeight && rect.bottom > 0
      const visibilityRatio = Math.max(0, Math.min(1, visibleHeight / (elementHeight || 1)))

      node.style.setProperty('--scroll-progress', String(progress))
      node.style.setProperty('--scroll-visibility', String(visibilityRatio))
      node.style.setProperty('--scroll-in-view', isInView ? '1' : '0')
    }

    const throttledUpdate = () => {
      if (frameRef.current) {
        return
      }
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = 0
        updateProgress()
      })
    }

    throttledUpdate()
    window.addEventListener('scroll', throttledUpdate, { passive: true })
    window.addEventListener('resize', throttledUpdate, { passive: true })

    return () => {
      window.removeEventListener('scroll', throttledUpdate)
      window.removeEventListener('resize', throttledUpdate)
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = 0
      }
    }
  }, [])

  return nodeRef
}
