import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Container from '../ui/Container'
import { subscribeToHomepageContent, type HomepageContent } from '../../firebase/adminService'

const essentialLinks = [
  { label: 'Shop', href: '/shop' },
  { label: 'Sale', href: '/sale' },
  { label: 'New Arrivals', href: '/shop/new-arrivals' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
]

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/shisfashion' },
  { label: 'Facebook', href: 'https://www.facebook.com/shisfashion' },
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
  const whatsappHref = getWhatsAppHref(contactPhone)

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => setHomepageContent(content))
    return unsubscribe
  }, [])

  return (
    <footer className="border-t border-black/10 bg-white">
      <Container className="py-8 sm:py-10">
        <div className="grid gap-8 md:grid-cols-3 md:gap-10">
          <div>
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">SHIS Fashion</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-black/70">
              Clean, mobile-first shopping for modern wardrobes.
            </p>
          </div>

          <div>
            <h3 className="text-caption font-semibold uppercase tracking-[0.14em] text-black">Essential Links</h3>
            <ul className="mt-3 grid gap-2">
              {essentialLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="ui-interactive text-sm text-black/75 hover:text-black">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-caption font-semibold uppercase tracking-[0.14em] text-black">Support & Social</h3>
            <div className="mt-3 grid gap-2 text-sm text-black/75">
              <a href={`mailto:${contactEmail}`} className="ui-interactive hover:text-black">
                {contactEmail}
              </a>
              <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="ui-interactive hover:text-black">
                {contactPhone}
              </a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="ui-interactive hover:text-black">
                WhatsApp Support
              </a>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="ui-interactive text-caption uppercase tracking-[0.12em] text-black/65 hover:text-black"
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-black/10 pt-4 text-caption uppercase tracking-[0.12em] text-black/55">
          © 2026 SHIS Fashion
        </div>
      </Container>
    </footer>
  )
}
