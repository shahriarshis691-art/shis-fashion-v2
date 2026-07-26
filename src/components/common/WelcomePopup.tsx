import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { googleAnalytics } from '../../services/googleAnalytics'
import { metaPixel } from '../../services/metaPixel'

interface WelcomePopupProps {
  isOpen: boolean
  onClose: () => void
  onSubscribe: (email: string) => Promise<void>
}

interface FormState {
  email: string
  error: string
  submitting: boolean
  success: boolean
}

const COUPON_CODE = 'WELCOME5'

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

export default function WelcomePopup({ isOpen, onClose, onSubscribe }: WelcomePopupProps) {
  const [form, setForm] = useState<FormState>({ email: '', error: '', submitting: false, success: false })
  const [copied, setCopied] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

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
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previousActiveElement.current?.focus()
    }
  }, [isOpen, onClose])

  const handleClose = () => {
    googleAnalytics.trackEvent('popup_close', { source: 'welcome_discount' })
    metaPixel.trackEvent('popup_close', { source: 'welcome_discount' })
    onClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const trimmed = form.email.trim()
    if (!trimmed) {
      setForm((current) => ({ ...current, error: 'Please enter your email address.' }))
      return
    }

    if (!isValidEmail(trimmed)) {
      setForm((current) => ({ ...current, error: 'Please enter a valid email address.' }))
      return
    }

    setForm((current) => ({ ...current, error: '', submitting: true }))

    try {
      await onSubscribe(trimmed)
      setForm((current) => ({ ...current, success: true, submitting: false }))
      googleAnalytics.trackEvent('popup_signup', { source: 'welcome_discount', email: trimmed })
      metaPixel.trackEvent('popup_signup', { source: 'welcome_discount', email: trimmed })
      googleAnalytics.trackEvent('popup_conversion', { source: 'welcome_discount', coupon: COUPON_CODE })
      metaPixel.trackEvent('popup_conversion', { source: 'welcome_discount', coupon: COUPON_CODE })
    } catch {
      setForm((current) => ({ ...current, error: 'Something went wrong. Please try again.', submitting: false }))
    }
  }

  const handleCopyCode = async () => {
    const success = await copyToClipboard(COUPON_CODE)
    if (success) {
      setCopied(true)
      googleAnalytics.trackEvent('coupon_copy', { source: 'welcome_discount', coupon: COUPON_CODE })
      metaPixel.trackEvent('coupon_copy', { source: 'welcome_discount', coupon: COUPON_CODE })
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Welcome discount"
            className="relative w-full max-w-[520px] rounded-[16px] border border-white/10 bg-black p-6 shadow-[0_30px_70px_rgba(0,0,0,0.45)] sm:p-8"
            style={{ width: '95%', maxWidth: '520px' }}
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          >
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

            {form.success ? (
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Congratulations!</p>
                <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Your 5% discount has been unlocked</h2>
                <p className="mt-3 text-sm leading-7 text-white/75">
                  Use this exclusive coupon code at checkout to save on your first order.
                </p>

                <div className="mt-6 flex items-center justify-center gap-3">
                  <div className="flex-1 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-center">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/60">Coupon Code</p>
                    <p className="mt-1 text-xl font-semibold text-[#D4AF37]">{COUPON_CODE}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-center">
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
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Welcome to SHIS Fashion</p>
                <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Unlock 5% OFF Your First Order</h2>
                <p className="mt-3 text-sm leading-7 text-white/75">
                  Join our exclusive community and receive:
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-white/80">
                  <li>• 5% OFF on your first purchase</li>
                  <li>• Early access to new collections</li>
                  <li>• Exclusive member-only offers</li>
                </ul>

                <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="welcome-email" className="sr-only">
                      Enter your email address
                    </label>
                    <input
                      id="welcome-email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value, error: '' }))}
                      placeholder="Enter your email address"
                      className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 outline-none focus:border-[#D4AF37]"
                      disabled={form.submitting}
                    />
                  </div>

                  {form.error ? (
                    <p className="text-xs text-rose-300">{form.error}</p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={form.submitting}
                    className="inline-flex w-full min-h-12 items-center justify-center rounded-full border border-[#D4AF37] bg-[#D4AF37] px-6 py-3 text-[15px] font-semibold leading-none text-black transition hover:bg-[#c9a62e] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {form.submitting ? 'Unlocking…' : '🎁 Unlock My Discount'}
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-white/50">
                  We respect your privacy. No spam.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
