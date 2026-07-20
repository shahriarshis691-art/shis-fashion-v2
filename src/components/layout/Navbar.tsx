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
      <header className={`sticky top-0 z-50 w-full bg-[#FFFFFF] transition-[box-shadow] duration-200 ${isScrolled ? 'shadow-[0_6px_20px_rgba(0,0,0,0.08)]' : 'shadow-none'}`}>
        <div className="flex h-auto w-full items-center gap-3 px-4 py-3 sm:px-6 md:h-[5.5rem] lg:h-24 lg:px-10">
          <Link to="/" className="group flex flex-shrink-0 items-center justify-center">
            <img
              src="/shis-logo.svg"
              alt="SHIS Fashion - Premium Essentials"
              className="h-12 w-auto object-contain md:h-14 lg:h-20"
              loading="eager"
            />
          </Link>

          <nav className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-6 lg:gap-9" aria-label="Primary navigation">
            {links.map((link) => (
              <NavLink
                key={link.label}
                to={link.href}
                className={({ isActive }) => {
                  const baseClass = `whitespace-nowrap rounded-md px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000000] focus-visible:ring-offset-2 md:px-0 md:py-1 md:text-sm md:font-medium md:tracking-[0.3px] ${
                    isActive
                      ? 'bg-black text-white md:bg-transparent md:text-[#000000] md:font-semibold md:after:absolute md:after:-bottom-3 md:after:left-0 md:after:h-[2px] md:after:w-full md:after:bg-[#000000] md:after:content-[\'\']'
                      : 'text-[#000000] hover:bg-black hover:text-white md:hover:bg-transparent md:hover:text-[#000000] md:after:absolute md:after:-bottom-3 md:after:left-1/2 md:after:h-[1px] md:after:w-0 md:after:-translate-x-1/2 md:after:bg-[#000000] md:after:content-[\'\'] md:after:transition-all md:after:duration-200 md:after:ease-out md:hover:after:left-0 md:hover:after:w-full md:hover:after:translate-x-0'
                  }`

                  return baseClass
                }}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
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
