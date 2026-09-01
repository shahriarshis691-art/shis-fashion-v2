import { useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { googleAnalytics } from '../../services/googleAnalytics'
import LuxuryImage from './LuxuryImage'

export interface PromoPopupProps {
  isOpen: boolean
  onClose: () => void
  bannerImage: string
  bannerAlt?: string
  ctaLink?: string
  ctaLabel?: string
}

export default function PromoPopup({
  isOpen,
  onClose,
  bannerImage,
  bannerAlt = 'Limited-time promotion',
  ctaLink = '/shop',
  ctaLabel = 'SHOP NOW',
}: PromoPopupProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const handleCloseRef = useRef(onClose)

  useEffect(() => {
    handleCloseRef.current = onClose
  }, [onClose])

  const handleClose = useCallback(() => {
    googleAnalytics.trackEvent('popup_close', { source: 'homepage_promo' })
    onClose()
  }, [onClose])

  const handleCtaClick = useCallback(() => {
    googleAnalytics.trackEvent('popup_cta_click', { source: 'homepage_promo', destination: ctaLink })
    onClose()
  }, [ctaLink, onClose])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    googleAnalytics.trackEvent('popup_view', { source: 'homepage_promo' })

    previousActiveElement.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseRef.current()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previousActiveElement.current?.focus()
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[92] flex items-center justify-center px-4 py-8 sm:px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={handleClose}
            aria-hidden="true"
          />

          <motion.div
            className="relative w-full max-w-[min(100%,26rem)]"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleClose}
              className="absolute -right-2 -top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-black shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition hover:scale-[1.03] hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              aria-label="Close promotion"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6 18 18" />
                <path d="M18 6 6 18" />
              </svg>
            </button>

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Special promotion"
              className="overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_28px_72px_rgba(0,0,0,0.34)]"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                {bannerImage ? (
                  <LuxuryImage
                    src={bannerImage}
                    alt={bannerAlt}
                    width={832}
                    height={1040}
                    sizes="(max-width: 640px) 92vw, 416px"
                    priority
                    aspectClassName="aspect-[4/5]"
                    className="h-full w-full"
                    imgClassName="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-950 px-6 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white">Limited Offer</p>
                  </div>
                )}
              </div>

              <div className="border-t border-black/8 bg-white p-4 sm:p-5">
                <Link
                  to={ctaLink}
                  onClick={handleCtaClick}
                  className="btn-glass-cta w-full"
                >
                  {ctaLabel}
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
