import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useCartDrawer } from '../../context/CartDrawerContext'
import { useWishlist } from '../../context/WishlistContext'
import type { HomepageContent } from '../../firebase/adminService'
import { metaPixel } from '../../services/metaPixel'
import { googleAnalytics } from '../../services/googleAnalytics'
import { getSubcategoryLinksForSegment } from '../../data/categoryTaxonomy'

const BRAND_LOGO = '/hero/shis-brand-logo-v2.png'

const desktopNavLinks = [
  { label: 'Women', href: '/women' },
  { label: 'Men', href: '/men' },
  { label: 'Kids', href: '/kids' },
  { label: 'Sarees', href: '/sarees' },
  { label: 'Collections', href: '/shop/new-arrivals' },
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
  kids: {
    label: 'Kids',
    href: '/kids',
    links: getSubcategoryLinksForSegment('kids'),
  },
} as const

const mobileMenuGroups = [
  {
    key: 'women',
    title: 'Women',
    links: [{ label: 'Shop Women', href: megaMenuGroups.women.href }, ...megaMenuGroups.women.links],
  },
  {
    key: 'men',
    title: 'Men',
    links: [{ label: 'Shop Men', href: megaMenuGroups.men.href }, ...megaMenuGroups.men.links],
  },
  {
    key: 'kids',
    title: 'Kids',
    links: [{ label: 'Shop Kids', href: megaMenuGroups.kids.href }, ...megaMenuGroups.kids.links],
  },
  {
    key: 'saree',
    title: 'Saree',
    links: [
      { label: 'All Sarees', href: '/sarees' },
      { label: 'Shop Women', href: '/women' },
    ],
  },
  {
    key: 'collections',
    title: 'Collections',
    links: [
      { label: 'New Arrivals', href: '/shop/new-arrivals' },
      { label: 'Oversized Tee', href: '/collections/oversized-tee' },
      { label: 'Half Shirts', href: '/men/half-shirts' },
      { label: "Women's Baggy", href: '/women/womens-baggy' },
      { label: 'Sale', href: '/sale' },
      { label: 'Shop All', href: '/shop' },
    ],
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
    <div className="border-b border-neutral-200">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="ui-interactive flex w-full items-center justify-between py-3.5 text-left text-sm font-medium tracking-[0.08em] text-[#111111] uppercase"
      >
        <span>{title}</span>
        <span aria-hidden className="text-base leading-none text-neutral-400">
          {expanded ? '−' : '+'}
        </span>
      </button>

      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <nav className="min-h-0 grid gap-0.5 pb-3" aria-label={`${title} links`}>
          {links.map((link) => (
            <NavLink
              key={`${title}-${link.label}-${link.href}`}
              to={link.href}
              onClick={onNavigate}
              className={({ isActive }) =>
                `ui-interactive px-1 py-2 text-sm ${
                  isActive ? 'text-[#111111]' : 'text-neutral-500 hover:text-[#111111]'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

const iconButtonClass =
  'ui-interactive inline-flex h-10 w-10 shrink-0 items-center justify-center text-[#111111] transition-colors hover:text-neutral-500'

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [expandedMobileGroup, setExpandedMobileGroup] = useState<(typeof mobileMenuGroups)[number]['key'] | null>(
    'women',
  )
  const [searchTerm, setSearchTerm] = useState('')
  const lastSearchQueryRef = useRef<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null)
  const { itemCount } = useCart()
  const { itemCount: wishlistCount } = useWishlist()
  const { openCart } = useCartDrawer()
  const navigate = useNavigate()

  const closeOverlays = () => {
    setIsSearchOpen(false)
    setIsMenuOpen(false)
  }

  useEffect(() => {
    let active = true
    let unsubscribe = () => {}

    void import('../../firebase/adminService').then(({ subscribeToHomepageContent }) => {
      if (!active) {
        return
      }
      unsubscribe = subscribeToHomepageContent((content: HomepageContent) => setHomepageContent(content))
    })

    return () => {
      active = false
      unsubscribe()
    }
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
    if (!isMenuOpen && !isSearchOpen) {
      document.body.style.overflow = ''
      return
    }

    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen, isSearchOpen])

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus()
    }
  }, [isSearchOpen])

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
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-md">
        <div className="relative mx-auto flex h-16 w-full max-w-[1400px] items-center px-4 sm:px-6 md:h-[70px] md:px-10">
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

            <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
              {desktopNavLinks.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  onClick={closeOverlays}
                  className={({ isActive }) =>
                    `text-[11px] font-medium tracking-[0.18em] uppercase transition-colors ${
                      isActive ? 'text-[#111111]' : 'text-neutral-500 hover:text-[#111111]'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <Link
            to="/"
            onClick={closeOverlays}
            className="absolute inset-y-0 left-1/2 z-20 flex h-full -translate-x-1/2 items-center justify-center"
            aria-label="SHIS Fashion home"
          >
            <img
              src={BRAND_LOGO}
              alt="SHIS Fashion"
              width={180}
              height={36}
              decoding="async"
              loading="eager"
              fetchPriority="low"
              className="navbar-brand-logo"
              onError={(event) => {
                event.currentTarget.src = '/shis-logo.svg'
              }}
            />
          </Link>

          <div className="relative z-10 flex h-full flex-1 items-center justify-end gap-1 sm:gap-2">
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
              to="/cart#wishlist"
              onClick={closeOverlays}
              className={`${iconButtonClass} relative`}
              aria-label={`Wishlist, ${wishlistCount} saved`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill={wishlistCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 ? (
                <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#111111] px-1 text-[9px] font-semibold text-white">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              ) : null}
            </Link>

            <Link to="/track-order" onClick={closeOverlays} className={`${iconButtonClass} hidden sm:inline-flex`} aria-label="Account and order tracking" title="Track order">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </Link>

            <button
              type="button"
              onClick={() => {
                closeOverlays()
                openCart()
              }}
              className={`${iconButtonClass} relative`}
              aria-label={`Shopping bag, ${itemCount} items`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {itemCount > 0 ? (
                <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#111111] px-1 text-[9px] font-semibold text-white">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      {isSearchOpen ? (
        <>
          <button
            type="button"
            aria-label="Close search"
            className="luxury-fade-in fixed inset-0 z-[80] bg-black/40"
            onClick={() => setIsSearchOpen(false)}
          />
          <aside className="luxury-sheet-up fixed inset-x-0 top-0 z-[90] border-b border-neutral-200 bg-white px-4 py-5 sm:px-8">
            <div className="mx-auto flex w-full max-w-[720px] items-center gap-3">
              <label htmlFor="site-search" className="sr-only">
                Search products
              </label>
              <input
                id="site-search"
                ref={searchInputRef}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    runSearch()
                  }
                }}
                placeholder={homepageContent?.navbarSearchPlaceholder ?? 'Search products'}
                className="lux-input bg-white px-0 py-3 text-base"
              />
              <button
                type="button"
                onClick={runSearch}
                className="shrink-0 bg-[#111111] px-4 py-3 text-[11px] font-semibold tracking-[0.16em] text-white uppercase"
              >
                Search
              </button>
            </div>
          </aside>
        </>
      ) : null}

      {isMenuOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="luxury-fade-in fixed inset-0 z-40 bg-black/40"
            onClick={() => setIsMenuOpen(false)}
          />

          <aside className="luxury-sheet-up fixed inset-y-0 left-0 z-50 flex w-[min(22rem,88vw)] flex-col bg-white px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[18px_0_48px_rgba(0,0,0,0.12)]">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <p className="text-[11px] font-medium tracking-[0.18em] text-neutral-400 uppercase">Menu</p>
              <button type="button" onClick={() => setIsMenuOpen(false)} className={iconButtonClass} aria-label="Close menu">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M6 6 18 18" />
                  <path d="M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="mt-2 flex-1 overflow-y-auto" aria-label="Site menu">
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
              <div className="mt-6 grid gap-3 text-sm text-neutral-600">
                <Link to="/track-order" onClick={closeOverlays} className="hover:text-[#111111]">Track order</Link>
                <Link to="/about" onClick={closeOverlays} className="hover:text-[#111111]">About</Link>
                <Link to="/contact" onClick={closeOverlays} className="hover:text-[#111111]">Contact</Link>
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </>
  )
}
