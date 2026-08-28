import { Link } from 'react-router-dom'
import LuxuryImage from '../common/LuxuryImage'

export default function EditorialBanner({
  image,
  eyebrow,
  title,
  description,
  cta,
  href,
  imagePosition = 'center top',
}: {
  image: string
  eyebrow: string
  title: string
  description: string
  cta: string
  href: string
  imagePosition?: string
}) {
  if (!image && !title) {
    return null
  }

  return (
    <section className="bg-[var(--color-sand)]" aria-labelledby="editorial-banner-title">
      <div className="mx-auto grid max-w-7xl md:grid-cols-2">
        <div className="relative min-h-[22rem] overflow-hidden md:min-h-[32rem]">
          {image ? (
            <LuxuryImage
              src={image}
              alt={title}
              width={1200}
              height={1500}
              sizes="(max-width: 767px) 100vw, 50vw"
              widths={[480, 768, 1080, 1400]}
              className="h-full w-full"
              aspectClassName="absolute inset-0 h-full w-full"
              objectPosition={imagePosition}
              imgClassName="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[var(--color-studio)]" />
          )}
        </div>
        <div className="flex flex-col justify-center px-6 py-12 md:px-14 md:py-16">
          <p className="text-[10px] font-medium tracking-[0.22em] text-[var(--color-gold)] uppercase">{eyebrow}</p>
          <h2
            id="editorial-banner-title"
            className="mt-3 max-w-md text-3xl leading-tight text-[#111111] md:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-neutral-600 md:text-base">{description}</p>
          <Link
            to={href}
            className="mt-8 inline-flex min-h-12 w-fit items-center border border-[#111111] bg-[#111111] px-6 text-[11px] font-semibold tracking-[0.16em] text-white uppercase"
          >
            {cta}
          </Link>
        </div>
      </div>
    </section>
  )
}
