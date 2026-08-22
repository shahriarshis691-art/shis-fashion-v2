import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Container from '../components/ui/Container'
import Reveal from '../components/common/Reveal'
import { founderProfile as staticFounderProfile, brandEntries, type BrandEntry } from '../data/brandShowcase'
import { subscribeToAdminBrands, subscribeToFounderProfile, type AdminBrand, type FounderProfile } from '../firebase/adminService'
import { applySeoMetadata } from '../utils/seo'

const LOGO_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700"%3E%3Cdefs%3E%3ClinearGradient id="bg" x1="0" y1="0" x2="1" y2="1"%3E%3Cstop offset="0" stop-color="%230b0b0b"/%3E%3Cstop offset="1" stop-color="%23181818"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1200" height="700" fill="url(%23bg)"/%3E%3Ccircle cx="980" cy="110" r="180" fill="%23c9a227" fill-opacity="0.12"/%3E%3Ctext x="50%25" y="53%25" dominant-baseline="middle" text-anchor="middle" font-family="Georgia, serif" font-size="76" fill="%23e7d6a1" letter-spacing="8"%3EBRAND%3C/text%3E%3C/svg%3E'

const FOUNDER_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="900" height="1100" viewBox="0 0 900 1100"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0" y1="0" x2="1" y2="1"%3E%3Cstop offset="0" stop-color="%23101010"/%3E%3Cstop offset="1" stop-color="%23222222"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="900" height="1100" fill="url(%23g)"/%3E%3Ccircle cx="710" cy="180" r="160" fill="%23c9a227" fill-opacity="0.15"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Georgia, serif" font-size="80" fill="%23e7d6a1"%3EFOUNDER%3C/text%3E%3C/svg%3E'

function handleImageError(event: React.SyntheticEvent<HTMLImageElement>, fallback: string) {
  event.currentTarget.src = fallback
}

type DisplayBrand = BrandEntry

function mapLiveBrandToDisplayBrand(brand: AdminBrand): DisplayBrand {
  return {
    id: brand.slug,
    name: brand.name,
    tag: brand.tag,
    summary: brand.summary,
    details: brand.description,
    logo: brand.logo,
    contacts: {
      website: brand.website,
      contact: brand.contactPhone ? `tel:${brand.contactPhone.replace(/\s+/g, '')}` : `mailto:${brand.contactEmail}`,
    },
  }
}

function BrandCard({ brand, index }: { brand: DisplayBrand; index: number }) {
  return (
    <Reveal as="article" delayMs={index * 50} className="relative overflow-hidden rounded-[1.3rem] border border-white/14 bg-[#0b0b0b] p-3 shadow-[0_20px_65px_rgba(0,0,0,0.4)] sm:p-4">
      <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.14),rgba(255,255,255,0))]" aria-hidden />

      <div className="aspect-[16/9] overflow-hidden rounded-[1rem] border border-white/10 bg-[#141414]">
        <img
          src={brand.logo}
          alt={`${brand.name} logo`}
          width={1200}
          height={675}
          loading="lazy"
          decoding="async"
          onError={(event) => handleImageError(event, LOGO_PLACEHOLDER)}
          className="gpu-media h-full w-full object-cover"
        />
      </div>

      <div className="mt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">{brand.tag}</p>
        <h2 className="mt-1 text-xl font-semibold text-white">{brand.name}</h2>
        <p className="mt-2 text-sm leading-6 text-white/72">{brand.summary}</p>
        <p className="mt-2 text-sm leading-6 text-white/60">{brand.details}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={brand.contacts.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-white/16 bg-white/5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-white transition hover:border-white/32 hover:bg-white/10"
          >
            Visit website
          </a>
          <a
            href={brand.contacts.contact}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border border-white/24 bg-white/10 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-white"
          >
            Contact brand
          </a>
        </div>
      </div>
    </Reveal>
  )
}

export default function BrandsPage() {
  const location = useLocation()
  const [liveBrands, setLiveBrands] = useState<AdminBrand[]>([])
  const [liveFounderProfile, setLiveFounderProfile] = useState<FounderProfile | null>(null)

  useEffect(() => {
    const unsubscribeBrands = subscribeToAdminBrands((nextBrands) => setLiveBrands(nextBrands))
    const unsubscribeFounder = subscribeToFounderProfile((profile) => setLiveFounderProfile(profile))
    return () => {
      unsubscribeBrands?.()
      unsubscribeFounder?.()
    }
  }, [])

  useEffect(() => {
    applySeoMetadata(location.pathname, {
      title: 'Our Brands | SHIS Fashion Bangladesh',
      description: 'Discover the signature brands and fashion stories behind SHIS Fashion Bangladesh.',
    })
  }, [location.pathname])

  const displayBrands = useMemo(
    () => (liveBrands.length ? liveBrands.map(mapLiveBrandToDisplayBrand) : brandEntries),
    [liveBrands],
  )

  const displayFounder = liveFounderProfile ?? staticFounderProfile

  return (
    <section className="px-3 pb-16 pt-5 sm:px-6 sm:pb-20 lg:px-8 lg:pt-8">
      <Container>
        <div className="relative overflow-hidden rounded-[1.6rem] border border-white/14 bg-[#090909] px-4 py-8 shadow-[0_30px_90px_rgba(0,0,0,0.44)] sm:rounded-[2.1rem] sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute -left-12 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16),rgba(255,255,255,0))]" aria-hidden />
          <div className="pointer-events-none absolute -right-16 bottom-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.08),rgba(255,255,255,0))]" aria-hidden />

          <div className="relative max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/75">Group Showcase</p>
            <h1 className="mt-3 text-[2rem] font-semibold leading-[0.95] text-white sm:text-[2.9rem]">Three Distinct Brands. One Design-Driven Vision.</h1>
            <p className="mt-4 text-sm leading-7 text-white/72 sm:text-base">
              Explore our connected brand ecosystem across luxury watches, development materials, and decorative paints, each crafted with a premium customer-first standard.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {displayBrands.map((brand, index) => <BrandCard key={brand.id} brand={brand} index={index} />)}
        </div>

        <div className="mt-8 grid gap-4 rounded-[1.35rem] border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.08)] sm:mt-10 sm:rounded-[1.8rem] sm:p-6 lg:grid-cols-[0.8fr_1.2fr] lg:p-7">
          <div className="aspect-[4/5] overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[#0e0e0e]">
            <img
              src={displayFounder.image}
              alt={displayFounder.name}
              width={900}
              height={1100}
              loading="lazy"
              decoding="async"
              onError={(event) => handleImageError(event, FOUNDER_PLACEHOLDER)}
              className="gpu-media h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">Founder</p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)] sm:text-3xl">{displayFounder.name}</h2>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">{displayFounder.title}</p>
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">{displayFounder.bio}</p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">{displayFounder.story}</p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <a href={displayFounder.socials.whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-[rgba(0,0,0,0.28)] bg-[rgba(0,0,0,0.06)] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--color-accent)]">WhatsApp</a>
              <a href={displayFounder.socials.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--color-text)]">Facebook</a>
              <a href={displayFounder.socials.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--color-text)]">Instagram</a>
              <a href={displayFounder.socials.email} className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--color-text)]">E-mail</a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
