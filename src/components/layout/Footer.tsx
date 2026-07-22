import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Container from '../ui/Container'
import { subscribeToHomepageContent, type HomepageContent } from '../../firebase/adminService'

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Brands', href: '/brands' },
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
    <footer className="mt-12 border-t border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(0,0,0,0.015),rgba(0,0,0,0.03))]">
      <Container className="py-9 sm:py-12">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-[var(--color-text)] shadow-[0_30px_90px_rgba(0,0,0,0.08)] sm:rounded-[2rem] sm:p-7 lg:p-9">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.05),rgba(0,0,0,0))]" aria-hidden />
          <div className="pointer-events-none absolute -bottom-20 left-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.03),rgba(0,0,0,0))]" aria-hidden />

          <div className="relative grid gap-7 lg:grid-cols-[1.28fr_0.72fr] lg:gap-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">SHIS FASHION</p>
              <h3 className="mt-3 max-w-xl text-[2rem] font-semibold leading-[0.95] text-[var(--color-text)] sm:text-[2.7rem]">
                {homepageContent?.footerBrandTitle ?? 'Style Meets Comfort'}
              </h3>
              <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--color-muted)] sm:text-[0.95rem] sm:leading-7">
                {homepageContent?.footerDescription ?? 'A refined digital presence for modern luxury, designed with comfort, clarity, and effortless elegance in mind.'}
              </p>

              <div className="mt-5 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)]">
                <span className="rounded-full border border-[var(--color-border)] bg-[rgba(0,0,0,0.03)] px-3 py-1.5">Cash on Delivery</span>
                <span className="rounded-full border border-[var(--color-border)] bg-[rgba(0,0,0,0.03)] px-3 py-1.5">Nationwide Dispatch</span>
                <span className="rounded-full border border-[var(--color-border)] bg-[rgba(0,0,0,0.03)] px-3 py-1.5">Premium Support</span>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-[rgba(0,0,0,0.3)] bg-[rgba(0,0,0,0.06)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
                  WhatsApp concierge
                </a>
                <Link to="/shop" className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[rgba(0,0,0,0.03)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text)] transition hover:bg-[rgba(0,0,0,0.06)]">
                  Shop collection
                </Link>
              </div>
            </div>

            <div className="rounded-[1.15rem] border border-[var(--color-border)] bg-[rgba(0,0,0,0.02)] p-4 backdrop-blur-sm sm:p-5">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--color-muted)]">Explore</h4>
              <ul className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 text-sm text-[var(--color-muted)]">
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="inline-flex items-center rounded-full border border-transparent px-2.5 py-1.5 transition hover:border-[var(--color-border)] hover:bg-[rgba(0,0,0,0.04)] hover:text-[var(--color-accent)]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-4 border-t border-[var(--color-border)] pt-4 text-sm text-[var(--color-muted)]">
                <p>{contactEmail}</p>
                <p className="mt-1">{contactPhone}</p>
                <p className="mt-1">{contactAddress}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="inline-flex items-center rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
                    Call
                  </a>
                  <a href={`mailto:${contactEmail}`} className="inline-flex items-center rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]">
                    Email
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-6 border-t border-[var(--color-border)] pt-4 text-[11px] text-[var(--color-muted)] sm:flex sm:items-center sm:justify-between sm:text-sm">
            <span>© 2026 SHIS Fashion. All rights reserved.</span>
            <span className="mt-1.5 block sm:mt-0">{homepageContent?.footerBottomText ?? 'Crafted for premium, calm, and timeless browsing.'}</span>
          </div>
        </div>
      </Container>
    </footer>
  )
}
