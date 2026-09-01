import { motion } from 'framer-motion'
import type { Easing } from 'framer-motion'
import { useSyncExternalStore } from 'react'

interface LogoAnimationProps {
  className?: string
  whiteBackground?: boolean
}

const DURATION = 4.5

const subscribe = () => () => {}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined') return () => {}
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    getReducedMotionSnapshot,
    () => false,
  )
}

function StaticLogo({ className, whiteBackground = true }: LogoAnimationProps) {
  return (
    <svg
      viewBox="0 0 456 200"
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="SHIS Fashion logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      {whiteBackground && <rect width="456" height="200" fill="#FFFFFF" />}
      <text
        x="228"
        y="110"
        fontFamily="Arial, sans-serif"
        fontSize="100"
        fontWeight="bold"
        textAnchor="middle"
        fill="#111111"
        letterSpacing="-1"
      >
        شـــيـــس
      </text>
      <g fill="#111111">
        <circle cx="340" cy="35" r="8" />
        <circle cx="365" cy="45" r="7" />
        <circle cx="380" cy="60" r="7.5" />
      </g>
      <text
        x="228"
        y="175"
        fontFamily="Arial, sans-serif"
        fontSize="28"
        fontWeight="300"
        textAnchor="middle"
        fill="#111111"
        letterSpacing="5"
      >
        S H I S
      </text>
    </svg>
  )
}

export default function LogoAnimation({ className, whiteBackground = true }: LogoAnimationProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const isClient = useSyncExternalStore(subscribe, () => true, () => false)

  if (!isClient || prefersReducedMotion) {
    return <StaticLogo className={className} whiteBackground={whiteBackground} />
  }

  const t = {
    duration: DURATION,
    repeat: Infinity,
    ease: 'linear' as Easing,
  }

  return (
    <svg
      viewBox="0 0 456 200"
      className={className}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="SHIS Fashion animated logo"
      xmlns="http://www.w3.org/2000/svg"
    >
      {whiteBackground && <rect width="456" height="200" fill="#FFFFFF" />}

      <motion.line
        x1="80"
        y1={0}
        x2="376"
        y2={0}
        stroke="#111111"
        strokeWidth="0.75"
        animate={{ y1: [0, 0, 200, 200, 0], y2: [0, 0, 200, 200, 0], opacity: [0, 0, 0.6, 0.6, 0] }}
        transition={{ ...t, times: [0, 0.2, 0.35, 0.65, 1] }}
      />

      <motion.g animate={{ opacity: [1, 1, 0, 0, 1] }} transition={{ ...t, times: [0, 0.22, 0.32, 0.73, 1] }}>
        <circle cx="340" cy="35" r="8" fill="#111111" />
        <circle cx="365" cy="45" r="7" fill="#111111" />
        <circle cx="380" cy="60" r="7.5" fill="#111111" />
      </motion.g>

      <motion.g animate={{ opacity: [1, 1, 0, 0, 1] }} transition={{ ...t, times: [0, 0.24, 0.34, 0.70, 1] }}>
        <text
          x="228"
          y="110"
          fontFamily="Arial, sans-serif"
          fontSize="100"
          fontWeight="bold"
          textAnchor="middle"
          fill="#111111"
          letterSpacing="-1"
        >
          شـــيـــس
        </text>
      </motion.g>

      <motion.g animate={{ opacity: [1, 1, 0, 0, 1] }} transition={{ ...t, times: [0, 0.26, 0.36, 0.67, 1] }}>
        <text
          x="228"
          y="175"
          fontFamily="Arial, sans-serif"
          fontSize="28"
          fontWeight="300"
          textAnchor="middle"
          fill="#111111"
          letterSpacing="5"
        >
          S H I S
        </text>
      </motion.g>

      <motion.g
        animate={{ scale: [1, 1, 1.03, 1.03, 1] }}
        transition={{ ...t, times: [0, 0.2, 0.4, 0.6, 1] }}
        style={{ transformOrigin: '228px 100px' }}
      >
        <motion.g animate={{ opacity: [0, 0, 1, 1, 0] }} transition={{ ...t, times: [0, 0.26, 0.36, 0.73, 1] }}>
          <g
            fill="none"
            stroke="#111111"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="miter"
            strokeLinecap="butt"
          >
            <circle cx="340" cy="35" r="8" />
            <circle cx="365" cy="45" r="7" />
            <circle cx="380" cy="60" r="7.5" />
          </g>
          <g
            stroke="#111111"
            strokeWidth="0.75"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="butt"
          >
            <line x1="340" y1="35" x2="340" y2="18" />
            <line x1="365" y1="45" x2="365" y2="28" />
            <line x1="380" y1="60" x2="380" y2="43" />
          </g>
        </motion.g>

        <motion.g animate={{ opacity: [0, 0, 1, 1, 0] }} transition={{ ...t, times: [0, 0.28, 0.38, 0.70, 1] }}>
          <text
            x="228"
            y="110"
            fontFamily="Arial, sans-serif"
            fontSize="100"
            fontWeight="bold"
            textAnchor="middle"
            fill="none"
            stroke="#111111"
            strokeWidth="1.2"
            letterSpacing="-1"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="miter"
            strokeLinecap="butt"
          >
            شـــيـــس
          </text>
        </motion.g>

        <motion.g animate={{ opacity: [0, 0, 1, 1, 0] }} transition={{ ...t, times: [0, 0.30, 0.40, 0.67, 1] }}>
          <text
            x="228"
            y="175"
            fontFamily="Arial, sans-serif"
            fontSize="28"
            fontWeight="300"
            textAnchor="middle"
            fill="none"
            stroke="#111111"
            strokeWidth="0.8"
            letterSpacing="5"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="miter"
            strokeLinecap="butt"
          >
            S H I S
          </text>
        </motion.g>

        <motion.g animate={{ opacity: [0, 0, 0.35, 0.35, 0] }} transition={{ ...t, times: [0, 0.28, 0.38, 0.62, 1] }}>
          <g
            stroke="#111111"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="butt"
          >
            <line x1="110" y1="188" x2="346" y2="188" />
            <line x1="110" y1="188" x2="110" y2="194" />
            <line x1="346" y1="188" x2="346" y2="194" />
          </g>
        </motion.g>
      </motion.g>
    </svg>
  )
}
