import { useState, useRef, type CSSProperties } from 'react'
import {
  buildLqipUrl,
  CATALOG_IMAGE_PLACEHOLDER,
  catalogImageAttrs,
  buildStaticImageSrcSet,
} from '../../utils/media'
import { useParallax } from '../../hooks/useParallax'

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
  objectFit?: 'cover' | 'contain'
  wrapperBackgroundClassName?: string
  cinematicFill?: boolean
  priority?: boolean
  hover?: boolean
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void
  parallax?: boolean
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
  objectFit = 'cover',
  wrapperBackgroundClassName,
  cinematicFill = false,
  priority = false,
  hover = false,
  onError,
  parallax = false,
}: LuxuryImageProps) {
  const [loaded, setLoaded] = useState(priority)
  const isContained = objectFit === 'contain'
  const image = catalogImageAttrs(src, width, height, sizes, widths, isContained ? 'contain' : 'cover')
  const imageSrc = image.src || CATALOG_IMAGE_PLACEHOLDER
  const lqip = !priority && !cinematicFill ? buildLqipUrl(src) : ''
  const imageStyle: CSSProperties | undefined = objectPosition || isContained
    ? {
        ...(objectPosition ? { objectPosition } : {}),
        ...(isContained ? { objectFit: 'contain' } : { objectFit: 'cover' }),
      }
    : undefined
  const wrapperBackgroundClass = wrapperBackgroundClassName
    ?? (cinematicFill ? 'bg-black' : isContained ? 'bg-white' : 'bg-black/5')

  const wrapperStyle: CSSProperties | undefined = lqip
    ? {
        backgroundImage: `url("${lqip}")`,
        backgroundSize: 'cover',
        backgroundPosition: objectPosition || 'center top',
      }
    : undefined

  const wrapperRef = useRef<HTMLDivElement>(null)
  useParallax(wrapperRef, 0.03, parallax)

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden ${wrapperBackgroundClass} ${aspectClassName} ${className}`.trim()}
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
              objectPosition ? '' : 'object-[center_top]',
              hover ? 'media-hover' : '',
            ].filter(Boolean).join(' ')}
          />
          <div className="pointer-events-none absolute inset-0 bg-black/35" aria-hidden />
        </>
      ) : null}
      <img
        src={imageSrc}
        srcSet={image.srcSet || buildStaticImageSrcSet(imageSrc)}
        sizes={image.sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'low'}
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
          'gpu-media absolute inset-0 z-[1] h-full w-full',
          isContained ? '!object-contain object-center' : 'object-cover',
          objectPosition ? '' : isContained ? 'object-center' : 'object-[center_top]',
          hover ? 'media-hover' : '',
          loaded || priority ? 'img-loaded' : 'img-loading',
          priority ? '' : 'transition-opacity duration-500 cubic-bezier(0.16, 1, 0.3, 1)',
          imgClassName,
        ].filter(Boolean).join(' ')}
      />
    </div>
  )
}
