import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
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

      <div
        className={`grid overflow-hidden border-t border-black/10 transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <nav className="min-h-0 grid gap-1 p-1.5" aria-label={`${title} links`}>
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
      </div>
    </div>
  )
}

export default function Navbar() {
  const location = useLocation()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [expandedMobileGroup, setExpandedMobileGroup] = useState<(typeof mobileMenuGroups)[number]['key'] | null>('women')
  const [searchTerm, setSearchTerm] = useState('')
  const lastSearchQueryRef = useRef<string | null>(null)
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null)
  const { itemCount } = useCart()
  const navigate = useNavigate()

  const isHeroOverlay = location.pathname === '/'

  const closeOverlays = () => {
    setIsSearchOpen(false)
    setIsMenuOpen(false)
  }

  useEffect(() => {
    const unsubscribe = subscribeToHomepageContent((content) => setHomepageContent(content))
    return unsubscribe
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

  const runSearch = () => {
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

  const iconButtonClass = isHeroOverlay
    ? 'ui-interactive p-2 text-white hover:text-white/75 transition-colors'
    : 'ui-interactive p-2 text-neutral-900 hover:text-neutral-600 transition-colors'

  return (
    <>
      <header
        className={`left-0 top-0 z-50 w-full ${
          isHeroOverlay
            ? 'absolute bg-transparent bg-gradient-to-b from-black/40 to-transparent'
            : 'sticky border-b border-neutral-200/60 bg-white/95 backdrop-blur-md'
        }`}
      >
        <div className="flex w-full items-center justify-between px-6 py-4 md:px-12 md:py-6">
          <Link
            to="/"
            onClick={closeOverlays}
            className={`font-brand text-lg font-bold tracking-[0.08em] antialiased md:text-xl ${
              isHeroOverlay ? 'text-white' : 'text-neutral-900'
            }`}
          >
            SHIS FASHION
          </Link>

          <div className="flex items-center gap-5 md:gap-6">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false)
                setIsSearchOpen((value) => !value)
              }}
              className={iconButtonClass}
              aria-label="Search"
              aria-expanded={isSearchOpen}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>

            <Link
              to="/cart"
              onClick={closeOverlays}
              className={`${iconButtonClass} relative`}
              aria-label={`Shopping bag, ${itemCount} items`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false)
                setIsMenuOpen((value) => !value)
              }}
              className={iconButtonClass}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M6 6 18 18" />
                  <path d="M18 6 6 18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {isSearchOpen ? (
          <div
            className={`luxury-fade-in border-t ${
              isHeroOverlay
                ? 'border-white/15 bg-black/75 backdrop-blur-md'
                : 'border-black/10 bg-white'
            }`}
          >
            <div className="mx-auto flex w-full max-w-7xl gap-2 px-6 py-3 md:px-12">
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
                    runSearch()
                  }
                }}
                placeholder={homepageContent?.navbarSearchPlaceholder ?? 'Search products'}
                className={`w-full border px-3 py-2 text-sm outline-none ${
                  isHeroOverlay
                    ? 'border-white/25 bg-white/10 text-white placeholder:text-white/55 focus:border-white/45'
                    : 'border-black/20 text-black focus:border-black'
                }`}
              />
              <button
                type="button"
                onClick={runSearch}
                className={`ui-interactive border px-4 py-2 text-sm font-semibold ${
                  isHeroOverlay
                    ? 'border-white bg-white text-neutral-900 hover:bg-white/90'
                    : 'border-black bg-black text-white hover:bg-black/90'
                }`}
              >
                Search
              </button>
            </div>
          </div>
        ) : null}
      </header>

      {isMenuOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="luxury-fade-in fixed inset-0 z-40 bg-black/40"
            onClick={() => setIsMenuOpen(false)}
          />

          <aside className="luxury-sheet-up fixed inset-x-3 top-[calc(4.5rem+env(safe-area-inset-top))] z-50 max-h-[min(78vh,640px)] overflow-y-auto rounded-md bg-white p-3 shadow-[0_22px_44px_rgba(0,0,0,0.22)] md:inset-x-auto md:right-12 md:left-auto md:w-[min(24rem,calc(100vw-3rem))] md:top-[calc(5.5rem+env(safe-area-inset-top))]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50">Menu</p>
            <div className="mt-2 grid gap-2" aria-label="Site menu">
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
          </aside>
        </>
      ) : null}
    </>
  )
}
