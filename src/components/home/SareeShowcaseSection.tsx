import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Container from '../ui/Container'
import { catalogImageAttrs } from '../../utils/media'
import { SAREE_SHOWCASE_MEDIA } from '../../data/sareeShowcaseMedia'

const SAREE_COPY = {
  eyebrow: "Women's collection",
  subtitle: 'Refined weaves and fluid drapes for celebrations, evenings, and considered everyday elegance.',
  cta: 'Explore Sarees',
} as const

interface SareeShowcaseSectionProps {
  title: string
  href: string
  posterImage?: string
}

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function SareeShowcaseSection({
  title,
  href,
  posterImage = '',
}: SareeShowcaseSectionProps) {
  const rootRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasVideoError, setHasVideoError] = useState(false)
  const [reduceMotion] = useState(prefersReducedMotion)

  const mp4Src = SAREE_SHOWCASE_MEDIA.mp4.trim()
  const webmSrc = SAREE_SHOWCASE_MEDIA.webm.trim()
  const hasVideoSource = Boolean(mp4Src || webmSrc)
  const posterSrc = posterImage.trim() || SAREE_SHOWCASE_MEDIA.poster
  const poster = catalogImageAttrs(posterSrc, 1600, 900, '100vw', [640, 960, 1280, 1600, 1920])

  useEffect(() => {
    const node = rootRef.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return
        }

        if (entry.isIntersecting) {
          setShouldLoad(true)
          setIsInView(true)
          return
        }

        setIsInView(false)
      },
      { rootMargin: '280px 0px', threshold: 0.12 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !shouldLoad || !hasVideoSource || hasVideoError || reduceMotion) {
      return
    }

    if (!isInView) {
      video.pause()
      return
    }

    void video.play().catch(() => {
      if (import.meta.env.DEV) {
        console.warn('[SareeShowcase] Autoplay blocked or source missing.')
      }
    })
  }, [hasVideoError, hasVideoSource, isInView, reduceMotion, shouldLoad])

  const showVideo = hasVideoSource && shouldLoad && !reduceMotion && !hasVideoError

  return (
    <section
      ref={rootRef}
      className="pb-8 sm:pb-10"
      aria-labelledby="saree-showcase-title"
    >
      <div className="relative overflow-hidden bg-[#0a0a0a]">
        <div className="relative aspect-[4/5] min-h-[22rem] sm:aspect-[16/9] sm:min-h-[28rem] lg:min-h-[34rem]">
          <img
            src={poster.src}
            srcSet={poster.srcSet}
            sizes={poster.sizes}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full max-w-none object-cover"
          />

          {showVideo ? (
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full max-w-none object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              poster={poster.src}
              aria-hidden
              onError={() => setHasVideoError(true)}
            >
              {webmSrc ? <source src={webmSrc} type="video/webm" /> : null}
              {mp4Src ? <source src={mp4Src} type="video/mp4" /> : null}
            </video>
          ) : null}

          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.22)_38%,rgba(0,0,0,0.62)_100%)] sm:bg-[linear-gradient(90deg,rgba(0,0,0,0.62)_0%,rgba(0,0,0,0.32)_46%,rgba(0,0,0,0.08)_100%)]"
            aria-hidden
          />

          <Container className="relative z-10 flex h-full items-end pb-8 pt-14 sm:items-end sm:pb-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="flex w-full max-w-2xl flex-col gap-4 sm:max-w-3xl sm:flex-row sm:items-end sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-caption uppercase tracking-[0.14em] text-white/75">
                  {SAREE_COPY.eyebrow}
                </p>
                <h2
                  id="saree-showcase-title"
                  className="mt-1 text-h2 font-bold text-white"
                  style={{ color: '#ffffff', textShadow: '0 2px 14px rgba(0, 0, 0, 0.45)' }}
                >
                  {title || 'Saree'}
                </h2>
                <p
                  className="mt-3 max-w-2xl text-body text-white/88"
                  style={{ textShadow: '0 1px 10px rgba(0, 0, 0, 0.42)' }}
                >
                  {SAREE_COPY.subtitle}
                </p>
              </div>

              <Link
                to={href || '/sarees'}
                className="ui-interactive inline-flex w-full shrink-0 items-center justify-center border border-white px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white hover:text-black sm:w-fit"
              >
                {SAREE_COPY.cta}
              </Link>
            </motion.div>
          </Container>
        </div>
      </div>
    </section>
  )
}
