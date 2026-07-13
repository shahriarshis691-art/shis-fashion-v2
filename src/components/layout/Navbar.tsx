import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import Button from '../ui/Button'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[rgba(255,255,255,0.82)] shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl' : 'bg-transparent'}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-sm font-semibold text-[var(--color-accent)]">
            SF
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--color-text)]">Shis</p>
            <p className="text-xs tracking-[0.2em] text-[var(--color-muted)]">Fashion</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.href}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-300 ${isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text)] hover:text-[var(--color-accent)]'}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <button className="rounded-full border border-[var(--color-border)] p-3 text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]" aria-label="Search">
            ⌕
          </button>
          <button className="rounded-full border border-[var(--color-border)] p-3 text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]" aria-label="Cart">
            👜
          </button>
          <button
            className="rounded-full border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'luxury' ? '☾' : '☀'}
          </button>
          <Button to="/admin" variant="secondary" className="px-4 py-2.5">
            Admin Login
          </Button>
        </div>

        <button
          className="rounded-full border border-[var(--color-border)] p-3 text-[var(--color-text)] md:hidden"
          onClick={() => setIsMobileMenuOpen((state) => !state)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-xl md:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:px-6">
              {links.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `rounded-2xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-[rgba(201,162,39,0.12)] text-[var(--color-accent)]' : 'text-[var(--color-text)] hover:bg-[rgba(201,162,39,0.08)]'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <button
                className="mt-2 rounded-full border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                onClick={toggleTheme}
              >
                Toggle theme ({theme === 'luxury' ? 'Midnight' : 'Luxury'})
              </button>
              <Button to="/admin" variant="primary" className="w-full justify-center">
                Admin Login
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
