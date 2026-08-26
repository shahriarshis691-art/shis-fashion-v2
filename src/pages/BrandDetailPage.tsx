import { useEffect, useMemo, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import Container from '../components/ui/Container'
import Button from '../components/ui/Button'
import { brandEntries } from '../data/brandShowcase'
import { subscribeToAdminBrands, type AdminBrand } from '../firebase/adminService'
import { applyNotFoundSeo, applySeoMetadata } from '../utils/seo'

type DisplayBrand = {
  id: string
  name: string
  tag: string
  summary: string
  details: string
  logo: string
  contacts: {
    website: string
    contact: string
  }
}

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

export default function BrandDetailPage() {
  const { slug } = useParams()
  const location = useLocation()
  const [liveBrands, setLiveBrands] = useState<AdminBrand[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToAdminBrands((nextBrands) => setLiveBrands(nextBrands))
    return unsubscribe
  }, [])

  const brand = useMemo(() => {
    const normalizedSlug = (slug ?? '').trim().toLowerCase()

    const liveMatch = liveBrands.find((entry) => {
      const entrySlug = entry.slug.trim().toLowerCase()
      const entryName = entry.name.trim().toLowerCase()
      return entrySlug === normalizedSlug || entryName === normalizedSlug
    })
    if (liveMatch) {
      return mapLiveBrandToDisplayBrand(liveMatch)
    }

    return brandEntries.find((entry) => entry.id === normalizedSlug)
  }, [liveBrands, slug])

  useEffect(() => {
    if (!brand) {
      applyNotFoundSeo(location.pathname)
      return
    }

    applySeoMetadata(location.pathname, {
      title: `${brand.name} | SHIS Fashion Bangladesh`,
      description: brand.summary,
      canonicalPath: location.pathname,
    })
  }, [brand, location.pathname])

  if (!brand) {
    return (
      <section className="bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <Container>
          <div className="py-12 text-center">
            <h1 className="text-2xl font-semibold text-neutral-900">Brand not found</h1>
            <p className="mt-2 text-neutral-600">The brand you're looking for doesn't exist.</p>
            <Button to="/brands" variant="secondary" className="mt-6">Back to brands</Button>
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section className="bg-white px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <Container>
        <Button to="/brands" variant="ghost" className="mb-8 px-0">← Back to brands</Button>

        <div className="grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-16">
          <div className="aspect-[4/5] overflow-hidden bg-neutral-100">
            <img
              src={brand.logo}
              alt={`${brand.name} logo`}
              width={600}
              height={750}
              loading="eager"
              decoding="async"
              className="gpu-media h-full w-full object-cover"
            />
          </div>

          <div>
            <p className="text-caption uppercase tracking-[0.24em] text-black/55">{brand.tag}</p>
            <h1
              className="mt-3 text-4xl font-normal text-neutral-900"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {brand.name}
            </h1>
            <p className="mt-4 text-sm leading-7 text-neutral-600">{brand.summary}</p>
            <p className="mt-3 text-sm leading-7 text-neutral-500">{brand.details}</p>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em]">
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
        </div>

        <div className="mt-12 border-t border-gray-100 pt-10">
          <p className="text-caption uppercase tracking-[0.24em] text-black/55">About {brand.name}</p>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-neutral-600">
            {brand.summary}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-500">
            {brand.details}
          </p>
        </div>
      </Container>
    </section>
  )
}
