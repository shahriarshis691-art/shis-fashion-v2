import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import shisLogo from '../../assets/logo/shis-logo.svg'
import { useCart } from '../../context/CartContext'
import { subscribeToHomepageContent, type HomepageContent } from '../../firebase/adminService'
import { metaPixel } from '../../services/metaPixel'
import { googleAnalytics } from '../../services/googleAnalytics'
import { getSubcategoryLinksForSegment } from '../../data/categoryTaxonomy'

const primaryLinks = [
  { label: 'Women', href: '/women' },
  { label: 'Men', href: '/men' },
  { label: 'Kids', href: '/kids' },
  { label: 'Sale', href: '/sale' },
  { label: 'New Arrivals', href: '/shop/new-arrivals' },
  { label: 'XEROXII', href: '/brands/xeroxii' },
  { label: 'CERAVO', href: '/brands/ceravo' },
  { label: 'FOUNDER', href: '/founder' },
]

const utilityLinks = [
  { label: 'Shop All', href: '/shop' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const megaMenuGroups = {
  women: {
    label: 'Women',
    href: '/women',
    links: getSubcategoryLinksForSegment('women'),
  },
  men: {
    label: 'Men',
    href: '/men',
    links: getSubcategoryLinksForSegment('men'),
  },
} as const

const mobileMenuGroups = [
  {
    key: 'women',
    title: 'Women',
    links: megaMenuGroups.women.links,
  },
  {
    key: 'men',
    title: 'Men',
    links: megaMenuGroups.men.links,
  },
  {
    key: 'discover',
    title: 'Discover',
    links: [...primaryLinks.filter((link) => link.label !== 'Women' && link.label !== 'Men'), ...utilityLinks],
  },
] as const

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

function MobileAccordionGroup({
  title,
  expanded,
  onToggle,
  links,
  onNavigate,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  links: ReadonlyArray<{ label: string; href: string }>
  onNavigate: () => void
}) {
  return (
    <div className="border border-black/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="ui-interactive flex w-full items-center justify-between px-2 py-2 text-sm font-medium text-black hover:bg-black/5"
      >
        <span>{title}</span>
        <span aria-hidden className="text-base leading-none">{expanded ? '−' : '+'}</span>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-black/10"
          >
            <nav className="grid gap-1 p-1.5" aria-label={`${title} links`}>
              {links.map((link) => (
                <NavLink
                  key={`${title}-${link.label}-${link.href}`}
                  to={link.href}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `ui-interactive flex items-center justify-between px-2 py-2 text-sm ${
                      isActive ? 'bg-black text-white' : 'text-black hover:bg-black/5'
                    }`
                  }
                >
                  <span>{link.label}</span>
                  <span aria-hidden>→</span>
                </NavLink>
              ))}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openMegaMenu, setOpenMegaMenu] = useState<keyof typeof megaMenuGroups | null>(null)
  const [expandedMobileGroup, setExpandedMobileGroup] = useState<(typeof mobileMenuGroups)[number]['key'] | null>('women')
  const [searchTerm, setSearchTerm] = useState('')
  const lastSearchQueryRef = useRef<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null)
  const { itemCount } = useCart()
  const navigate = useNavigate()

  const closeOverlays = () => {
    setIsSearchOpen(false)
    setIsMenuOpen(false)
    setOpenMegaMenu(null)
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
        <div className="mx-auto flex h-[4rem] sm:h-[3.7rem] w-full max-w-7xl items-center px-3.5 sm:px-6 lg:px-8">
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
            <img src={shisLogo} alt="SHIS Fashion" className="h-9 w-auto sm:h-8" loading="eager" />
          </Link>

          <nav className="ml-8 hidden min-w-0 flex-1 items-center gap-5 md:flex" aria-label="Primary navigation">
            {primaryLinks.map((link) => {
              const key = link.label.toLowerCase() as keyof typeof megaMenuGroups
              const hasMegaMenu = key in megaMenuGroups

              if (!hasMegaMenu) {
                return <CategoryLink key={link.label} href={link.href} label={link.label} onNavigate={closeOverlays} />
              }

              const menu = megaMenuGroups[key]

              return (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setOpenMegaMenu(key)}
                  onMouseLeave={() => setOpenMegaMenu((current) => (current === key ? null : current))}
                >
                  <CategoryLink href={menu.href} label={menu.label} onNavigate={closeOverlays} />

                  <AnimatePresence>
                    {openMegaMenu === key ? (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-0 top-full z-50 mt-2 w-56 border border-black/10 bg-white p-2 shadow-[0_14px_28px_rgba(0,0,0,0.12)]"
                      >
                        <nav className="grid gap-1" aria-label={`${menu.label} dropdown`}>
                          {menu.links.map((item) => (
                            <NavLink
                              key={`${menu.label}-${item.label}`}
                              to={item.href}
                              onClick={closeOverlays}
                              className={({ isActive }) =>
                                `ui-interactive flex items-center justify-between px-2 py-2 text-sm ${
                                  isActive ? 'bg-black text-white' : 'text-black hover:bg-black/5'
                                }`
                              }
                            >
                              <span>{item.label}</span>
                              <span aria-hidden>→</span>
                            </NavLink>
                          ))}
                        </nav>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              )
            })}
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
                      if (query && lastSearchQueryRef.current !== query) {
                        lastSearchQueryRef.current = query
                        metaPixel.trackSearch({ search_string: query })
                        googleAnalytics.search(query)
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
                    if (query && lastSearchQueryRef.current !== query) {
                      lastSearchQueryRef.current = query
                      metaPixel.trackSearch({ search_string: query })
                      googleAnalytics.search(query)
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

        <nav className="border-t border-black/10 md:hidden" aria-label="Primary categories">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-4 overflow-x-auto px-3.5 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {primaryLinks.map((link) => (
              <CategoryLink key={link.label} href={link.href} label={link.label} onNavigate={closeOverlays} />
            ))}
          </div>
        </nav>
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
              className="fixed inset-x-3 top-[calc(4rem+env(safe-area-inset-top))] z-50 rounded-md bg-white p-3 shadow-[0_22px_44px_rgba(0,0,0,0.22)] md:hidden"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50">Categories</p>
              <div className="mt-2 grid gap-2" aria-label="Mobile category menu">
                {mobileMenuGroups.map((group) => (
                  <MobileAccordionGroup
                    key={group.key}
                    title={group.title}
                    links={group.links}
                    expanded={expandedMobileGroup === group.key}
                    onToggle={() =>
                      setExpandedMobileGroup((current) => (current === group.key ? null : group.key))
                    }
                    onNavigate={closeOverlays}
                  />
                ))}
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
