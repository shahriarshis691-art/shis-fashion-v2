import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import shisLogo from '../../assets/logo/shis-logo.svg'
import { useCart } from '../../context/CartContext'
import { subscribeToHomepageContent, type HomepageContent } from '../../firebase/adminService'
import { metaPixel } from '../../services/metaPixel'
import { googleAnalytics } from '../../services/googleAnalytics'

const desktopQuickLinks = [
  { label: 'Kids', href: '/kids' },
  { label: 'Sale', href: '/sale' },
  { label: 'New Arrivals', href: '/shop/new-arrivals' },
]

const utilityLinks = [
  { label: 'Shop All', href: '/shop' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

const megaMenus = {
  women: {
    label: 'Women',
    href: '/women',
    eyebrow: 'WOMEN COLLECTION',
    title: 'Refined essentials for every day',
    links: [
      { label: 'Shop Women', href: '/women', note: 'Everyday edits' },
      { label: 'New Arrivals', href: '/shop/new-arrivals', note: 'Latest drops' },
      { label: 'Sale Picks', href: '/sale', note: 'Limited offers' },
      { label: 'All Products', href: '/shop', note: 'Full catalog' },
    ],
  },
  men: {
    label: 'Men',
    href: '/men',
    eyebrow: 'MEN COLLECTION',
    title: 'Minimal silhouettes with a tailored edge',
    links: [
      { label: 'Shop Men', href: '/men', note: 'Signature styles' },
      { label: 'New Arrivals', href: '/shop/new-arrivals', note: 'Fresh weekly' },
      { label: 'Best Sellers', href: '/shop/best-sellers', note: 'Most wanted' },
      { label: 'All Products', href: '/shop', note: 'Complete lineup' },
    ],
  },
} as const

const mobileSections = [
  {
    key: 'women',
    title: 'Women',
    links: megaMenus.women.links,
  },
  {
    key: 'men',
    title: 'Men',
    links: megaMenus.men.links,
  },
  {
    key: 'discover',
    title: 'Discover',
    links: [...desktopQuickLinks, ...utilityLinks],
  },
] as const

function isRouteActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

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
        `ui-interactive group relative whitespace-nowrap px-1 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
          isActive ? 'text-black' : 'text-black/65 hover:text-black'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {label}
          <span
            className={`absolute inset-x-1 -bottom-[2px] h-px origin-left bg-black transition-transform duration-300 ${
              isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
            }`}
          />
        </>
      )}
    </NavLink>
  )
}

function MegaMenuPanel({
  title,
  eyebrow,
  links,
  onNavigate,
}: {
  title: string
  eyebrow: string
  links: ReadonlyArray<{ label: string; href: string; note: string }>
  onNavigate: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.22 }}
      className="absolute left-1/2 top-full z-50 mt-4 w-[34rem] -translate-x-1/2 rounded-2xl border border-black/10 bg-white p-6 shadow-[0_25px_55px_rgba(0,0,0,0.12)]"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/50">{eyebrow}</p>
      <h3 className="mt-2 font-[var(--font-display)] text-[1.65rem] leading-none text-black">{title}</h3>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {links.map((link) => (
          <NavLink
            key={`${link.label}-${link.href}`}
            to={link.href}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group rounded-xl border px-4 py-3 transition-all duration-300 ${
                isActive ? 'border-black bg-black text-white' : 'border-black/10 hover:-translate-y-0.5 hover:border-black/35'
              }`
            }
          >
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em]">{link.label}</p>
            <p className="mt-1 text-xs text-black/60 group-hover:text-black/80">{link.note}</p>
          </NavLink>
        ))}
      </div>
    </motion.div>
  )
}

