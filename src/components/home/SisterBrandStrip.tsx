import type { SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import Container from '../ui/Container'
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
      className="border-b border-gray-100 bg-white py-6 md:py-8"
      aria-labelledby="sister-brands-heading"
    >
      <Container>
        <h2 id="sister-brands-heading" className="sr-only">
          Sister brands
        </h2>
        <ul className="grid grid-cols-2 place-items-center gap-x-6 gap-y-5 md:flex md:flex-wrap md:justify-center md:items-center md:gap-16">
          {sisterBrandStrip.map((brand) => (
            <li key={brand.id} className="flex min-w-0 items-center justify-center">
              <Link
                to={brand.href}
                className="inline-flex min-h-11 items-center justify-center px-2 opacity-80 transition-opacity duration-300 hover:opacity-100"
                aria-label={`${brand.name} brand`}
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  width={160}
                  height={40}
                  loading="lazy"
                  decoding="async"
                  className="h-8 w-auto max-w-[9.5rem] object-contain object-center md:h-10 md:max-w-[11rem]"
                  onError={(event) => handleSisterBrandLogoError(event, brand.logo)}
                />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
