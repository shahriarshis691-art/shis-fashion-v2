import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Container from './ui/Container'
import { isDemoImageUrl, normalizeCatalogImageUrl } from '../utils/media'

export interface HeroMediaItem {
  type: 'image' | 'video'
  src: string
  alt?: string
}

interface HeroBannerProps {
  media: HeroMediaItem[]
  eyebrow?: string
  title: string
  subtitle: string
  cta?: string
  primaryLink?: string
  secondaryCta?: string
  secondaryLink?: string
  onSecondaryClick?: () => void
}

const IMAGE_SLIDE_DURATION = 5000
const VIDEO_MAX_DURATION = 15000

const IMAGE_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"%3E%3Crect width="1200" height="1200" fill="%23f6f6f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="%23808080"%3ESHIS Fashion%3C/text%3E%3C/svg%3E'

export default function HeroBanner({
  media,
  eyebrow = 'SHIS FASHION',
  title,
  subtitle,
  cta = 'Shop now',
  primaryLink = '/shop',
  secondaryCta,
  secondaryLink,
  onSecondaryClick,
}: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasMedia = media.length > 0

  useEffect(() => {
    if (!hasMedia || media.length === 1) {
      return
    }

    const currentMedia = media[currentIndex]
    if (!currentMedia) {
      return
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (currentMedia.type === 'image') {
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % media.length)
      }, IMAGE_SLIDE_DURATION)
    } else {
      timerRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % media.length)
      }, VIDEO_MAX_DURATION)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [currentIndex, media, hasMedia])

  useEffect(() => {
    const video = videoRefs.current.get(currentIndex)
    if (video) {
      video.play().catch((err) => {
        if (import.meta.env.DEV) {
          console.warn('[HeroBanner] Autoplay blocked or failed:', err)
        }
      })
    }

    videoRefs.current.forEach((v, index) => {
      if (index !== currentIndex) {
        v.pause()
      }
    })
  }, [currentIndex, media])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <section className="border-b border-black/10">
      <div className="relative overflow-hidden bg-black">
        <div className="relative aspect-[4/5] min-h-[23rem] sm:aspect-[16/9] sm:min-h-[28rem] lg:min-h-[34rem]">
          {hasMedia ? (
            media.map((item, index) => {
              const isActive = index === currentIndex
              const isDemo = item.type === 'image' && isDemoImageUrl(item.src)
              const mediaSrc =
                item.type === 'image' ? normalizeCatalogImageUrl(item.src, 1400, 900) : item.src

              return (
                <div
                  key={index}
                  className="absolute inset-0 h-full w-full transition-opacity duration-500 ease-in-out"
                  style={{
                    opacity: isActive ? 1 : 0,
                    zIndex: isActive ? 10 : 0,
                    pointerEvents: isActive ? 'auto' : 'none',
                  }}
                >
                  {item.type === 'video' ? (
                    <video
                      key={mediaSrc}
                      ref={(el) => {
                        if (el) {
                          videoRefs.current.set(index, el)
                          if (isActive) {
                            el.play().catch(() => {})
                          }
                        } else {
                          videoRefs.current.delete(index)
                        }
                      }}
                      src={mediaSrc}
                      autoPlay
                      muted
                      loop={media.length === 1}
                      playsInline
                      preload="metadata"
                      onCanPlay={(e) => {
                        if (isActive) {
                          e.currentTarget.play().catch(() => {})
                        }
                      }}
                      onEnded={() => {
                        if (media.length > 1) {
                          setCurrentIndex((prev) => (prev + 1) % media.length)
                        } else {
                          const video = videoRefs.current.get(index)
                          if (video) {
                            video.currentTime = 0
                            video.play().catch(() => {})
                          }
                        }
                      }}
                      className={`h-full w-full object-cover ${isDemo ? 'shis-media-tone' : ''}`}
                    />
                  ) : (
                    <img
                      src={mediaSrc || IMAGE_PLACEHOLDER}
                      alt={item.alt || ''}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src = IMAGE_PLACEHOLDER
                      }}
                      className={`h-full w-full object-cover ${isDemo ? 'shis-media-tone' : ''}`}
                    />
                  )}
                </div>
              )
            })
          ) : (
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#1b1b1b,#454545)]" />
          )}

          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.4)_52%,rgba(0,0,0,0.05)_100%)]" />

          <Container className="relative z-10 flex h-full items-end pb-8 pt-14 sm:items-center sm:py-0">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-[17rem] sm:max-w-[25rem]"
            >
              <p
                className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/80"
                style={{ textShadow: '0 1px 8px rgba(0, 0, 0, 0.4)' }}
              >
                {eyebrow}
              </p>
              <h1
                className="mt-2 text-h1 text-white"
                style={{ color: '#ffffff', textShadow: '0 2px 14px rgba(0, 0, 0, 0.45)' }}
              >
                {title}
              </h1>
              <p
                className="mt-3 text-sm leading-6 text-white/85 sm:text-base sm:leading-7"
                style={{ textShadow: '0 1px 10px rgba(0, 0, 0, 0.42)' }}
              >
                {subtitle}
              </p>
              <div className="mt-5 flex w-full flex-wrap items-center gap-2.5 sm:w-auto">
                <Link
                  to={primaryLink ?? '/shop'}
                  className="ui-interactive inline-flex w-full items-center justify-center border border-white bg-white px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-black hover:bg-white/90 sm:w-auto"
                >
                  {cta}
                </Link>
                {onSecondaryClick ? (
                  <button
                    type="button"
                    onClick={onSecondaryClick}
                    className="ui-interactive inline-flex w-full items-center justify-center border border-white/80 bg-black/20 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/10 sm:w-auto"
                  >
                    {secondaryCta || 'Explore Our Brands'}
                  </button>
                ) : secondaryCta && secondaryLink ? (
                  <Link
                    to={secondaryLink}
                    className="ui-interactive inline-flex w-full items-center justify-center border border-white/80 bg-black/20 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-white hover:bg-white/10 sm:w-auto"
                  >
                    {secondaryCta}
                  </Link>
                ) : null}
              </div>
            </motion.div>
          </Container>

          {hasMedia && media.length > 1 && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
              {media.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? 'w-4 bg-white'
                      : 'w-1.5 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
