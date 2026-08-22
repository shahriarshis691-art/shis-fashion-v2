import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  delayMs?: number
  as?: 'div' | 'section' | 'article' | 'li' | 'header'
}

const observed = new WeakMap<Element, () => void>()
let sharedObserver: IntersectionObserver | null = null

function getSharedObserver() {
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
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
  }

  return sharedObserver
}

export default function Reveal({
  children,
  className = '',
  delayMs = 0,
  as: Tag = 'div',
}: RevealProps) {
  const nodeRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const node = nodeRef.current
    if (!node) {
      return
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.add('is-revealed')
      return
    }

    const observer = getSharedObserver()
    if (!observer) {
      node.classList.add('is-revealed')
      return
    }

    const reveal = () => {
      node.classList.add('is-revealed')
      observed.delete(node)
    }

    observed.set(node, reveal)
    observer.observe(node)

    return () => {
      observed.delete(node)
      observer.unobserve(node)
    }
  }, [])

  const style = delayMs
    ? ({ '--reveal-delay': `${delayMs}ms` } as CSSProperties)
    : undefined

  return (
    <Tag
      ref={(node: HTMLElement | null) => {
        nodeRef.current = node
      }}
      className={`luxury-reveal ${className}`.trim()}
      style={style}
    >
      {children}
    </Tag>
  )
}
