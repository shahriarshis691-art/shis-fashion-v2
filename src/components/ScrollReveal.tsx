import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { getPrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

interface ScrollRevealProps {
  children: React.ReactNode
  /** Whether to animate only once */
  once?: boolean
  /** Initial animation values */
  initial?: {
    opacity?: number
    y?: number | string
    scale?: number
    rotate?: number
  }
  /** Values when in view */
  whileInView?: {
    opacity?: number
    y?: number | string
    scale?: number
    rotate?: number
  }
  /** Transition configuration */
  transition?: {
    duration?: number
    delay?: number
  }
  /** Delay the start of the animation in milliseconds */
  delayMs?: number
}

export const ScrollReveal = ({
  children,
  once = true,
  initial = { opacity: 0, y: 40 },
  whileInView = { opacity: 1, y: 0 },
  transition = { duration: 0.8 },
  delayMs = 0,
}: ScrollRevealProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, {
    once,
    amount: 0.1,
  })

  // If prefers reduced motion, don't animate
  if (getPrefersReducedMotion()) {
    return <div ref={ref} className="scroll-reveal">{children}</div>
  }

  // Merge delayMs into transition
  const finalTransition = {
    ...transition,
    delay: (transition.delay ?? 0) + (delayMs / 1000),
  }

  return (
    <motion.div
      ref={ref}
      style={{ contentVisibility: 'auto' }}
      initial={inView ? whileInView : initial}
      animate={inView ? whileInView : initial}
      transition={finalTransition}
      className="will-transform scroll-reveal"
    >
      {children}
    </motion.div>
  )
}