import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import shisLogo from '../../assets/logo/shis-logo.svg'
import { useCart } from '../../context/CartContext'
import { subscribeToHomepageContent, type HomepageContent } from '../../firebase/adminService'
import { metaPixel } from '../../services/metaPixel'

const primaryLinks = [
  { label: 'Women', href: '/women' },
  { label: 'Men', href: '/men' },
  { label: 'Kids', href: '/kids' },
  { label: 'Sale', href: '/sale' },
  { label: 'New Arrivals', href: '/shop/new-arrivals' },
]

const utilityLinks = [
  { label: 'Shop All', href: '/shop' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

function IconButton({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="ui-interactive flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 sm:h-9 sm:w-9"
    >
      {children}
    </button>
  )
}

function CategoryLink({ href, label, onNavigate }: { href: string; label: string; onNavigate?: () => void }) {
  return (
    <NavLink
      to={href}
      onClick={onNavigate}
      className={({ isActive }) =>
        `ui-interactive whitespace-nowrap border-b px-1 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] ${
          isActive ? 'border-black text-black' : 'border-transparent text-black/70 hover:text-black'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null)
  const { itemCount } = useCart()
  const navigate = useNavigate()

  const closeOverlays = () => {
    setIsSearchOpen(false)
    setIsMenuOpen(false)
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeOverlays()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
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
      <header
        className={`sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-md transition-shadow duration-200 ${
          isScrolled ? 'shadow-[0_8px_22px_rgba(0,0,0,0.08)]' : 'shadow-none'
        }`}
      >
        <div className="mx-auto flex h-[3.7rem] w-full max-w-7xl items-center px-3.5 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(false)
              setIsMenuOpen((value) => !value)
            }}
            className="ui-interactive flex h-8 w-8 items-center justify-center rounded-md text-black hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 md:hidden"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6 18 18" />
                <path d="M18 6 6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            )}
          </button>

          <Link to="/" onClick={closeOverlays} className="ml-2 md:ml-0" aria-label="SHIS Fashion home">
            <img src={shisLogo} alt="SHIS Fashion" className="h-7 w-auto sm:h-8" loading="eager" />
          </Link>

          <nav className="ml-8 hidden min-w-0 flex-1 items-center gap-5 md:flex" aria-label="Primary navigation">
            {primaryLinks.map((link) => (
              <CategoryLink key={link.label} href={link.href} label={link.label} onNavigate={closeOverlays} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5">
            <IconButton
              label="Search"
              onClick={() => {
                setIsMenuOpen(false)
                setIsSearchOpen((value) => !value)
              }}
            >
              <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] sm:h-[15px] sm:w-[15px]" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="5.5" />
                <path d="M15.5 15.5 20 20" />
              </svg>
            </IconButton>

            <Link
              to="/cart"
              onClick={closeOverlays}
              title="Cart"
              className="ui-interactive relative flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text)] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 sm:h-9 sm:w-9"
              aria-label="Cart"
            >
              <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] sm:h-[15px] sm:w-[15px]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3.5 4.5h2l1.7 8.4a1 1 0 0 0 .98.8h8.6a1 1 0 0 0 .97-.8l1.1-5.4H7.5" />
                <circle cx="10" cy="18" r="1.2" />
                <circle cx="17" cy="18" r="1.2" />
              </svg>
              {itemCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-0.5 text-[8px] font-bold text-white">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        <nav className="border-t border-black/10 md:hidden" aria-label="Primary categories">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-4 overflow-x-auto px-3.5 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {primaryLinks.map((link) => (
              <CategoryLink key={link.label} href={link.href} label={link.label} onNavigate={closeOverlays} />
            ))}
          </div>
        </nav>

        <AnimatePresence>
          {isSearchOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="border-t border-black/10 bg-white"
            >
              <div className="mx-auto flex w-full max-w-7xl gap-2 px-3.5 py-3 sm:px-6 lg:px-8">
                <label htmlFor="site-search" className="sr-only">
                  Search products
                </label>
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
                  className="w-full border border-black/20 px-3 py-2 text-sm text-black outline-none focus:border-black"
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
                  className="ui-interactive border border-black bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
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
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            <motion.aside
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-3 top-[calc(3.9rem+env(safe-area-inset-top))] z-50 rounded-md bg-white p-3 shadow-[0_22px_44px_rgba(0,0,0,0.22)] md:hidden"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50">Categories</p>
              <nav className="mt-2 grid gap-1" aria-label="Mobile category menu">
                {primaryLinks.map((link) => (
                  <NavLink
                    key={link.label}
                    to={link.href}
                    onClick={closeOverlays}
                    className={({ isActive }) =>
                      `ui-interactive flex items-center justify-between px-2 py-2 text-sm font-medium ${
                        isActive ? 'bg-black text-white' : 'text-black hover:bg-black/5'
                      }`
                    }
                  >
                    <span>{link.label}</span>
                    <span aria-hidden>→</span>
                  </NavLink>
                ))}
              </nav>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50">More</p>
              <nav className="mt-2 grid gap-1" aria-label="Mobile utility menu">
                {utilityLinks.map((link) => (
                  <NavLink
                    key={link.label}
                    to={link.href}
                    onClick={closeOverlays}
                    className="ui-interactive flex items-center justify-between px-2 py-2 text-sm text-black hover:bg-black/5"
                  >
                    <span>{link.label}</span>
                    <span aria-hidden>→</span>
                  </NavLink>
                ))}
              </nav>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
