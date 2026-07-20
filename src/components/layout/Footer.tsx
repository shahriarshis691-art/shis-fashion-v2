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

function getWhatsAppHref(phone?: string) {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (!digits) {
    return 'https://wa.me/8801887848304'
  }

  const normalized = digits.startsWith('88') ? digits : `88${digits}`
  return `https://wa.me/${normalized}`
}

export default function Footer() {
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null)
  const contactEmail = homepageContent?.footerContactEmail ?? 'hello@shisfashion.com'
  const contactPhone = homepageContent?.footerContactPhone ?? '+88 01887848304'
  const contactAddress = homepageContent?.footerContactAddress ?? 'Mirpur, Dhaka'
  const whatsappHref = getWhatsAppHref(contactPhone)

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => setHomepageContent(content))
    return unsubscribe
  }, [])

  return (
    <footer className="mt-12 border-t border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(10,10,10,0.03),rgba(10,10,10,0.09))]">
      <Container className="py-10 sm:py-14">
        <div className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.06)] sm:rounded-[1.9rem] sm:p-7 lg:p-9">
          <div className="grid gap-7 lg:grid-cols-[1.2fr_0.8fr_0.9fr]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">SHIS FASHION</p>
              <h3 className="mt-3 text-2xl font-semibold leading-tight text-[var(--color-text)] sm:text-[2rem]">{homepageContent?.footerBrandTitle ?? 'Style Meets Comfort'}</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-[var(--color-muted)]">
                {homepageContent?.footerDescription ?? 'A refined digital presence for modern luxury, designed with comfort, clarity, and effortless elegance in mind.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5">COD available</span>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5">Fast support</span>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5">Nationwide delivery</span>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text)]">Explore</h4>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-[var(--color-muted)] sm:grid-cols-1">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="inline-flex items-center gap-2 transition hover:text-[var(--color-accent)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]/50" aria-hidden />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-text)]">Contact</h4>
              <div className="mt-3 space-y-2.5 text-sm text-[var(--color-muted)]">
                <p>{contactEmail}</p>
                <p>{contactPhone}</p>
                <p>{contactAddress}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-[rgba(210,180,122,0.3)] bg-[rgba(210,180,122,0.1)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
                  WhatsApp
                </a>
                <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="inline-flex items-center rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
                  Call
                </a>
                <a href={`mailto:${contactEmail}`} className="inline-flex items-center rounded-full border border-[var(--color-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
                  Email
                </a>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--color-border)] pt-4 text-[11px] text-[var(--color-muted)] sm:flex sm:items-center sm:justify-between sm:text-sm">
            <span>© 2026 SHIS Fashion. All rights reserved.</span>
            <span className="mt-1.5 block sm:mt-0">{homepageContent?.footerBottomText ?? 'Crafted for premium, calm, and timeless browsing.'}</span>
          </div>
        </div>
      </Container>
    </footer>
  )
}
