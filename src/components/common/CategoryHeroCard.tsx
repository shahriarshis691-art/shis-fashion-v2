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
  frameBackground?: string
  imageWidth?: number
  imageHeight?: number
  imgClassName?: string
  labelClassName?: string
  imageHoverScale?: boolean
  sizes?: string
  /** @deprecated Titles sit below the image; overlay is no longer used. */
  showOverlay?: boolean
  /** Skip studio-media-frame overlay while keeping cover crop. */
  plainFrame?: boolean
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void
}

export default function CategoryHeroCard({
  name,
  href,
  image,
  priority = false,
  variant = 'portrait',
  imagePosition = 'center top',
  imageFit = 'cover',
  frameBackground,
  imageWidth,
  imageHeight,
  imgClassName,
  labelClassName,
  imageHoverScale = true,
  sizes,
  plainFrame = false,
  onError,
}: CategoryHeroCardProps) {
  const isFeed = variant === 'feed'
  const listingFit = isFeed ? imageFit : 'cover'
  const resolvedSizes = sizes ?? (isFeed ? '(max-width: 767px) 100vw, 33vw' : '(max-width: 767px) 50vw, 33vw')
  const imageFrameClass = isFeed && !plainFrame
    ? 'studio-media-frame w-full'
    : 'relative w-full aspect-[3/4] overflow-hidden bg-[#f4f4f4] sm:aspect-[4/5]'
  const resolvedImageWidth = imageWidth ?? 960
  const resolvedImageHeight = imageHeight ?? (isFeed ? 1600 : 1200)
  const imageObjectClass = isFeed
    ? [
      imgClassName,
      'min-h-full min-w-full object-cover',
      imageHoverScale ? 'transition-transform duration-300 ease-out group-hover:scale-105' : '',
    ].filter(Boolean).join(' ')
    : [
      imgClassName,
      'h-full w-full object-cover object-top',
      imageHoverScale ? 'transition-transform duration-300 ease-out group-hover:scale-105' : '',
    ].filter(Boolean).join(' ')
  const titleClass = isFeed
    ? 'line-clamp-2 min-h-[2.5rem] text-sm font-medium tracking-[0.14em] text-neutral-900 uppercase transition-colors duration-300 sm:text-base group-hover:text-black'
    : 'line-clamp-2 px-1 text-xs font-normal tracking-[0.14em] text-neutral-900 uppercase sm:text-sm'

  return (
    <Link
      to={href}
      className="group luxury-tap relative z-0 flex w-full min-w-0 cursor-pointer flex-col items-center"
      aria-label={name}
    >
      <div className={imageFrameClass}>
        <LuxuryImage
          src={image}
          alt={`${name} collection`}
          width={resolvedImageWidth}
          height={resolvedImageHeight}
          sizes={resolvedSizes}
          widths={isFeed ? [480, 768, 1080, 1440] : [320, 480, 768, 960]}
          className="h-full w-full"
          wrapperBackgroundClassName={frameBackground ?? (isFeed ? undefined : 'bg-[#f4f4f4]')}
          aspectClassName="relative z-0 h-full w-full"
          objectPosition={imagePosition}
          objectFit={listingFit}
          priority={priority}
          imgClassName={imageObjectClass}
          onError={onError}
        />
      </div>

      <div className="w-full pt-3 pb-1 text-center">
        <h3
          className={`${titleClass} ${labelClassName ?? ''}`.trim()}
          style={isFeed ? undefined : { fontFamily: 'var(--font-display)' }}
        >
          {name}
        </h3>
      </div>
    </Link>
  )
}
