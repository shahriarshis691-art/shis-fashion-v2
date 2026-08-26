import type { SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import { sisterBrandStrip } from '../../data/brandShowcase'

const LOGO_FALLBACKS: Record<string, string[]> = {
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
      <ul className="mx-auto flex w-full max-w-7xl min-w-0 items-center justify-center gap-8 px-3 sm:gap-12 sm:px-6 md:gap-16">
        {sisterBrandStrip.map((brand) => (
          <li key={brand.id} className="flex min-w-0 justify-center">
            <Link
              to={brand.href}
              className="inline-flex min-h-11 items-center justify-center opacity-80 transition-opacity duration-300 hover:opacity-100"
              aria-label={`${brand.name} brand`}
            >
              <img
                src={brand.logo}
                alt={brand.name}
                width={140}
                height={40}
                loading="lazy"
                decoding="async"
                className="h-8 w-auto max-h-8 max-w-[7.5rem] object-contain object-center sm:h-9 sm:max-h-9 sm:max-w-[9rem] md:h-10 md:max-h-10 md:max-w-[11rem]"
                onError={(event) => handleSisterBrandLogoError(event, brand.logo)}
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
