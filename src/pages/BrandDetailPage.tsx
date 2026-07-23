import { useParams } from 'react-router-dom'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import { brandEntries } from '../data/brandShowcase'

export default function BrandDetailPage() {
  const { slug } = useParams()
  const brand = brandEntries.find((entry) => entry.id === slug)

  if (!brand) {
    return (
      <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
        <Container>
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-6 text-center">
            <h1 className="text-2xl font-semibold text-[var(--color-text)]">Brand not found</h1>
            <p className="mt-2 text-[var(--color-muted)]">The brand you're looking for doesn't exist.</p>
            <Button to="/brands" variant="secondary" className="mt-4">Back to brands</Button>
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-7">
          <Button to="/brands" variant="secondary" className="mb-4">← Back to brands</Button>

          <div className="mt-4 grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
            <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-bg)]">
              <img
                src={brand.logo}
                alt={`${brand.name} logo`}
                className="h-auto w-full object-cover"
              />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">{brand.tag}</p>
              <h1 className="mt-2 text-4xl font-semibold text-[var(--color-text)]">{brand.name}</h1>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">{brand.summary}</p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{brand.details}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={brand.contacts.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(0,0,0,0.15)]"
                >
                  Visit website
                </a>
                <a
                  href={brand.contacts.contact}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
                >
                  Contact brand
                </a>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-bg)]/60 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">About {brand.name}</p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              {brand.summary}
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              {brand.details}
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}
