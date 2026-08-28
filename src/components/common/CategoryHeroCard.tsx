import { Link } from 'react-router-dom'
import LuxuryImage from './LuxuryImage'

export interface CategoryHeroCardProps {
  name: string
  href: string
  image: string
  priority?: boolean
  variant?: 'feed' | 'portrait'
  imagePosition?: string
  imageFit?: 'cover' | 'contain'
  sizes?: string
  showOverlay?: boolean
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void
}

export default function CategoryHeroCard({
  name,
  href,
  image,
  priority = false,
  variant = 'portrait',
  imagePosition = 'center center',
  imageFit = 'cover',
  sizes,
  showOverlay = false,
  onError,
}: CategoryHeroCardProps) {
  const isFeed = variant === 'feed'
  const isContained = !isFeed && imageFit === 'contain'
  const resolvedSizes = sizes ?? (isFeed ? '(max-width: 767px) 100vw, 33vw' : '(max-width: 767px) 50vw, 33vw')
  const portraitFrameClass = isContained ? 'aspect-[3/4] bg-white' : 'studio-media-frame'
  const imageObjectClass = isContained
    ? ''
    : 'group-hover:scale-105 transition-transform duration-500 ease-out'

  return (
    <Link
      to={href}
      className="group luxury-tap relative z-0 isolate flex h-full w-full min-w-0 cursor-pointer overflow-hidden"
      aria-label={name}
    >
      <div className={`relative isolate z-0 h-full w-full overflow-hidden ${isFeed ? '' : portraitFrameClass}`}>
        <LuxuryImage
          src={image}
          alt={`${name} collection`}
          width={960}
          height={isFeed ? 1600 : 1200}
          sizes={resolvedSizes}
          widths={isFeed ? [480, 768, 1080, 1440] : [320, 480, 768, 960]}
          className="h-full w-full"
          aspectClassName={isFeed ? 'absolute inset-0 z-0 h-full w-full' : 'relative z-0 aspect-[3/4]'}
          objectPosition={imagePosition}
          objectFit={imageFit}
          priority={priority}
          imgClassName={imageObjectClass}
          onError={onError}
        />
        <div className="pointer-events-none absolute inset-0 z-30 flex flex-col justify-end">
          {showOverlay ? (
            <div
              className="absolute inset-0 z-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10"
              aria-hidden
            />
          ) : null}
          <div
            className={`relative z-10 flex flex-col items-center text-center ${
              isFeed
                ? 'px-5 pb-[max(3.25rem,calc(1.5rem+env(safe-area-inset-bottom)))] pt-20 md:px-4 md:pb-5 md:pt-10'
                : 'px-3 pb-4 pt-10 sm:px-4'
            }`}
          >
            <span
              className={`relative font-semibold uppercase ${
                isContained
                  ? 'text-neutral-900'
                  : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
              } ${
                isFeed
                  ? 'text-3xl tracking-[0.22em] md:text-sm md:tracking-[0.18em] lg:text-base'
                  : 'text-xs tracking-[0.16em] sm:text-sm sm:tracking-[0.18em]'
              }`}
              style={isFeed ? { fontFamily: "'Cormorant Garamond', 'Cinzel', serif" } : undefined}
            >
              {name}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
