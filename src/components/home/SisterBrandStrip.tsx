import type { SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import { sisterBrandStrip } from '../../data/brandShowcase'

const LOGO_FALLBACKS: Record<string, string[]> = {
  '/brands/ceravo.png': ['/brands/ceravo.png.jpeg', '/brands/ceravo-logo.png'],
  '/brands/rangkutir.png': ['/brands/rangkutir.png.jpeg', '/brands/rangkutir-logo.png'],
  '/brands/velorix-motors.png': ['/brands/velorix-motors.png.jpeg'],
  '/brands/xeroxii.png': ['/brands/xeroxii.png.png', '/brands/xeroxii-logo.png'],
}

function handleSisterBrandLogoError(event: SyntheticEvent<HTMLImageElement>, primarySrc: string) {
  const img = event.currentTarget
  const tried = img.dataset.fallbackIndex ? Number(img.dataset.fallbackIndex) : -1
  const fallbacks = LOGO_FALLBACKS[primarySrc] ?? []
  const nextIndex = tried + 1

  if (nextIndex < fallbacks.length) {
    img.dataset.fallbackIndex = String(nextIndex)
    img.src = fallbacks[nextIndex]
    return
  }

  img.src = '/og-image.svg'
}

export default function SisterBrandStrip() {
  return (
    <section
      className="overflow-x-hidden border-b border-gray-100 bg-white py-4 md:py-6"
      aria-labelledby="sister-brands-heading"
    >
      <h2 id="sister-brands-heading" className="sr-only">
        Sister brands
      </h2>
      <ul className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-between gap-1 px-3 sm:justify-center sm:gap-10 sm:px-6 md:gap-14 lg:gap-20">
        {sisterBrandStrip.map((brand) => (
          <li key={brand.id} className="flex min-w-0 flex-1 justify-center sm:flex-none">
            <Link
              to={brand.href}
              className="flex min-h-11 min-w-0 max-w-full items-center gap-1 opacity-80 transition-opacity duration-300 hover:opacity-100 sm:gap-2"
              aria-label={`${brand.name} brand`}
            >
              <img
                src={brand.logo}
                alt=""
                width={28}
                height={28}
                loading="lazy"
                decoding="async"
                className="h-5 w-5 shrink-0 object-contain object-center sm:h-6 sm:w-6 md:h-7 md:w-7"
                onError={(event) => handleSisterBrandLogoError(event, brand.logo)}
              />
              <span className="truncate text-[8px] font-semibold uppercase tracking-[0.06em] text-neutral-800 sm:text-[11px] sm:tracking-[0.12em] md:text-xs">
                {brand.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
