import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { googleAnalytics } from '../../services/googleAnalytics'
import { metaPixel } from '../../services/metaPixel'
import { setPopupCompleted } from '../../firebase/adminService'

interface WelcomePopupProps {
  isOpen: boolean
  onClose: () => void
  onSubscribe: (email: string) => Promise<{ subscriberId: string; couponCode: string; couponId: string }>
  onWelcomeBack: (email: string) => void
  heroImage?: string
}

interface FormState {
  email: string
  error: string
  submitting: boolean
  success: boolean
  touched: boolean
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function copyToClipboard(value: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false
  }

  return navigator.clipboard.writeText(value).then(
    () => true,
    () => false,
  )
}

export default function WelcomePopup({ isOpen, onClose, onSubscribe, onWelcomeBack, heroImage = '' }: WelcomePopupProps) {
  const [form, setForm] = useState<FormState>({ email: '', error: '', submitting: false, success: false, touched: false })
  const [showWelcomeBack, setShowWelcomeBack] = useState(false)
  const [welcomeBackEmail, setWelcomeBackEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const handleCloseRef = useRef(onClose)

  useEffect(() => {
    handleCloseRef.current = onClose
  }, [onClose])

  const popupImage = heroImage || ''

  useEffect(() => {
    if (!isOpen) {
      return
    }

    googleAnalytics.trackEvent('popup_view', { source: 'welcome_discount' })
    metaPixel.trackEvent('popup_view', { source: 'welcome_discount' })

    previousActiveElement.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseRef.current()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previousActiveElement.current?.focus()
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    googleAnalytics.trackEvent('popup_close', { source: 'welcome_discount' })
    metaPixel.trackEvent('popup_close', { source: 'welcome_discount' })
    onClose()
  }, [onClose])

  const handleSubscribe = async (email: string) => {
    try {
      await onSubscribe(email)
      setPopupCompleted(email)
      googleAnalytics.trackEvent('popup_signup', { source: 'welcome_discount', email })
      metaPixel.trackEvent('popup_signup', { source: 'welcome_discount', email })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const lower = message.toLowerCase()
      if (lower.includes('already') || lower.includes('welcome back')) {
        setWelcomeBackEmail(email)
        setShowWelcomeBack(true)
        setForm((current) => ({ ...current, submitting: false }))
        setPopupCompleted(email)
        onWelcomeBack(email)
        return
      }
      throw error
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmed = form.email.trim()
    if (!trimmed) {
      setForm((current) => ({ ...current, error: 'Please enter your email address.', touched: true }))
      return
    }

    if (!isValidEmail(trimmed)) {
      setForm((current) => ({ ...current, error: 'Invalid email address.', touched: true }))
      return
    }

    setForm((current) => ({ ...current, error: '', touched: true, submitting: true }))

    try {
      await handleSubscribe(trimmed)
      setForm((current) => ({ ...current, success: true, submitting: false }))
    } catch {
      setForm((current) => ({ ...current, submitting: false, error: 'Something went wrong. Please try again.' }))
    }
  }

  const handleWelcomeBackClaim = async () => {
    setForm((current) => ({ ...current, submitting: true }))
    try {
      await onSubscribe(welcomeBackEmail)
      setForm((current) => ({ ...current, success: true, submitting: false }))
    } catch {
      setForm((current) => ({ ...current, submitting: false, error: 'Something went wrong. Please try again.' }))
    }
  }

  const handleCopyCode = async () => {
    const success = await copyToClipboard('WELCOME-5OFF')
    if (success) {
      setCopied(true)
      googleAnalytics.trackEvent('coupon_copy', { source: 'welcome_discount', coupon: 'WELCOME-5OFF' })
      metaPixel.trackEvent('coupon_copy', { source: 'welcome_discount', coupon: 'WELCOME-5OFF' })
    }
  }

  const showError = form.touched && form.error

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Welcome discount"
            className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-[16px] border border-white/10 bg-black shadow-[0_30px_70px_rgba(0,0,0,0.45)] sm:flex-row"
            style={{ width: '95%', maxWidth: '900px' }}
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <div className="relative h-48 w-full sm:h-auto sm:w-[40%]">
              {popupImage ? (
                <img
                  src={popupImage}
                  alt="SHIS Fashion collection"
                  loading="lazy"
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none'
                  }}
                  onLoad={() => setImageLoaded(true)}
                  className={`h-full w-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:bg-gradient-to-r" />
            </div>

            <div className="relative flex w-full flex-1 flex-col p-6 sm:p-8">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={handleClose}
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] sm:right-4 sm:top-4"
                aria-label="Close welcome popup"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6 18 18" />
                  <path d="M18 6 6 18" />
                </svg>
              </button>

              {showWelcomeBack ? (
                <motion.div
                  className="flex flex-1 flex-col items-center justify-center text-center"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Welcome Back!</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">You're already a SHIS Fashion member.</h2>
                  <p className="mt-3 text-sm leading-7 text-white/75">
                    Your exclusive welcome discount is waiting. Check your email for your coupon code, or visit any product page to apply it at checkout.
                  </p>
                  <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={handleWelcomeBackClaim}
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#D4AF37] bg-[#D4AF37] px-6 py-3 text-[15px] font-semibold leading-none text-black transition hover:bg-[#c9a62e]"
                    >
                      Claim My Discount
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-transparent px-6 py-3 text-[15px] font-semibold leading-none text-white transition hover:bg-white/10"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </motion.div>
              ) : form.success ? (
                <motion.div
                  className="flex flex-1 flex-col items-center justify-center text-center"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Welcome to SHIS Fashion!</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Your exclusive discount has been unlocked</h2>
                  <p className="mt-3 text-sm leading-7 text-white/75">
                    Use this exclusive coupon code at checkout to save on your first order.
                  </p>

                  <div className="mt-6 w-full">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/60">Coupon Code</p>
                    <div className="mt-2 flex items-center justify-center gap-3">
                      <div className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center">
                        <p className="text-xl font-semibold text-[#D4AF37]">WELCOME-5OFF</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#D4AF37] bg-[#D4AF37] px-6 py-3 text-[15px] font-semibold leading-none text-black transition hover:bg-[#c9a62e]"
                    >
                      {copied ? 'Copied!' : 'Copy Code'}
                    </button>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-transparent px-6 py-3 text-[15px] font-semibold leading-none text-white transition hover:bg-white/10"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">🎉 GET 5% OFF YOUR FIRST ORDER</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Join the SHIS Fashion community and unlock your exclusive welcome discount.</h2>
                  </div>

                  <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                    <div>
                      <label htmlFor="welcome-email" className="sr-only">
                        Enter your email address
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                          <svg viewBox="0 0 24 24" className="h-4 w-4 text-white/50" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <input
                          id="welcome-email"
                          type="email"
                          value={form.email}
                          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value, error: '' }))}
                          onBlur={() => setForm((current) => ({ ...current, touched: true }))}
                          placeholder="Enter your email address"
                          className={`w-full rounded-2xl border bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/50 outline-none transition ${
                            showError ? 'border-rose-400 focus:border-rose-400' : 'border-white/15 focus:border-[#D4AF37]'
                          }`}
                          disabled={form.submitting}
                        />
                      </div>
                    </div>

                    {showError ? (
                      <p className="text-xs text-rose-300">{form.error}</p>
                    ) : null}

                    <button
                      type="submit"
                      disabled={form.submitting}
                      className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-full border border-[#D4AF37] bg-[linear-gradient(180deg,#D4AF37,#b8962e)] px-6 py-3 text-[15px] font-semibold leading-none text-black shadow-[0_8px_24px_rgba(212,175,55,0.25)] transition hover:shadow-[0_12px_32px_rgba(212,175,55,0.35)] hover:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {form.submitting ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                          Claiming…
                        </>
                      ) : (
                        '🎁 Claim My 5% OFF'
                      )}
                    </button>
                  </form>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-white/60">
                    <span>✔ No Spam</span>
                    <span>✔ Unsubscribe Anytime</span>
                    <span>✔ Exclusive Member Offers</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}