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
  { label: 'Admin', href: '/admin' },
]

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 text-[var(--color-text)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
    >
      {children}
    </button>
  )
}

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
    <header className="sticky top-0 z-50 w-full">
      <div
        className={`mx-auto max-w-7xl px-3 pt-3 transition-all duration-300 sm:px-6 lg:px-8 ${isScrolled ? 'translate-y-0' : 'translate-y-0'}`}
      >
        <div
          className={`flex items-center justify-between rounded-full border px-3 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl transition-all duration-300 sm:px-4 ${isScrolled ? 'border-[var(--color-border)] bg-[var(--color-surface)]/80' : 'border-transparent bg-[rgba(255,255,255,0.12)]'}`}
        >
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-sm font-semibold text-[var(--color-accent)]">
              SF
            </div>
            <div className="leading-none">
              <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-[var(--color-text)]">Shis</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--color-muted)]">Fashion</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
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

          <div className="flex items-center gap-2">
            <IconButton label="Search">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="5.5" />
                <path d="M15.5 15.5 20 20" />
              </svg>
            </IconButton>
            <IconButton label="Cart">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3.5 4.5h2l1.7 8.4a1 1 0 0 0 .98.8h8.6a1 1 0 0 0 .97-.8l1.1-5.4H7.5" />
                <circle cx="10" cy="18" r="1.2" />
                <circle cx="17" cy="18" r="1.2" />
              </svg>
            </IconButton>
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden h-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3 text-sm font-medium text-[var(--color-text)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] sm:flex"
              aria-label="Toggle theme"
            >
              {theme === 'luxury' ? 'Midnight' : 'Luxury'}
            </button>
            <Button to="/admin" variant="secondary" className="hidden px-4 py-2.5 sm:inline-flex">
              Admin
            </Button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 text-[var(--color-text)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] md:hidden"
              aria-label="Toggle navigation"
            >
              {isMobileMenuOpen ? '×' : '☰'}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[var(--color-bg)]/95 px-4 pb-6 pt-24 backdrop-blur-2xl md:hidden"
          >
            <div className="mx-auto flex h-full max-w-5xl flex-col justify-between rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
              <div className="space-y-2">
                {links.map((link, index) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                  >
                    <NavLink
                      to={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-2xl px-4 py-4 text-base font-medium transition ${isActive ? 'bg-[rgba(201,162,39,0.12)] text-[var(--color-accent)]' : 'text-[var(--color-text)] hover:bg-[rgba(201,162,39,0.08)]'}`
                      }
                    >
                      <span>{link.label}</span>
                      <span className="text-sm text-[var(--color-muted)]">↗</span>
                    </NavLink>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex w-full items-center justify-between rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text)]"
                >
                  <span>Theme</span>
                  <span className="text-[var(--color-accent)]">{theme === 'luxury' ? 'Midnight' : 'Luxury'}</span>
                </button>
                <Button to="/admin" variant="primary" className="w-full justify-center">
                  Admin Access
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
