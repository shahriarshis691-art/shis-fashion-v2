import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import shisLogoWhite from '../../assets/logo/shis-logo-white.svg'
import { useTheme } from '../../hooks/useTheme'
import { useCart } from '../../context/CartContext'
import { subscribeToHomepageContent, type HomepageContent } from '../../firebase/adminService'
import { metaPixel } from '../../services/metaPixel'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Sale', href: '/sale' },
  { label: 'New Arrivals', href: '/shop/new-arrivals' },
  { label: 'Best Sellers', href: '/shop/best-sellers' },
  { label: 'Our Brands', href: '/brands' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[var(--color-text)] antialiased transition-colors duration-200 hover:border-[rgba(210,180,122,0.28)] hover:bg-[rgba(255,255,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] sm:h-9 sm:w-9"
    >
      {children}
    </button>
  )
}

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null)
  const { theme } = useTheme()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const closeOverlays = () => {
    setIsSearchOpen(false)
    setIsMenuOpen(false)
  }

  const toggleSearch = () => {
    setIsMenuOpen(false)
    setIsSearchOpen((value) => !value)
  }

  const toggleMenu = () => {
    setIsSearchOpen(false)
    setIsMenuOpen((value) => !value)
  }

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => setHomepageContent(content))
    return unsubscribe
  }, [])

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close search using Escape key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false)
        setIsMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (!isMenuOpen) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  return (
    <>
      <header className={`sticky top-0 z-50 w-full border-b border-[rgba(255,255,255,0.06)] bg-[rgba(5,5,5,0.92)] backdrop-blur-xl transition-[box-shadow,border-color] duration-200 ${isScrolled ? 'shadow-[0_16px_40px_rgba(0,0,0,0.45)] border-[rgba(210,180,122,0.12)]' : 'shadow-none'}`}>
        <div className="flex h-[4.5rem] w-full items-center gap-2 px-3 sm:px-6 md:h-[4.75rem] lg:h-[5.25rem] lg:px-10">
          <Link to="/" onClick={closeOverlays} className="group flex flex-shrink-0 items-center justify-start overflow-hidden text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-text)] transition-colors duration-200 hover:text-[var(--color-accent)] sm:text-base" aria-label="SHIS Fashion home">
            <img
              src={shisLogoWhite}
              alt="SHIS Fashion"
              className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] sm:h-9 md:h-10 lg:h-11"
              loading="eager"
            />
          </Link>

          <nav className="min-w-0 flex-1 touch-pan-x overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex lg:justify-center" aria-label="Primary navigation">
            <div className="flex min-w-max items-center gap-3 px-1 sm:gap-6 lg:gap-9">
            {links.map((link) => (
              <NavLink
                key={link.label}
                to={link.href}
                onClick={closeOverlays}
                className={({ isActive }) => {
                  if (link.href === '/brands') {
                    return `whitespace-nowrap rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.18em] md:text-[12px] ${isActive ? 'border-[rgba(210,180,122,0.5)] bg-[rgba(210,180,122,0.18)] text-[var(--color-accent)]' : 'border-[rgba(210,180,122,0.3)] bg-[rgba(210,180,122,0.08)] text-[var(--color-accent)] hover:border-[rgba(210,180,122,0.5)] hover:bg-[rgba(210,180,122,0.14)]'}`
                  }

                  const baseClass = `whitespace-nowrap px-0 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] sm:text-[12px] sm:tracking-[0.22em] md:text-[13px] md:font-medium md:tracking-[0.22em] ${
                    isActive
                      ? 'text-[var(--color-accent)] md:text-[var(--color-accent)] md:font-semibold md:after:absolute md:after:-bottom-3 md:after:left-0 md:after:h-[2px] md:after:w-full md:after:bg-[var(--color-accent)] md:after:content-[\'\']'
                      : 'text-[var(--color-text)]/86 hover:text-[var(--color-text)] md:hover:text-[var(--color-text)] md:after:absolute md:after:-bottom-3 md:after:left-1/2 md:after:h-[1px] md:after:w-0 md:after:-translate-x-1/2 md:after:bg-[var(--color-accent)] md:after:content-[\'\'] md:after:transition-all md:after:duration-200 md:after:ease-out md:hover:after:left-0 md:hover:after:w-full md:hover:after:translate-x-0'
                  }`

                  return baseClass
                }}
              >
                {link.label}
              </NavLink>
            ))}
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <IconButton label="Search" onClick={toggleSearch}>
              <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] sm:h-[15px] sm:w-[15px]" fill="none" stroke="currentColor" strokeWidth="2.1">
                <circle cx="11" cy="11" r="5.5" />
                <path d="M15.5 15.5 20 20" />
              </svg>
            </IconButton>
            <Link
              to="/cart"
              onClick={closeOverlays}
              title="Cart"
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[var(--color-text)] antialiased transition-colors duration-200 hover:border-[rgba(210,180,122,0.28)] hover:bg-[rgba(255,255,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] sm:h-9 sm:w-9"
              aria-label="Cart"
            >
              <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] sm:h-[15px] sm:w-[15px]" fill="none" stroke="currentColor" strokeWidth="2.1">
                <path d="M3.5 4.5h2l1.7 8.4a1 1 0 0 0 .98.8h8.6a1 1 0 0 0 .97-.8l1.1-5.4H7.5" />
                <circle cx="10" cy="18" r="1.2" />
                <circle cx="17" cy="18" r="1.2" />
              </svg>
              {itemCount > 0 ? <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[var(--color-accent)] px-0.5 text-[7px] font-bold text-[#050505] sm:-right-1.5 sm:-top-1.5 sm:h-4 sm:min-w-4 sm:text-[8px]">{itemCount}</span> : null}
            </Link>
            <IconButton label={isMenuOpen ? 'Close menu' : 'Open menu'} onClick={toggleMenu}>
              {isMenuOpen ? (
                <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] sm:h-[15px] sm:w-[15px]" fill="none" stroke="currentColor" strokeWidth="2.1">
                  <path d="M6 6 18 18" />
                  <path d="M18 6 6 18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] sm:h-[15px] sm:w-[15px]" fill="none" stroke="currentColor" strokeWidth="2.1">
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </svg>
              )}
            </IconButton>
          </div>
        </div>

        <AnimatePresence>
          {isSearchOpen ? (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="border-t border-[rgba(255,255,255,0.06)] bg-[rgba(8,8,8,0.98)] px-4 py-3 sm:px-6 lg:px-10">
              <div className="flex gap-2">
                <label htmlFor="site-search" className="sr-only">Search SHIS Fashion products</label>
                <input
                  id="site-search"
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
                  className="flex-1 rounded-full border border-[var(--color-border)] bg-[rgba(255,255,255,0.04)] px-4 py-2.5 text-sm tracking-[0.18em] text-[var(--color-text)] outline-none transition-colors duration-200 hover:border-[rgba(210,180,122,0.3)] focus:border-[rgba(210,180,122,0.45)] focus-visible:ring-2 focus-visible:ring-[rgba(210,180,122,0.24)] focus-visible:ring-offset-1 focus-visible:ring-offset-[#050505]"
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
                  className="rounded-full border border-[rgba(210,180,122,0.2)] bg-[linear-gradient(180deg,#171717,#090909)] px-4 py-2 text-sm font-semibold tracking-[0.18em] text-[var(--color-text)] transition-colors duration-200 hover:border-[rgba(210,180,122,0.42)] hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                >
                  Search
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {isMenuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close menu overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-[rgba(10,10,10,0.34)] lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.aside
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="fixed inset-x-3 top-[4.45rem] z-50 rounded-[1.5rem] border border-[rgba(210,180,122,0.14)] bg-[rgba(7,7,7,0.96)] p-3 shadow-[0_26px_80px_rgba(0,0,0,0.52)] backdrop-blur-xl sm:inset-x-6 md:top-[5.25rem] lg:hidden"
            >
              <div className="rounded-[1.2rem] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] p-3">
                <div className="flex items-center justify-between gap-3 px-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]">Browse</p>
                  <span className="rounded-full border border-[rgba(255,255,255,0.08)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">{theme}</span>
                </div>
                <nav className="mt-3 grid gap-1" aria-label="Mobile navigation">
                  {links.map((link) => (
                    <NavLink
                      key={link.label}
                      to={link.href}
                      onClick={closeOverlays}
                      className={({ isActive }) => {
                        if (link.href === '/brands') {
                          return `flex items-center justify-between rounded-[0.95rem] border px-3.5 py-3 text-[13px] font-semibold tracking-[0.08em] transition-colors ${isActive ? 'border-[rgba(210,180,122,0.45)] bg-[rgba(210,180,122,0.14)] text-[var(--color-accent)]' : 'border-[rgba(210,180,122,0.24)] bg-[rgba(210,180,122,0.08)] text-[var(--color-accent)] hover:border-[rgba(210,180,122,0.45)]'}`
                        }

                        return `flex items-center justify-between rounded-[0.95rem] px-3.5 py-3 text-[13px] font-semibold tracking-[0.08em] transition-colors ${isActive ? 'bg-[rgba(210,180,122,0.1)] text-[var(--color-accent)]' : 'text-[var(--color-text)] hover:bg-[rgba(255,255,255,0.04)]'}`
                      }}
                    >
                      <span>{link.label}</span>
                      <span aria-hidden className="text-base leading-none">→</span>
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3">
                <Link to="/checkout" onClick={closeOverlays} className="rounded-[1rem] border border-[rgba(210,180,122,0.16)] bg-[linear-gradient(180deg,#181818,#090909)] px-4 py-3 text-center text-sm font-semibold tracking-[0.16em] text-[var(--color-text)] shadow-[0_18px_40px_rgba(0,0,0,0.4)]">
                  Checkout now
                </Link>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
