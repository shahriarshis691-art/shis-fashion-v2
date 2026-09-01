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
