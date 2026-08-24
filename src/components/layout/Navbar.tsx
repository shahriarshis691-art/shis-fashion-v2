import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
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
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [expandedMobileGroup, setExpandedMobileGroup] = useState<(typeof mobileMenuGroups)[number]['key'] | null>('women')
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

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-neutral-200/60 bg-white/95 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 sm:h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* LEFT: Mobile Hamburger */}
          <div className="flex items-center justify-start flex-1 md:hidden">
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false)
                setIsMenuOpen((value) => !value)
              }}
              className="ui-interactive p-2 -ml-2 text-neutral-900 hover:text-neutral-600 transition"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 6 18 18" />
                  <path d="M18 6 6 18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 7h16" />
                  <path d="M4 12h16" />
                  <path d="M4 17h16" />
                </svg>
              )}
            </button>
          </div>

          {/* CENTER: Brand */}
          <div className="flex flex-shrink-0 items-center justify-center">
            <Link to="/" onClick={closeOverlays} className="text-center">
              <span className="font-brand tracking-[0.3em] text-lg sm:text-2xl font-light text-neutral-900 uppercase antialiased">
                SHIS FASHION
              </span>
            </Link>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center justify-end flex-1 gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false)
                setIsSearchOpen((value) => !value)
              }}
              className="ui-interactive p-2 text-neutral-900 hover:text-neutral-600 transition"
              aria-label="Search"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>

            <Link
              to="/cart"
              onClick={closeOverlays}
              className="ui-interactive relative p-2 -mr-2 text-neutral-900 hover:text-neutral-600 transition"
              aria-label="Shopping Cart"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute top-1 right-0.5 min-w-[18px] h-[18px] bg-black text-white text-[10px] font-semibold flex items-center justify-center rounded-full px-1">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {isSearchOpen ? (
          <div className="luxury-fade-in border-t border-black/10 bg-white">
              <div className="mx-auto flex w-full max-w-7xl gap-2 px-4 py-3 sm:px-6">
                <label htmlFor="site-search" className="sr-only">
                  Search products
                </label>
                <input
                  id="site-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm((event.target as HTMLInputElement).value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      const query = (event.target as HTMLInputElement).value.trim()
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
            </div>
          ) : null}

        <nav className="border-t border-black/10 md:hidden" aria-label="Primary categories">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-4 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {primaryLinks.map((link) => (
              <CategoryLink key={link.label} href={link.href} label={link.label} onNavigate={closeOverlays} />
            ))}
          </div>
        </nav>
      </header>

      {isMenuOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="luxury-fade-in fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />

          <aside className="luxury-sheet-up fixed inset-x-3 top-[calc(4rem+env(safe-area-inset-top))] z-50 rounded-md bg-white p-3 shadow-[0_22px_44px_rgba(0,0,0,0.22)] md:hidden">
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
          </aside>
        </>
      ) : null}
    </>
  )
}
