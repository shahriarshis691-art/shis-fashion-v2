import { useState, type FormEvent } from 'react'
import Container from '../ui/Container'
import { subscribeNewsletter } from '../../firebase/adminService'
import { googleAnalytics } from '../../services/googleAnalytics'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function NewsletterCard() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }

    if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }

    setSubmitting(true)

    try {
      const result = await subscribeNewsletter(trimmed)
      setSuccess(true)
      setEmail('')
      googleAnalytics.trackEvent('newsletter_signup', {
        source: 'footer_card',
        already_subscribed: Boolean(result.alreadySubscribed),
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to subscribe right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section
      className="bg-[#6b2d35] text-[#FDFBF7] py-16 sm:py-20"
      aria-labelledby="newsletter-heading"
    >
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.35em] text-[#FDFBF7]/80">
            STAY IN TOUCH
          </p>

          <h2
            id="newsletter-heading"
            className="mt-4 text-3xl sm:text-4xl md:text-[2.75rem] font-medium uppercase tracking-[0.22em] text-[#FDFBF7]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            NEWSLETTER
          </h2>

          <p className="mt-4 max-w-md text-sm sm:text-base font-normal leading-7 text-[#FDFBF7]/90">
            The stories, the drops, the fits — straight to your inbox.
          </p>

          {success ? (
            <p className="mt-8 max-w-md text-sm sm:text-base leading-7 text-[#FDFBF7]">
              You&apos;re on the list. Watch your inbox for the next edit.
            </p>
          ) : (
            <form
              className="mt-8 w-full max-w-[480px] space-y-3"
              onSubmit={handleSubmit}
              noValidate
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="E-mail"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (error) {
                    setError('')
                  }
                }}
                disabled={submitting}
                className="w-full rounded-none border border-white/25 bg-black/10 px-4 py-3 text-sm sm:text-base text-[#FDFBF7] placeholder:text-[#FDFBF7]/55 outline-none transition-colors focus:border-white/45 focus:bg-black/15 disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={submitting}
                className="luxury-tap w-full rounded-none bg-[#FDFBF7] px-4 py-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-[#6b2d35] transition-all hover:bg-[#FDFBF7]/90 hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'SUBSCRIBING…' : 'SUBSCRIBE'}
              </button>

              {error ? (
                <p className="text-left text-xs sm:text-sm text-[#FDFBF7]/90" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </Container>
    </section>
  )
}
