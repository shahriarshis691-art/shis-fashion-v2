import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import CategoryHeroCard from '../components/common/CategoryHeroCard'
import Container from '../components/ui/Container'
import {
  type ShopSegment,
  getHubSubcategories,
  getSegmentAllProductsHref,
  getSegmentDescription,
} from '../data/categoryTaxonomy'
import { getSubcategoryCover, SEGMENT_HUB_COVERS } from '../data/categoryHubCovers'
import { applySeoMetadata } from '../utils/seo'
import NotFoundPage from './NotFoundPage'

function resolveHubSegment(pathname: string): Exclude<ShopSegment, 'all'> | null {
  const normalized = pathname.replace(/\/$/, '') || '/'
  if (normalized === '/women' || normalized === '/category/women') {
    return 'women'
  }
  if (normalized === '/men' || normalized === '/category/men') {
    return 'men'
  }
  if (normalized === '/kids' || normalized === '/category/kids') {
    return 'kids'
  }
  return null
}

export default function CategoryHubPage() {
  const location = useLocation()
  const segment = resolveHubSegment(location.pathname)

  const heading = segment ? getSegmentDescription(segment) : null
  const subcategories = useMemo(
    () => (segment ? getHubSubcategories(segment) : []),
    [segment],
  )

  useEffect(() => {
    if (!segment || !heading) {
      return
    }

    applySeoMetadata(`/${segment}`, {
      title: `${heading.title} Collections | SHIS Fashion Bangladesh`,
      description: heading.description,
      canonicalPath: `/${segment}`,
    })
  }, [heading, segment])

  if (!segment || !heading) {
    return <NotFoundPage />
  }

  const allProductsHref = getSegmentAllProductsHref(segment)

  return (
    <section className="overflow-x-hidden bg-white pb-16 sm:pb-20">
      <div className="relative flex min-h-[36vh] items-end overflow-hidden bg-neutral-950 sm:min-h-[42vh]">
        <img
          src={SEGMENT_HUB_COVERS[segment]}
          alt=""
          aria-hidden
          width={1600}
          height={900}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[center_top] opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/20" />
        <Container className="relative z-10 pb-8 pt-16 sm:pb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">Collections</p>
          <h1
            className="mt-2 text-4xl font-semibold uppercase tracking-[0.18em] text-white sm:text-5xl"
            style={{ fontFamily: "'Cormorant Garamond', 'Cinzel', serif" }}
          >
            {heading.title}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
            {heading.description}
          </p>
        </Container>
      </div>

      <Container className="pt-6 sm:pt-10">
        <nav
          className="mb-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-black/55"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="hover:text-black">Home</Link>
          <span aria-hidden>/</span>
          <span className="text-black">{heading.title}</span>
        </nav>

        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-caption uppercase tracking-[0.14em] text-black/55">Shop by category</p>
            <h2 className="mt-1 text-h2 text-black">Explore {heading.title.toLowerCase()} collections</h2>
          </div>
          <Link
            to={allProductsHref}
            className="inline-flex min-h-11 items-center justify-center border border-neutral-900 px-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white"
          >
            Shop all {heading.title}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6">
          {subcategories.map((subcategory, index) => (
            <CategoryHeroCard
              key={subcategory.slug}
              name={subcategory.label}
              href={subcategory.path ?? `/${segment}?sub=${subcategory.slug}`}
              image={getSubcategoryCover(segment, subcategory.slug)}
              cta="Explore Collection"
              priority={index < 2}
              variant="portrait"
              sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
            />
          ))}
        </div>
      </Container>
    </section>
  )
}
