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
  priority = false,
  hover = false,
  onError,
}: LuxuryImageProps) {
  const [loaded, setLoaded] = useState(priority)
  const image = catalogImageAttrs(src, width, height, sizes, widths)
  const imageSrc = image.src || CATALOG_IMAGE_PLACEHOLDER
  const lqip = !priority ? buildLqipUrl(src) : ''
  const wrapperStyle: CSSProperties | undefined = lqip
    ? { backgroundImage: `url("${lqip}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined

  return (
    <div
      className={`relative overflow-hidden bg-black/5 ${aspectClassName} ${className}`.trim()}
      style={wrapperStyle}
    >
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
        className={[
          'gpu-media h-full w-full object-cover object-center',
          hover ? 'media-hover' : '',
          loaded || priority ? 'opacity-100' : 'opacity-0',
          priority ? '' : 'transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
          imgClassName,
        ].filter(Boolean).join(' ')}
      />
    </div>
  )
}
