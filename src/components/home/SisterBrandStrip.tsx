import type { SyntheticEvent } from 'react'
import { Link } from 'react-router-dom'
import Container from '../ui/Container'
import { sisterBrandStrip } from '../../data/brandShowcase'

const LOGO_FALLBACKS: Record<string, string[]> = {
  '/brands/strip/ceravo.png': ['/brands/ceravo.png'],
  '/brands/strip/rangkutir.png': ['/brands/rangkutir.png'],
  '/brands/strip/velorix-motors.png': ['/brands/velorix-motors.png'],
  '/brands/strip/xeroxii.png': ['/brands/xeroxii.webp'],
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
    <section className="bg-white" aria-labelledby="sister-brands-heading">
      <Container>
        <h2 id="sister-brands-heading" className="sr-only">
          Sister brands
        </h2>
        <ul className="flex flex-wrap items-center justify-center gap-8 border-b border-gray-100 py-6 md:flex-nowrap md:gap-14 md:py-8">
          {sisterBrandStrip.map((brand) => (
            <li key={brand.id} className="flex min-w-0 items-center justify-center">
              <Link
                to={brand.href}
                className="group flex h-12 w-28 items-center justify-center overflow-hidden bg-white md:w-36"
                aria-label={`${brand.name} brand`}
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  width={160}
                  height={40}
                  loading="lazy"
                  decoding="async"
                  className={`max-h-8 w-auto !max-w-[120px] object-contain mix-blend-multiply opacity-60 grayscale contrast-[1.2] transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:grayscale-0 md:max-h-10 ${
                    brand.id === 'velorix-motors'
                      ? 'origin-center scale-[1.7] object-[center_30%]'
                      : ''
                  }`}
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
