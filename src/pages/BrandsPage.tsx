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
    <Reveal as="article" delayMs={index * 50} className="min-w-0">
      <div className="aspect-[16/9] overflow-hidden bg-neutral-100">
        <img
          src={brand.logo}
          alt={`${brand.name} logo`}
          width={1200}
          height={675}
          loading="lazy"
          decoding="async"
          onError={(event) => handleImageError(event, LOGO_PLACEHOLDER)}
          className="gpu-media h-full w-full object-cover object-center"
        />
      </div>

      <div className="mt-4">
        <p className="text-caption uppercase tracking-[0.2em] text-black/55">{brand.tag}</p>
        <h2
          className="mt-2 text-2xl font-normal text-neutral-900"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {brand.name}
        </h2>
        <p className="mt-3 text-sm leading-7 text-neutral-600">{brand.summary}</p>
        <p className="mt-2 text-sm leading-7 text-neutral-500">{brand.details}</p>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-100 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em]">
          <a
            href={brand.contacts.website}
            target="_blank"
            rel="noreferrer"
            className="text-neutral-900 transition hover:text-neutral-500"
          >
            Visit website
          </a>
          <a
            href={brand.contacts.contact}
            target="_blank"
            rel="noreferrer"
            className="text-neutral-500 transition hover:text-neutral-900"
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
    <section className="bg-white px-4 pb-16 pt-8 sm:px-6 sm:pb-20 lg:px-8 lg:pt-12">
      <Container>
        <header className="max-w-3xl">
          <p className="text-caption uppercase tracking-[0.24em] text-black/55">Group Showcase</p>
          <h1
            className="mt-3 text-3xl font-normal leading-tight text-neutral-900 sm:text-5xl"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Three Distinct Brands. One Design-Driven Vision.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-600 sm:text-base">
            Explore our connected brand ecosystem across luxury watches, development materials, and decorative paints, each crafted with a premium customer-first standard.
          </p>
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-8">
          {displayBrands.map((brand, index) => <BrandCard key={brand.id} brand={brand} index={index} />)}
        </div>

        <div className="mt-16 grid gap-10 border-t border-gray-100 pt-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div className="aspect-[4/5] overflow-hidden bg-neutral-100">
            <img
              src={displayFounder.image}
              alt={displayFounder.name}
              width={900}
              height={1100}
              loading="lazy"
              decoding="async"
              onError={(event) => handleImageError(event, FOUNDER_PLACEHOLDER)}
              className="gpu-media h-full w-full object-cover object-[center_top]"
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-caption uppercase tracking-[0.24em] text-black/55">Founder</p>
            <h2
              className="mt-3 text-3xl font-normal text-neutral-900 sm:text-4xl"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {displayFounder.name}
            </h2>
            <p className="mt-2 text-caption uppercase tracking-[0.16em] text-black/55">{displayFounder.title}</p>
            <p className="mt-4 text-sm leading-7 text-neutral-600">{displayFounder.bio}</p>
            <p className="mt-3 text-sm leading-7 text-neutral-500">{displayFounder.story}</p>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-100 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-700">
              <a href={displayFounder.socials.whatsapp} target="_blank" rel="noreferrer" className="transition hover:text-neutral-900">WhatsApp</a>
              <a href={displayFounder.socials.facebook} target="_blank" rel="noreferrer" className="transition hover:text-neutral-900">Facebook</a>
              <a href={displayFounder.socials.instagram} target="_blank" rel="noreferrer" className="transition hover:text-neutral-900">Instagram</a>
              <a href={displayFounder.socials.email} className="transition hover:text-neutral-900">E-mail</a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
