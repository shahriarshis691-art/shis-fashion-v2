import { Link } from 'react-router-dom'
import LuxuryImage from './LuxuryImage'

export interface CategoryHeroCardProps {
  name: string
  href: string
  image: string
  cta?: string
  priority?: boolean
  variant?: 'feed' | 'portrait'
  imagePosition?: string
  sizes?: string
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void
}

export default function CategoryHeroCard({
  name,
  href,
  image,
  cta = 'Explore Collection',
  priority = false,
  variant = 'portrait',
  imagePosition = 'center top',
  sizes,
  onError,
}: CategoryHeroCardProps) {
  const isFeed = variant === 'feed'
  const resolvedSizes = sizes ?? (isFeed ? '(max-width: 767px) 100vw, 33vw' : '(max-width: 767px) 50vw, 33vw')

  return (
    <Link
      to={href}
      className="group luxury-tap relative z-0 isolate flex h-full w-full min-w-0 cursor-pointer overflow-hidden"
      aria-label={`${name} — ${cta}`}
    >
      <div className={`relative isolate z-0 h-full w-full overflow-hidden ${isFeed ? '' : 'studio-media-frame'}`}>
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
          priority={priority}
          imgClassName="h-full w-full object-cover object-[center_top] group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={onError}
        />
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
            aria-hidden
          />
          <div
            className={`relative z-10 flex flex-col items-center text-center ${
              isFeed
                ? 'px-5 pb-[max(3.25rem,calc(1.5rem+env(safe-area-inset-bottom)))] pt-20 md:px-4 md:pb-5 md:pt-10'
                : 'px-3 pb-4 pt-10 sm:px-4'
            }`}
          >
            <span
              className={`relative font-semibold uppercase text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)] ${
                isFeed
                  ? 'text-3xl tracking-[0.22em] md:text-sm md:tracking-[0.18em] lg:text-base'
                  : 'text-xs tracking-[0.16em] sm:text-sm sm:tracking-[0.18em]'
              }`}
              style={isFeed ? { fontFamily: "'Cormorant Garamond', 'Cinzel', serif" } : undefined}
            >
              {name}
            </span>
            <span
              className={`relative mt-3 inline-flex items-center border border-white/80 bg-black/25 text-white uppercase tracking-[0.18em] backdrop-blur-[2px] transition-colors duration-300 group-hover:bg-white group-hover:text-neutral-950 ${
                isFeed
                  ? 'min-h-11 px-5 text-[11px] font-semibold md:min-h-8 md:px-3 md:text-[10px]'
                  : 'min-h-8 px-3 text-[9px] font-semibold sm:text-[10px]'
              }`}
            >
              {cta}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
