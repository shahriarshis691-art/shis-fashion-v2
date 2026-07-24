import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import { founderProfile } from '../data/brandShowcase'

export default function FounderDetailPage() {
  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-7">
          <Button to="/brands" variant="secondary" className="mb-4">← Back to brands</Button>

          <div className="mt-4 grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
            <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[#0e0e0e]">
              <img
                src={founderProfile.image}
                alt={founderProfile.name}
                loading="eager"
                decoding="async"
                className="h-full min-h-[18rem] w-full object-cover"
              />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Founder</p>
              <h1 className="mt-2 text-4xl font-semibold text-[var(--color-text)]">{founderProfile.name}</h1>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">{founderProfile.title}</p>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">{founderProfile.bio}</p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{founderProfile.story}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={founderProfile.socials.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(0,0,0,0.15)]"
                >
                  WhatsApp
                </a>
                <a
                  href={founderProfile.socials.email}
                  className="inline-flex items-center rounded-full border border-[var(--color-border)] px-6 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
                >
                  E-mail
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
