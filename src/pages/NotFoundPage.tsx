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
    <section className="bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-8 lg:py-24" aria-labelledby="not-found-title">
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col items-center px-2 py-12 text-center md:py-16">
          <p className="text-caption uppercase tracking-[0.24em] text-black/55">404</p>
          <h1 id="not-found-title" className="mt-4 text-4xl font-normal tracking-tight text-neutral-900 sm:text-5xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Page not found</h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-neutral-600">The page you’re looking for may have moved, been removed, or never existed. Return to the collection and continue your journey.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button to="/" variant="cta">Back home</Button>
            <Button to="/shop" variant="secondary">Browse shop</Button>
          </div>
          <Link to="/contact" className="mt-6 text-sm font-semibold text-neutral-900 underline underline-offset-4">Need help? Contact us</Link>
        </div>
      </Container>
    </section>
  )
}
