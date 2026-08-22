import { useEffect, useRef } from 'react'

/**
 * Coalesces high-frequency events (scroll/resize) to one callback per animation frame.
 * Avoids layout thrashing from repeated DOM reads in the same frame.
 */
export function rafThrottle(fn: () => void) {
  let frame = 0

  const run = () => {
    if (frame) {
      return
    }

    frame = window.requestAnimationFrame(() => {
      frame = 0
      fn()
    })
  }

  run.cancel = () => {
    if (frame) {
      window.cancelAnimationFrame(frame)
      frame = 0
    }
  }

  return run
}

export function useRafScroll(onScroll: (scrollY: number) => void) {
  const callbackRef = useRef(onScroll)

  useEffect(() => {
    callbackRef.current = onScroll
  }, [onScroll])

  useEffect(() => {
    const handleScroll = rafThrottle(() => {
      callbackRef.current(window.scrollY)
    })

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      handleScroll.cancel()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])
}
