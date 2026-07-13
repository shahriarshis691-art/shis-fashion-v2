import { Link } from 'react-router-dom'

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'Pinterest', href: 'https://pinterest.com' },
  { label: 'TikTok', href: 'https://tiktok.com' },
]

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/95">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--color-accent)]">SHIS FASHION</p>
          <h3 className="mt-4 text-2xl font-semibold text-[var(--color-text)]">Style Meets Comfort</h3>
          <p className="mt-4 max-w-md text-sm leading-7 text-[var(--color-muted)]">
            Designed for effortless luxury, premium tailoring, and modern comfort from day to evening.
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
            <li>hello@shisfashion.com</li>
            <li>+234 800 000 0000</li>
            <li>Abuja, Nigeria</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            {socialLinks.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="text-sm text-[var(--color-muted)] transition hover:text-[var(--color-accent)]">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--color-border)] py-5 text-center text-sm text-[var(--color-muted)]">
        © 2026 SHIS Fashion. All rights reserved.
      </div>
    </footer>
  )
}
