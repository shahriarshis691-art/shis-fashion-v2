import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { useCart } from '../../context/CartContext'
import { subscribeToHomepageContent, type HomepageContent } from '../../firebase/adminService'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text)] transition hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/8"
    >
      {children}
    </button>
  )
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null)
  const { theme, toggleTheme } = useTheme()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const firstMobileLinkRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => setHomepageContent(content))
    return unsubscribe
  }, [])

  // Focus the first link when mobile menu opens and handle Escape key
  useEffect(() => {
    if (isMobileMenuOpen) {
      firstMobileLinkRef.current?.focus()
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMobileMenuOpen])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border)]/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white font-bold text-sm">
              S
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text)]">{homepageContent?.navbarBrandPrimary ?? 'Shis'}</p>
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-muted)]">{homepageContent?.navbarBrandSecondary ?? 'Fashion'}</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.label}
                to={link.href}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors duration-200 ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)] hover:text-[var(--color-accent)]'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <IconButton label="Search" onClick={() => setIsSearchOpen((value) => !value)}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="5.5" />
                <path d="M15.5 15.5 20 20" />
              </svg>
            </IconButton>
            <Link to="/cart" className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text)] transition hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/8" aria-label="Cart">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3.5 4.5h2l1.7 8.4a1 1 0 0 0 .98.8h8.6a1 1 0 0 0 .97-.8l1.1-5.4H7.5" />
                <circle cx="10" cy="18" r="1.2" />
                <circle cx="17" cy="18" r="1.2" />
              </svg>
              {itemCount > 0 ? <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-0.5 text-[9px] font-bold text-white">{itemCount}</span> : null}
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden sm:flex h-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium text-[var(--color-text)] transition hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/8"
              aria-label="Toggle theme"
            >
              {theme === 'luxury' ? '🌙' : '☀️'}
            </button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text)] transition hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/8 md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              <span aria-hidden className="text-xl">{isMobileMenuOpen ? '×' : '☰'}</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isSearchOpen ? (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-auto px-4 sm:px-6 lg:px-8 py-3 border-b border-[var(--color-border)]/30">
            <div className="max-w-7xl mx-auto flex gap-2">
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    const query = searchTerm.trim()
                    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop')
                    setIsSearchOpen(false)
                    setSearchTerm('')
                  }
                }}
                placeholder={homepageContent?.navbarSearchPlaceholder ?? 'Search products'}
                className="flex-1 rounded-lg border border-[var(--color-border)]/30 bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text)] outline-none transition hover:border-[var(--color-border)]/50 focus:border-[var(--color-accent)]/50 focus:bg-[var(--color-accent)]/5"
              />
              <button
                type="button"
                onClick={() => {
                  const query = searchTerm.trim()
                  navigate(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop')
                  setIsSearchOpen(false)
                  setSearchTerm('')
                }}
                className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent)]/90"
              >
                Search
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[var(--color-bg)]/95 px-4 pb-6 pt-24 backdrop-blur-xl md:hidden"
            role="dialog"
            aria-modal="true"
            id="mobile-navigation"
          >
            <div className="mx-auto flex h-full max-w-sm flex-col justify-between rounded-2xl border border-[var(--color-border)]/30 bg-[var(--color-surface)]/80 p-6">
              <div className="space-y-1">
                {links.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                  >
                    <NavLink
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      ref={index === 0 ? firstMobileLinkRef : undefined}
                      className={({ isActive }) =>
                        `block rounded-lg px-4 py-3 text-base font-medium transition ${isActive ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'text-[var(--color-text)] hover:bg-[var(--color-accent)]/5'}`
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t border-[var(--color-border)]/30">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full rounded-lg border border-[var(--color-border)]/30 px-4 py-3 text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-accent)]/5"
                >
                  {theme === 'luxury' ? '🌙 Midnight' : '☀️ Luxury'}
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
