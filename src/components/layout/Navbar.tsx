import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { subscribeToHomepageContent, type HomepageContent } from '../../firebase/adminService'
import { metaPixel } from '../../services/metaPixel'
import { googleAnalytics } from '../../services/googleAnalytics'
import { getSubcategoryLinksForSegment } from '../../data/categoryTaxonomy'

const BRAND_LOGO = '/hero/shis-brand-logo-v2.png'

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

const desktopNavLinks = [
  { label: 'Women', href: '/women' },
  { label: 'Men', href: '/men' },
  { label: 'Kids', href: '/kids' },
  { label: 'Sarees', href: '/sarees' },
  { label: 'Sale', href: '/sale' },
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
    <div className="border border-neutral-200">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="ui-interactive flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
      >
        <span>{title}</span>
        <span aria-hidden className="text-base leading-none text-neutral-400">
          {expanded ? '−' : '+'}
        </span>
      </button>

      <div
        className={`grid overflow-hidden border-t border-neutral-200 transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <nav className="min-h-0 grid gap-0.5 p-1.5" aria-label={`${title} links`}>
          {links.map((link) => (
            <NavLink
              key={`${title}-${link.label}-${link.href}`}
              to={link.href}
              onClick={onNavigate}
              className={({ isActive }) =>
                `ui-interactive flex items-center justify-between px-3 py-2.5 text-sm ${
                  isActive ? 'bg-neutral-950 text-white' : 'text-neutral-800 hover:bg-neutral-50'
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

const iconButtonClass =
  'ui-interactive inline-flex h-9 w-9 shrink-0 items-center justify-center text-neutral-900 transition-colors hover:text-neutral-500 md:h-10 md:w-10'

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [expandedMobileGroup, setExpandedMobileGroup] = useState<(typeof mobileMenuGroups)[number]['key'] | null>(
    'women',
  )
  const [searchTerm, setSearchTerm] = useState('')
  const lastSearchQueryRef = useRef<string | null>(null)
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

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[#eeeeee] bg-white">
        <div className="relative mx-auto flex h-16 w-full max-w-[1400px] items-center px-4 sm:px-6 md:h-[70px] md:px-10">
          {/* Left — hamburger (+ desktop nav) */}
          <div className="relative z-10 flex h-full min-w-0 flex-1 items-center justify-start gap-1 md:gap-6">
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
                <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-[22px] md:w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M6 6 18 18" />
                  <path d="M18 6 6 18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-[22px] md:w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </svg>
              )}
            </button>

            <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
              {desktopNavLinks.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  onClick={closeOverlays}
                  className={({ isActive }) =>
                    `text-[11px] font-medium tracking-[0.16em] uppercase transition-colors ${
                      isActive ? 'text-neutral-950' : 'text-neutral-600 hover:text-neutral-950'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Center — brand logo (dead-center; no stretch / flicker) */}
          <Link
            to="/"
            onClick={closeOverlays}
            className="absolute inset-y-0 left-1/2 z-20 flex h-full -translate-x-1/2 items-center justify-center"
            aria-label="SHIS Fashion home"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
          >
            <img
              src={BRAND_LOGO}
              alt="SHIS Fashion"
              width={180}
              height={36}
              decoding="sync"
              loading="eager"
              fetchPriority="high"
              className="navbar-brand-logo"
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              onError={(event) => {
                event.currentTarget.src = '/shis-logo.svg'
              }}
            />
          </Link>

          {/* Right — utility icons (balanced gap; does not shift logo) */}
          <div className="relative z-10 flex h-full flex-1 items-center justify-end gap-3.5">
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
              <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-[22px] md:w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>

            <Link to="/track-order" onClick={closeOverlays} className={iconButtonClass} aria-label="Track order" title="Track order">
              <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-[22px] md:w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </Link>

            <Link
              to="/cart"
              onClick={closeOverlays}
              className={`${iconButtonClass} relative`}
              aria-label={`Shopping bag, ${itemCount} items`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 md:h-[22px] md:w-[22px]" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {itemCount > 0 ? (
                <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-950 px-1 text-[9px] font-semibold text-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>

        {isSearchOpen ? (
          <div className="luxury-fade-in border-t border-[#eeeeee] bg-white">
            <div className="mx-auto flex w-full max-w-[1400px] gap-2 px-4 py-3 sm:px-6 md:px-10">
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
                className="w-full border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
              />
              <button
                type="button"
                onClick={runSearch}
                className="ui-interactive shrink-0 border border-neutral-950 bg-neutral-950 px-4 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-neutral-800"
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

          <aside className="luxury-sheet-up fixed inset-x-3 top-[calc(4rem+env(safe-area-inset-top))] z-50 max-h-[min(78vh,640px)] overflow-y-auto rounded-sm bg-white p-3 shadow-[0_22px_44px_rgba(0,0,0,0.18)] md:inset-x-auto md:left-6 md:w-[min(24rem,calc(100vw-3rem))] md:top-[calc(4.375rem+env(safe-area-inset-top))]">
            <p className="px-1 text-[11px] font-semibold tracking-[0.14em] text-neutral-400 uppercase">Menu</p>
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
