import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Container from '../ui/Container'
import { subscribeToHomepageContent, type HomepageContent } from '../../firebase/adminService'

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
]

export default function Footer() {
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null)
  const contactEmail = homepageContent?.footerContactEmail ?? 'hello@shisfashion.com'
  const contactPhone = homepageContent?.footerContactPhone ?? '+234 800 000 0000'
  const contactAddress = homepageContent?.footerContactAddress ?? 'Abuja, Nigeria'

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => setHomepageContent(content))
    return unsubscribe
  }, [])

  return (
    <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-surface)]/85 backdrop-blur-xl">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg)]/70 p-6 sm:p-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--color-accent)]">SHIS FASHION</p>
            <h3 className="mt-4 text-2xl font-semibold text-[var(--color-text)]">{homepageContent?.footerBrandTitle ?? 'Style Meets Comfort'}</h3>
            <p className="mt-4 max-w-md text-sm leading-7 text-[var(--color-muted)]">
              {homepageContent?.footerDescription ?? 'A refined digital presence for modern luxury, designed with comfort, clarity, and effortless elegance in mind.'}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-text)]">Quick Links</h4>
            <ul className="mt-4 space-y-3 text-sm text-[var(--color-muted)]">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="transition hover:text-[var(--color-accent)]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-text)]">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm text-[var(--color-muted)]">
              <li>{contactEmail}</li>
              <li>{contactPhone}</li>
              <li>{contactAddress}</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`mailto:${contactEmail}`} className="inline-flex items-center rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
                Email us
              </a>
              <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="inline-flex items-center rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
                Call now
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 SHIS Fashion. All rights reserved.</span>
          <span>{homepageContent?.footerBottomText ?? 'Crafted for premium, calm, and timeless browsing.'}</span>
        </div>
      </Container>
    </footer>
  )
}
