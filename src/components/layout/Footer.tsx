import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Container from '../ui/Container'
import { subscribeToHomepageContent, type HomepageContent } from '../../firebase/adminService'

const essentialLinks = [
  { label: 'Shop', href: '/shop' },
  { label: 'Sale', href: '/sale' },
  { label: 'New Arrivals', href: '/shop/new-arrivals' },
  { label: 'Contact', href: '/contact' },
]

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com' },
  { label: 'Facebook', href: 'https://www.facebook.com' },
  { label: 'YouTube', href: 'https://www.youtube.com' },
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
  const brandTitle = homepageContent?.footerBrandTitle ?? 'Modern essentials for Bangladesh'
  const brandDescription = homepageContent?.footerDescription ?? 'Clean, mobile-first shopping for modern wardrobes.'
  const footerBottomText = homepageContent?.footerBottomText ?? 'Built for comfortable browsing, confident choices, and repeat wear.'
  const contactEmail = homepageContent?.footerContactEmail ?? 'hello@shisfashion.com'
  const contactPhone = homepageContent?.footerContactPhone ?? '+88 01887848304'
  const contactAddress = homepageContent?.footerContactAddress ?? 'Dhaka, Bangladesh'
  const whatsappHref = getWhatsAppHref(contactPhone)

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => setHomepageContent(content))
    return unsubscribe
  }, [])

  return (
    <footer className="border-t border-black/10 bg-white">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 border-b border-black/10 pb-10 sm:pb-12 lg:grid-cols-[1.2fr_0.9fr_0.9fr] lg:gap-12">
          <div className="max-w-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/55">SHIS Fashion</p>
            <h3 className="mt-3 font-[var(--font-display)] text-[2rem] leading-none text-black sm:text-[2.4rem]">
              {brandTitle}
            </h3>
            <p className="mt-4 text-sm leading-7 text-black/70">
              {brandDescription}
            </p>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/55">Essential links</h3>
            <ul className="mt-4 grid gap-2.5">
              {essentialLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="ui-interactive text-sm text-black/75 transition-colors duration-300 hover:text-black">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/55">Support and social</h3>
            <div className="mt-4 grid gap-2 text-sm text-black/75">
              <a href={`mailto:${contactEmail}`} className="ui-interactive transition-colors duration-300 hover:text-black">
                {contactEmail}
              </a>
              <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="ui-interactive transition-colors duration-300 hover:text-black">
                {contactPhone}
              </a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="ui-interactive transition-colors duration-300 hover:text-black">
                WhatsApp Support
              </a>
              <p className="text-sm text-black/60">{contactAddress}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="ui-interactive rounded-full border border-black/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-black/65 transition-colors duration-300 hover:border-black/35 hover:text-black"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-6 sm:pt-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-black/55">© 2026 SHIS Fashion</p>
          <p className="mt-2 text-xs text-black/55">{footerBottomText}</p>
        </div>
      </Container>
    </footer>
  )
}
