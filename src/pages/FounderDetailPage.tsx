import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import { founderProfile as staticFounderProfile } from '../data/brandShowcase'
import { subscribeToFounderProfile, type FounderProfile } from '../firebase/adminService'
import { applySeoMetadata } from '../utils/seo'

export default function FounderDetailPage() {
  const location = useLocation()
  const [liveFounderProfile, setLiveFounderProfile] = useState<FounderProfile | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToFounderProfile((profile) => setLiveFounderProfile(profile))
    return unsubscribe
  }, [])

  const displayFounder = liveFounderProfile ?? staticFounderProfile

  useEffect(() => {
    applySeoMetadata(location.pathname, {
      title: `${displayFounder.name} | SHIS Fashion Bangladesh`,
      description: displayFounder.bio,
    })
  }, [location.pathname, displayFounder])

  return (
    <section className="px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24 lg:pt-10">
      <Container>
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)]/80 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.06)] sm:p-7">
          <Button to="/brands" variant="secondary" className="mb-4">← Back to brands</Button>

          <div className="mt-4 grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
            <div className="overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[#0e0e0e]">
              <img
                src={displayFounder.image}
                alt={displayFounder.name}
                loading="eager"
                decoding="async"
                className="h-full min-h-[18rem] w-full object-cover"
              />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">Founder</p>
              <h1 className="mt-2 text-4xl font-semibold text-[var(--color-text)]">{displayFounder.name}</h1>
              <p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">{displayFounder.title}</p>
              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">{displayFounder.bio}</p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{displayFounder.story}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={displayFounder.socials.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(0,0,0,0.15)]"
                >
                  WhatsApp
                </a>
                <a
                  href={displayFounder.socials.email}
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
