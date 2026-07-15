import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { useCart } from '../../context/CartContext'
import { subscribeToHomepageContent, type HomepageContent } from '../../firebase/adminService'
import { metaPixel } from '../../services/metaPixel'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'New Arrivals', href: '/shop/new-arrivals' },
  { label: 'Best Sellers', href: '/shop/best-sellers' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text)] transition hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/8"
    >
      {children}
    </button>
  )
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null)
  const { theme, toggleTheme } = useTheme()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const firstMobileLinkRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => setHomepageContent(content))
    return unsubscribe
  }, [])

  // Focus the first link when mobile menu opens and handle Escape key
  useEffect(() => {
    if (isMobileMenuOpen) {
      firstMobileLinkRef.current?.focus()
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll
      document.body.style.overflow = ''
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between h-20 md:h-24 rounded-lg border border-[var(--color-border)]/40 px-3 bg-[var(--color-surface)]/70 backdrop-blur-sm shadow-sm">
            <Link to="/" className="flex items-center justify-center group flex-shrink-0">
              <img 
                src="/shis-logo.svg" 
                alt="SHIS Fashion - Premium Essentials" 
                className="h-14 md:h-16 lg:h-20 w-auto object-contain"
                loading="eager"
              />
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

            <div className="flex items-center gap-1.5">
              <IconButton label="Search" onClick={() => setIsSearchOpen((value) => !value)}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="5.5" />
                  <path d="M15.5 15.5 20 20" />
                </svg>
              </IconButton>
              <Link to="/cart" className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text)] transition hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/8" aria-label="Cart">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3.5 4.5h2l1.7 8.4a1 1 0 0 0 .98.8h8.6a1 1 0 0 0 .97-.8l1.1-5.4H7.5" />
                  <circle cx="10" cy="18" r="1.2" />
                  <circle cx="17" cy="18" r="1.2" />
                </svg>
                {itemCount > 0 ? <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-0.5 text-[8px] font-bold text-white">{itemCount}</span> : null}
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                className="hidden sm:flex h-8 items-center justify-center rounded-lg px-2 text-xs font-semibold text-[var(--color-text)] transition hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/8"
                aria-label="Toggle theme"
              >
                {theme === 'luxury' ? '🌙' : '☀️'}
              </button>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((value) => !value)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text)] transition hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/8 md:hidden"
                aria-label="Toggle navigation"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                <span aria-hidden className="text-lg">{isMobileMenuOpen ? '×' : '☰'}</span>
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
                      if (query) {
                        metaPixel.search({ search_string: query })
                      }
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
                    if (query) {
                      metaPixel.search({ search_string: query })
                    }
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
      </header>

      {/* Mobile Drawer - Outside header to avoid positioning constraints */}
      <AnimatePresence>
        {isMobileMenuOpen ? (
          <>
            {/* Dark overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              aria-hidden="true"
            />
            
            {/* Full-height side drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 z-50 h-screen w-[85vw] max-w-sm bg-[#F8F6F2] md:hidden overflow-y-auto"
              role="dialog"
              aria-modal="true"
              id="mobile-navigation"
            >
              {/* Close button */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-6 bg-[#F8F6F2] border-b border-[#E8E3DA]">
                <h2 className="text-lg font-semibold text-[#111111]">Menu</h2>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[#111111] transition hover:bg-[#C8A96A]/10"
                  aria-label="Close menu"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              {/* Navigation links */}
              <nav className="px-6 py-8 space-y-1">
                {links.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <NavLink
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      ref={index === 0 ? firstMobileLinkRef : undefined}
                      className={({ isActive }) =>
                        `block px-4 py-4 text-lg font-medium transition rounded-lg ${
                          isActive
                            ? 'bg-[#C8A96A]/15 text-[#C8A96A]'
                            : 'text-[#111111] hover:bg-[#F0EEE9]'
                        }`
                      }
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Footer section with theme toggle and social links */}
              <div className="px-6 py-8 border-t border-[#E8E3DA] space-y-6 bg-[#F8F6F2]">
                {/* Theme toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#111111] bg-[#111111] text-white font-semibold text-base transition hover:bg-[#111111]/90"
                >
                  {theme === 'luxury' ? '🌙 Midnight Mode' : '☀️ Luxury Mode'}
                </button>

                {/* Social links */}
                <div>
                  <p className="text-xs font-semibold text-[#666666] uppercase tracking-wider mb-4">Follow Us</p>
                  <div className="flex gap-4">
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-12 w-12 rounded-lg border-2 border-[#111111] text-[#111111] transition hover:bg-[#111111] hover:text-white"
                      aria-label="Instagram"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.204-.012 3.584-.07 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.265-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" />
                      </svg>
                    </a>
                    <a
                      href="https://pinterest.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-12 w-12 rounded-lg border-2 border-[#111111] text-[#111111] transition hover:bg-[#111111] hover:text-white"
                      aria-label="Pinterest"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.937-.2-2.378.042-3.41.216-.937 1.402-5.938 1.402-5.938s-.357-.715-.357-1.774c0-1.66.962-2.9 2.161-2.9 1.02 0 1.512.765 1.512 1.682 0 1.025-.653 2.557-.99 3.978-.281 1.189.597 2.159 1.769 2.159 2.123 0 3.756-2.239 3.756-5.471 0-2.861-2.056-4.86-4.991-4.86-3.398 0-5.393 2.549-5.393 5.184 0 1.027.325 2.126.732 2.725.08.149.092.287.068.44-.075.316-.24 1.011-.273 1.149-.043.188-.145.228-.335.137-1.186-.556-1.926-2.301-1.926-3.702 0-3.782 2.748-7.269 7.923-7.269 4.165 0 7.395 2.965 7.395 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                    <a
                      href="https://tiktok.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center h-12 w-12 rounded-lg border-2 border-[#111111] text-[#111111] transition hover:bg-[#111111] hover:text-white"
                      aria-label="TikTok"
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.86 2.86 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.07A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-.54-.05z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
