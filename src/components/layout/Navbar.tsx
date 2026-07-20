import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
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
      className="flex h-9 w-9 items-center justify-center rounded-md text-[#000000] antialiased transition-colors duration-200 hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2"
    >
      {children}
    </button>
  )
}

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null)
  const { theme, toggleTheme } = useTheme()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const toggleSearch = () => {
    setIsSearchOpen((value) => !value)
  }
  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative py-1 text-sm font-medium tracking-[0.3px] antialiased transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2 ${
      isActive
        ? 'font-semibold text-[#000000] after:absolute after:-bottom-3 after:left-0 after:h-[2px] after:w-full after:bg-[#000000] after:content-[\'\']'
        : 'text-[#000000] hover:text-[#000000] after:absolute after:-bottom-3 after:left-1/2 after:h-[1px] after:w-0 after:-translate-x-1/2 after:bg-[#000000] after:content-[\'\'] after:transition-all after:duration-200 after:ease-out hover:after:left-0 hover:after:w-full hover:after:translate-x-0'
    }`
  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-md px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2 ${
      isActive
        ? 'bg-black text-white'
        : 'text-[#000000] hover:bg-black hover:text-white'
    }`

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
      if (e.key === 'Escape') setIsSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [])

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
            </div>
        </div>

        <div className="border-t border-black/10 md:hidden">
          <nav className="flex items-center gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Mobile navigation">
            {links.map((link) => (
              <NavLink key={link.label} to={link.href} className={mobileLinkClass}>
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/shop"
              className="whitespace-nowrap rounded-md border border-black px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-black"
            >
              Search
            </Link>
            <Link
              to="/cart"
              className="whitespace-nowrap rounded-md border border-black px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-black"
            >
              Cart {itemCount > 0 ? `(${itemCount})` : ''}
            </Link>
          </nav>
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

      </header>
    </>
  )
}
