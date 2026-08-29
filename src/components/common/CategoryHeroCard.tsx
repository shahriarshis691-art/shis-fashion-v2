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
  imagePosition = 'center center',
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
  const isContained = !isFeed && imageFit === 'contain'
  const resolvedSizes = sizes ?? (isFeed ? '(max-width: 767px) 100vw, 33vw' : '(max-width: 767px) 50vw, 33vw')
  const imageFrameClass = isContained
    ? 'relative w-full aspect-[3/4] overflow-hidden bg-white'
    : plainFrame
      ? 'relative w-full aspect-[3/4] overflow-hidden bg-neutral-100'
      : 'studio-media-frame w-full'
  const resolvedImageWidth = imageWidth ?? 960
  const resolvedImageHeight = imageHeight ?? (isFeed ? 1600 : 1200)
  const imageObjectClass = isContained
    ? (imgClassName ?? '')
    : [
      imgClassName,
      'min-h-full min-w-full object-cover object-center',
      imageHoverScale ? 'transition-transform duration-500 ease-out group-hover:scale-105' : '',
    ].filter(Boolean).join(' ')

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
          wrapperBackgroundClassName={frameBackground}
          aspectClassName="relative z-0 h-full w-full"
          objectPosition={imagePosition}
          objectFit={imageFit}
          priority={priority}
          imgClassName={imageObjectClass}
          onError={onError}
        />
      </div>

      <div className="w-full pt-3 pb-1 text-center">
        <h3
          className={`line-clamp-2 min-h-[2.5rem] text-sm font-medium tracking-[0.14em] text-neutral-900 uppercase transition-colors duration-300 sm:text-base group-hover:text-black ${labelClassName ?? ''}`.trim()}
        >
          {name}
        </h3>
      </div>
    </Link>
  )
}
