import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
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
      className="flex h-9 w-9 items-center justify-center rounded-md text-[#000000] antialiased transition-colors duration-200 hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2"
    >
      {children}
    </button>
  )
}

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null)
  const { theme, toggleTheme } = useTheme()
  const { itemCount } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const firstMobileLinkRef = useRef<HTMLAnchorElement | null>(null)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)
  const toggleMobileMenu = () => {
    setIsSearchOpen(false)
    setIsMobileMenuOpen((value) => !value)
  }
  const toggleSearch = () => {
    setIsMobileMenuOpen(false)
    setIsSearchOpen((value) => !value)
  }
  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative py-1 text-sm font-medium tracking-[0.3px] antialiased transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2 ${
      isActive
        ? 'font-semibold text-[#000000] after:absolute after:-bottom-3 after:left-0 after:h-[2px] after:w-full after:bg-[#000000] after:content-[\'\']'
        : 'text-[#000000] hover:text-[#000000] after:absolute after:-bottom-3 after:left-1/2 after:h-[1px] after:w-0 after:-translate-x-1/2 after:bg-[#000000] after:content-[\'\'] after:transition-all after:duration-200 after:ease-out hover:after:left-0 hover:after:w-full hover:after:translate-x-0'
    }`
  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative block rounded-md px-4 py-3.5 text-lg font-medium tracking-[0.3px] antialiased transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2 ${
      isActive
        ? 'font-semibold text-[#000000] after:absolute after:bottom-1.5 after:left-4 after:right-4 after:h-[2px] after:bg-[#000000] after:content-[\'\']'
        : 'text-[#000000] hover:bg-black hover:text-white'
    }`

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => setHomepageContent(content))
    return unsubscribe
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsSearchOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [isMobileMenuOpen])

  return (
    <>
      <header className={`sticky top-0 z-50 w-full border-b border-black bg-[#FFFFFF] transition-[box-shadow] duration-200 ${isScrolled ? 'shadow-[0_6px_20px_rgba(0,0,0,0.08)]' : 'shadow-none'}`}>
        <div className="grid h-20 w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6 md:h-[5.5rem] lg:h-24 lg:px-10">
            <Link to="/" className="group flex flex-shrink-0 items-center justify-center">
              <img 
                src="/shis-logo.svg" 
                alt="SHIS Fashion - Premium Essentials" 
                className="h-14 md:h-16 lg:h-20 w-auto object-contain"
                loading="eager"
              />
            </Link>

            <nav className="hidden items-center justify-self-center md:flex md:gap-6 lg:gap-9" aria-label="Primary navigation">
              {links.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.href}
                  className={desktopLinkClass}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center justify-self-end gap-1.5">
              <IconButton label="Search" onClick={toggleSearch}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="5.5" />
                  <path d="M15.5 15.5 20 20" />
                </svg>
              </IconButton>
              <Link
                to="/cart"
                className="relative flex h-9 w-9 items-center justify-center rounded-md text-[#000000] antialiased transition-colors duration-200 hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2"
                aria-label="Cart"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3.5 4.5h2l1.7 8.4a1 1 0 0 0 .98.8h8.6a1 1 0 0 0 .97-.8l1.1-5.4H7.5" />
                  <circle cx="10" cy="18" r="1.2" />
                  <circle cx="17" cy="18" r="1.2" />
                </svg>
                {itemCount > 0 ? <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#000000] px-0.5 text-[8px] font-bold text-white">{itemCount}</span> : null}
              </Link>
              <button
                type="button"
                onClick={toggleTheme}
                className="hidden h-9 items-center justify-center rounded-md border border-[#000000] px-2 text-xs font-semibold tracking-[0.3px] text-[#000000] transition-colors duration-200 hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2 sm:flex"
                aria-label="Toggle theme"
              >
                {theme === 'luxury' ? '🌙' : '☀️'}
              </button>
              <button
                type="button"
                onClick={toggleMobileMenu}
                className="flex h-9 w-9 items-center justify-center rounded-md text-[#000000] transition-colors duration-200 hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2 md:hidden"
                aria-label="Toggle navigation"
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                <span aria-hidden className="text-lg">{isMobileMenuOpen ? '×' : '☰'}</span>
              </button>
            </div>
        </div>

        <AnimatePresence>
          {isSearchOpen ? (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="border-b border-black bg-[#FFFFFF] px-4 py-3 sm:px-6 lg:px-10">
              <div className="flex gap-2">
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
                  className="flex-1 rounded-md border border-[#000000] bg-[#FFFFFF] px-4 py-2 text-sm tracking-[0.3px] text-[#000000] outline-none transition-colors duration-200 hover:border-[#000000] focus:border-[#000000] focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-1"
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
                  className="rounded-md border border-[#000000] bg-[#000000] px-4 py-2 text-sm font-semibold tracking-[0.3px] text-white transition-colors duration-200 hover:bg-white hover:text-[#000000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2"
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
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden border-t border-black bg-[#FFFFFF] md:hidden"
            >
              <nav className="space-y-1.5 px-4 py-5 sm:px-6" aria-label="Mobile navigation">
                {links.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                  >
                    <NavLink
                      to={link.href}
                      onClick={closeMobileMenu}
                      ref={index === 0 ? firstMobileLinkRef : undefined}
                      className={mobileLinkClass}
                    >
                      {link.label}
                    </NavLink>
                  </motion.div>
                ))}
              </nav>

              <div className="space-y-6 border-t border-black bg-[#FFFFFF] px-4 py-6 sm:px-6">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full rounded-md border border-[#000000] bg-[#000000] px-4 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-white hover:text-[#000000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2"
                >
                  {theme === 'luxury' ? '🌙 Midnight Mode' : '☀️ Luxury Mode'}
                </button>

                <div>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#000000]">Follow Us</p>
                  <div className="flex gap-4">
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-12 w-12 items-center justify-center rounded-md border border-[#000000] text-[#000000] transition-colors duration-200 hover:bg-[#000000] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2"
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
                      className="flex h-12 w-12 items-center justify-center rounded-md border border-[#000000] text-[#000000] transition-colors duration-200 hover:bg-[#000000] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2"
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
                      className="flex h-12 w-12 items-center justify-center rounded-md border border-[#000000] text-[#000000] transition-colors duration-200 hover:bg-[#000000] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2"
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
          ) : null}
        </AnimatePresence>
      </header>
    </>
  )
}
