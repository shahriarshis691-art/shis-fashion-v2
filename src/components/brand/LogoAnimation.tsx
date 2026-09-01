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
      <g fill="#111111">
        <path d="M285 100 L278 75 L271 93 L264 75 L257 100 L253 100 L253 95 Q253 73 264 68 Q271 65 278 68 Q285 71 289 82 L289 75 Q285 65 278 62 Q271 59 264 62 Q253 68 250 95 L250 100 L245 100 L245 97 Q245 86 232 84 L210 84 L210 100 L206 100 L206 62 L210 62 L210 80 L228 80 Q241 80 243 93 L243 97 Q243 100 241 100 Z" />
        <path d="M199 80 L199 84 Q199 95 190 100 Q185 103 180 103 Q175 103 172 100 L172 80 L160 80 L160 77 L172 77 L172 70 L177 62 L180 77 L197 77 L197 62 L200 62 L200 77 L206 77 L206 80 Z M175 80 L175 100 Q178 103 180 103 Q185 103 190 97 Q195 92 196 84 L196 80 Z" />
        <path d="M165 100 L162 90 L156 90 L156 100 L152 100 L152 62 L160 62 Q168 62 168 72 Q168 78 162 80 L168 90 L168 92 Q168 95 166 100 Z M156 65 L156 78 L160 78 Q165 78 165 72 Q165 65 160 65 Z" />
      </g>
      <g fill="#111111">
        <circle cx="340" cy="35" r="8" />
        <circle cx="365" cy="45" r="7" />
        <circle cx="380" cy="60" r="7.5" />
      </g>
      <g fill="#111111">
        <path d="M186 164 Q186 156 196 154 L210 152 Q218 150 218 145 Q218 138 206 138 Q196 138 194 145 L190 142 Q193 133 206 133 Q222 133 222 145 Q222 154 210 156 L196 158 Q190 160 190 164 Q190 172 204 172 Q216 172 218 165 L222 168 Q219 177 204 177 Q186 177 186 164 Z" />
        <path d="M228 133 L228 177 L224 177 L224 157 L242 157 L242 177 L238 177 L238 133 L242 133 L242 153 L224 153 L224 133 Z" />
        <path d="M252 133 L256 133 L256 177 L252 177 Z" />
        <path d="M266 164 Q266 156 276 154 L290 152 Q298 150 298 145 Q298 138 286 138 Q276 138 274 145 L270 142 Q273 133 286 133 Q302 133 302 145 Q302 154 290 156 L276 158 Q270 160 270 164 Q270 172 284 172 Q296 172 298 165 L302 168 Q299 177 284 177 Q266 177 266 164 Z" />
      </g>
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
        <g fill="#111111">
          <path d="M285 100 L278 75 L271 93 L264 75 L257 100 L253 100 L253 95 Q253 73 264 68 Q271 65 278 68 Q285 71 289 82 L289 75 Q285 65 278 62 Q271 59 264 62 Q253 68 250 95 L250 100 L245 100 L245 97 Q245 86 232 84 L210 84 L210 100 L206 100 L206 62 L210 62 L210 80 L228 80 Q241 80 243 93 L243 97 Q243 100 241 100 Z" />
          <path d="M199 80 L199 84 Q199 95 190 100 Q185 103 180 103 Q175 103 172 100 L172 80 L160 80 L160 77 L172 77 L172 70 L177 62 L180 77 L197 77 L197 62 L200 62 L200 77 L206 77 L206 80 Z M175 80 L175 100 Q178 103 180 103 Q185 103 190 97 Q195 92 196 84 L196 80 Z" />
          <path d="M165 100 L162 90 L156 90 L156 100 L152 100 L152 62 L160 62 Q168 62 168 72 Q168 78 162 80 L168 90 L168 92 Q168 95 166 100 Z M156 65 L156 78 L160 78 Q165 78 165 72 Q165 65 160 65 Z" />
        </g>
      </motion.g>

      <motion.g animate={{ opacity: [1, 1, 0, 0, 1] }} transition={{ ...t, times: [0, 0.26, 0.36, 0.67, 1] }}>
        <g fill="#111111">
          <path d="M186 164 Q186 156 196 154 L210 152 Q218 150 218 145 Q218 138 206 138 Q196 138 194 145 L190 142 Q193 133 206 133 Q222 133 222 145 Q222 154 210 156 L196 158 Q190 160 190 164 Q190 172 204 172 Q216 172 218 165 L222 168 Q219 177 204 177 Q186 177 186 164 Z" />
          <path d="M228 133 L228 177 L224 177 L224 157 L242 157 L242 177 L238 177 L238 133 L242 133 L242 153 L224 153 L224 133 Z" />
          <path d="M252 133 L256 133 L256 177 L252 177 Z" />
          <path d="M266 164 Q266 156 276 154 L290 152 Q298 150 298 145 Q298 138 286 138 Q276 138 274 145 L270 142 Q273 133 286 133 Q302 133 302 145 Q302 154 290 156 L276 158 Q270 160 270 164 Q270 172 284 172 Q296 172 298 165 L302 168 Q299 177 284 177 Q266 177 266 164 Z" />
        </g>
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
          <g
            stroke="#111111"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="miter"
            strokeLinecap="butt"
            fill="none"
          >
            <path d="M285 100 L278 75 L271 93 L264 75 L257 100 L253 100 L253 95 Q253 73 264 68 Q271 65 278 68 Q285 71 289 82 L289 75 Q285 65 278 62 Q271 59 264 62 Q253 68 250 95 L250 100 L245 100 L245 97 Q245 86 232 84 L210 84 L210 100 L206 100 L206 62 L210 62 L210 80 L228 80 Q241 80 243 93 L243 97 Q243 100 241 100 Z" />
            <path d="M199 80 L199 84 Q199 95 190 100 Q185 103 180 103 Q175 103 172 100 L172 80 L160 80 L160 77 L172 77 L172 70 L177 62 L180 77 L197 77 L197 62 L200 62 L200 77 L206 77 L206 80 Z M175 80 L175 100 Q178 103 180 103 Q185 103 190 97 Q195 92 196 84 L196 80 Z" />
            <path d="M165 100 L162 90 L156 90 L156 100 L152 100 L152 62 L160 62 Q168 62 168 72 Q168 78 162 80 L168 90 L168 92 Q168 95 166 100 Z M156 65 L156 78 L160 78 Q165 78 165 72 Q165 65 160 65 Z" />
          </g>
        </motion.g>

        <motion.g animate={{ opacity: [0, 0, 1, 1, 0] }} transition={{ ...t, times: [0, 0.30, 0.40, 0.67, 1] }}>
          <g
            stroke="#111111"
            strokeWidth="0.75"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="butt"
            fill="none"
          >
            <path d="M186 164 Q186 156 196 154 L210 152 Q218 150 218 145 Q218 138 206 138 Q196 138 194 145 L190 142 Q193 133 206 133 Q222 133 222 145 Q222 154 210 156 L196 158 Q190 160 190 164 Q190 172 204 172 Q216 172 218 165 L222 168 Q219 177 204 177 Q186 177 186 164 Z" />
            <path d="M228 133 L228 177 L224 177 L224 157 L242 157 L242 177 L238 177 L238 133 L242 133 L242 153 L224 153 L224 133 Z" />
            <path d="M252 133 L256 133 L256 177 L252 177 Z" />
            <path d="M266 164 Q266 156 276 154 L290 152 Q298 150 298 145 Q298 138 286 138 Q276 138 274 145 L270 142 Q273 133 286 133 Q302 133 302 145 Q302 154 290 156 L276 158 Q270 160 270 164 Q270 172 284 172 Q296 172 298 165 L302 168 Q299 177 284 177 Q266 177 266 164 Z" />
          </g>
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
