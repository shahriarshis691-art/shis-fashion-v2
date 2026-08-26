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
    <section className="bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <Container>
        <Button to="/brands" variant="ghost" className="mb-8 px-0">← Back to brands</Button>

        <div className="grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-16">
          <div className="aspect-[4/5] overflow-hidden bg-neutral-100">
            <img
              src={displayFounder.image}
              alt={displayFounder.name}
              width={900}
              height={1100}
              loading="eager"
              decoding="async"
              className="h-full w-full object-cover object-[center_top]"
            />
          </div>

          <div>
            <p className="text-caption uppercase tracking-[0.24em] text-black/55">Founder</p>
            <h1
              className="mt-3 text-4xl font-normal text-neutral-900"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {displayFounder.name}
            </h1>
            <p className="mt-2 text-caption uppercase tracking-[0.16em] text-black/55">{displayFounder.title}</p>
            <p className="mt-4 text-sm leading-7 text-neutral-600">{displayFounder.bio}</p>
            <p className="mt-3 text-sm leading-7 text-neutral-500">{displayFounder.story}</p>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em]">
              <a
                href={displayFounder.socials.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="text-neutral-900 transition hover:text-neutral-500"
              >
                WhatsApp
              </a>
              <a
                href={displayFounder.socials.email}
                className="text-neutral-500 transition hover:text-neutral-900"
              >
                E-mail
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