function MobileAccordionSection({
  title,
  expanded,
  onToggle,
  onNavigate,
  links,
}: {
  title: string
  expanded: boolean
  onToggle: () => void
  onNavigate: () => void
  links: ReadonlyArray<{ label: string; href: string }>
}) {
  return (
    <div className="rounded-xl border border-black/10 bg-white/80">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={expanded}
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black">{title}</span>
        <svg
          viewBox="0 0 24 24"
          className={`h-4 w-4 text-black/70 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="overflow-hidden border-t border-black/10"
          >
            <div className="space-y-1 p-2">
              {links.map((link) => (
                <NavLink
                  key={`${title}-${link.label}-${link.href}`}
                  to={link.href}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors duration-300 ${
                      isActive ? 'bg-black text-white' : 'text-black hover:bg-black/5'
                    }`
                  }
                >
                  <span>{link.label}</span>
                  <span aria-hidden className="text-base leading-none">›</span>
                </NavLink>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [openMegaMenu, setOpenMegaMenu] = useState<keyof typeof megaMenus | null>(null)
  const [expandedMobileSection, setExpandedMobileSection] = useState<(typeof mobileSections)[number]['key'] | null>('women')
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null)
  const { itemCount } = useCart()
  const location = useLocation()
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
        className={`sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur-md transition-all duration-300 ${
          isScrolled ? 'shadow-[0_10px_24px_rgba(0,0,0,0.08)]' : 'shadow-none'
        }`}
      >
        <div className="mx-auto flex h-[4.35rem] w-full max-w-7xl items-center px-3.5 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen(false)
              setIsMenuOpen((value) => !value)
            }}
            className="ui-interactive flex h-9 w-9 items-center justify-center rounded-md text-black hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 lg:hidden"
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

          <Link to="/" onClick={closeOverlays} className="ml-2 lg:ml-0" aria-label="SHIS Fashion home">
            <img src={shisLogo} alt="SHIS Fashion" className="h-9 w-auto sm:h-10" loading="eager" />
          </Link>

          <nav className="ml-10 hidden min-w-0 flex-1 items-center gap-7 lg:flex" aria-label="Primary navigation">
            {(Object.keys(megaMenus) as Array<keyof typeof megaMenus>).map((key) => {
              const section = megaMenus[key]
              const active = isRouteActive(location.pathname, section.href)

              return (
                <div
                  key={section.label}
                  className="relative"
                  onMouseEnter={() => setOpenMegaMenu(key)}
                  onMouseLeave={() => setOpenMegaMenu((current) => (current === key ? null : current))}
                >
                  <NavLink
                    to={section.href}
                    className={`group relative whitespace-nowrap px-1 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
                      active ? 'text-black' : 'text-black/65 hover:text-black'
                    }`}
                  >
                    {section.label}
                    <span
                      className={`absolute inset-x-1 -bottom-[2px] h-px origin-left bg-black transition-transform duration-300 ${
                        active || openMegaMenu === key ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </NavLink>

                  <AnimatePresence>
                    {openMegaMenu === key ? (
                      <div onMouseEnter={() => setOpenMegaMenu(key)} onMouseLeave={() => setOpenMegaMenu(null)}>
                        <MegaMenuPanel
                          title={section.title}
                          eyebrow={section.eyebrow}
                          links={section.links}
                          onNavigate={closeOverlays}
                        />
                      </div>
                    ) : null}
                  </AnimatePresence>
                </div>
              )
            })}

            {desktopQuickLinks.map((link) => (
              <CategoryLink key={link.label} href={link.href} label={link.label} onNavigate={closeOverlays} />
            ))}

            <div className="ml-1 h-5 w-px bg-black/10" />

            {utilityLinks.map((link) => (
              <CategoryLink key={link.label} href={link.href} label={link.label} onNavigate={closeOverlays} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <IconButton
              label="Search"
              onClick={() => {
                setIsMenuOpen(false)
                setIsSearchOpen((value) => !value)
              }}
            >
              <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="2">
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
                      if (query) {
                        metaPixel.search({ search_string: query })
                        googleAnalytics.search(query)
                      }
                      navigate(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop')
                      setIsSearchOpen(false)
                      setSearchTerm('')
                    }
                  }}
                  placeholder={homepageContent?.navbarSearchPlaceholder ?? 'Search products'}
                  className="w-full rounded-full border border-black/20 px-4 py-2.5 text-sm text-black outline-none transition-colors duration-300 focus:border-black"
                />
                <button
                  type="button"
                  onClick={() => {
                    const query = searchTerm.trim()
                    if (query) {
                      metaPixel.search({ search_string: query })
                      googleAnalytics.search(query)
                    }
                    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop')
                    setIsSearchOpen(false)
                    setSearchTerm('')
                  }}
                  className="ui-interactive rounded-full border border-black bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-black/90"
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
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={() => setIsMenuOpen(false)}
            />

            <motion.aside
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-y-0 left-0 z-50 w-[88vw] max-w-[25rem] overflow-y-auto border-r border-black/10 bg-white p-4 pb-8 shadow-[0_24px_48px_rgba(0,0,0,0.18)] lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-3">
                <p className="font-[var(--font-display)] text-2xl leading-none text-black">SHIS Fashion</p>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="ui-interactive flex h-8 w-8 items-center justify-center rounded-md text-black hover:bg-black/5"
                  aria-label="Close mobile menu"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6 18 18" />
                    <path d="M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-black/50">Menu</p>
              <nav className="mt-2 space-y-2" aria-label="Mobile navigation menu">
                {mobileSections.map((section) => (
                  <MobileAccordionSection
                    key={section.key}
                    title={section.title}
                    links={section.links}
                    expanded={expandedMobileSection === section.key}
                    onToggle={() =>
                      setExpandedMobileSection((current) => (current === section.key ? null : section.key))
                    }
                    onNavigate={closeOverlays}
                  />
                ))}
              </nav>

              <Link
                to="/shop"
                onClick={closeOverlays}
                className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-black/90"
              >
                Explore Full Collection
              </Link>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  )
}
