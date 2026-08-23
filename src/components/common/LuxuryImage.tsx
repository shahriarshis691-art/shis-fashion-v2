import { useState, type CSSProperties } from 'react'
import {
  buildLqipUrl,
  CATALOG_IMAGE_PLACEHOLDER,
  catalogImageAttrs,
} from '../../utils/media'

interface LuxuryImageProps {
  src: string
  alt: string
  width: number
  height: number
  sizes: string
  widths?: number[]
  aspectClassName?: string
  className?: string
  imgClassName?: string
  objectPosition?: string
  cinematicFill?: boolean
  priority?: boolean
  hover?: boolean
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void
}

function handleFallback(event: React.SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.removeAttribute('srcset')
  event.currentTarget.src = CATALOG_IMAGE_PLACEHOLDER
}

export default function LuxuryImage({
  src,
  alt,
  width,
  height,
  sizes,
  widths,
  aspectClassName = 'aspect-[4/5]',
  className = '',
  imgClassName = '',
  objectPosition,
  cinematicFill = false,
  priority = false,
  hover = false,
  onError,
}: LuxuryImageProps) {
  const [loaded, setLoaded] = useState(priority)
  const image = catalogImageAttrs(src, width, height, sizes, widths)
  const imageSrc = image.src || CATALOG_IMAGE_PLACEHOLDER
  const lqip = !priority && !cinematicFill ? buildLqipUrl(src) : ''
  const imageStyle: CSSProperties | undefined = objectPosition ? { objectPosition } : undefined
  const wrapperStyle: CSSProperties | undefined = lqip
    ? {
      backgroundImage: `url("${lqip}")`,
      backgroundSize: 'cover',
      backgroundPosition: objectPosition || 'center',
    }
    : undefined

  return (
    <div
      className={`relative overflow-hidden ${cinematicFill ? 'bg-black' : 'bg-black/5'} ${aspectClassName} ${className}`.trim()}
      style={wrapperStyle}
    >
      {cinematicFill ? (
        <>
          <img
            src={imageSrc}
            alt=""
            aria-hidden
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            style={imageStyle}
            className={[
              'pointer-events-none absolute inset-0 h-full w-full scale-[1.2] object-cover blur-[32px]',
              objectPosition ? '' : 'object-center',
              hover ? 'media-hover' : '',
            ].filter(Boolean).join(' ')}
          />
          <div className="pointer-events-none absolute inset-0 bg-black/35" aria-hidden />
        </>
      ) : null}
      <img
        src={imageSrc}
        srcSet={image.srcSet}
        sizes={image.sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={(event) => {
          setLoaded(true)
          if (onError) {
            onError(event)
            return
          }
          handleFallback(event)
        }}
        style={imageStyle}
        className={[
          'gpu-media absolute inset-0 z-[1] h-full w-full object-cover',
          objectPosition ? '' : 'object-center',
          hover ? 'media-hover' : '',
          loaded || priority ? 'opacity-100' : 'opacity-0',
          priority ? '' : 'transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          imgClassName,
        ].filter(Boolean).join(' ')}
      />
    </div>
  )
}
