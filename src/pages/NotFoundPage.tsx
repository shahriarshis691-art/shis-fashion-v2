import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Button from '../components/ui/Button'
import Container from '../components/ui/Container'
import { applyNotFoundSeo } from '../utils/seo'

export default function NotFoundPage() {
  const location = useLocation()

  useEffect(() => {
    applyNotFoundSeo(location.pathname)
  }, [location.pathname])

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24" aria-labelledby="not-found-title">
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col items-center rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/90 px-6 py-12 text-center shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:px-10 sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[var(--color-accent)]">404</p>
          <h1 id="not-found-title" className="mt-4 text-4xl font-semibold tracking-tight text-[var(--color-text)] sm:text-5xl">Page not found</h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-[var(--color-muted)]">The page you’re looking for may have moved, been removed, or never existed. Return to the collection and continue your journey.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/">Back home</Button>
            <Button to="/shop" variant="secondary">Browse shop</Button>
          </div>
          <Link to="/contact" className="mt-6 text-sm font-semibold text-[var(--color-accent)]">Need help? Contact us</Link>
        </div>
      </Container>
    </section>
  )
}
