import React, { useCallback } from 'react'

const DEFAULT_OG_IMAGE = '/og-image.svg'

export type HeroBackgroundTone = 'cream' | 'neutral' | 'dark'

export const HERO_BACKGROUND_TONES: Record<HeroBackgroundTone, string> = {
  cream: '#f6f2ec',
  neutral: '#e5e5e5',
  dark: '#0a0a0a',
}

export interface HeroPictureSource {
  srcSet: string
  type: string
}

export interface ResponsiveHeroBannerProps {
  src: string
  alt: string
  width: number
  height: number
  fallbacks?: string[]
  background?: HeroBackgroundTone | `#${string}`
  priority?: boolean
  className?: string
  sectionClassName?: string
  ariaLabel?: string
  sizes?: string
  sources?: HeroPictureSource[]
  objectPosition?: string
  children?: React.ReactNode
  overlayClassName?: string
  /** Override mobile aspect ratio, e.g. `4/5`. Desktop layout is unchanged. */
  mobileAspectRatio?: string
  /** When true, render only the inner media frame (for carousel slides). */
  embed?: boolean
  objectFit?: 'contain' | 'cover'
}

function resolveHeroBackground(background: ResponsiveHeroBannerProps['background']) {
  if (!background) {
    return HERO_BACKGROUND_TONES.cream
  }

  if (background.startsWith('#')) {
    return background
  }

  return HERO_BACKGROUND_TONES[background as HeroBackgroundTone]
}

export default function ResponsiveHeroBanner({
  src,
  alt,
  width,
  height,
  fallbacks = [],
  background = 'cream',
  priority = true,
  className,
  sectionClassName,
  ariaLabel,
  sizes = '100vw',
  sources,
  objectPosition = 'center',
  children,
  overlayClassName,
  mobileAspectRatio,
  embed = false,
  objectFit = 'contain',
}: ResponsiveHeroBannerProps) {
  const bgColor = resolveHeroBackground(background)
  const aspectRatio = mobileAspectRatio ?? `${width} / ${height}`

  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget
    const step = Number.parseInt(image.dataset.fallbackStep ?? '0', 10)

    if (step < fallbacks.length) {
      image.dataset.fallbackStep = String(step + 1)
      image.src = fallbacks[step] ?? DEFAULT_OG_IMAGE
      return
    }

    if (image.src.endsWith(DEFAULT_OG_IMAGE)) {
      return
    }

    image.src = DEFAULT_OG_IMAGE
  }, [fallbacks])

  const imageClassName = [
    objectFit === 'cover' ? 'gpu-media block h-full w-full max-w-full object-cover' : 'gpu-media block h-full w-full max-w-full object-contain',
    'md:h-auto md:w-full md:max-w-none',
    embed ? 'md:h-full' : '',
  ].filter(Boolean).join(' ')

  const imageStyle: React.CSSProperties = {
    objectPosition,
  }

  const frameClassName = [
    'relative w-full overflow-hidden',
    embed ? 'h-full' : 'max-md:[aspect-ratio:var(--hero-aspect)]',
  ].join(' ')

  const frameStyle = {
    '--hero-aspect': aspectRatio,
    backgroundColor: bgColor,
  } as React.CSSProperties

  const renderImage = () => {
    const sharedProps = {
      alt,
      width,
      height,
      sizes,
      loading: priority ? ('eager' as const) : ('lazy' as const),
      fetchPriority: priority ? ('high' as const) : undefined,
      decoding: 'async' as const,
      draggable: false,
      onError: handleError,
      className: [
        imageClassName,
        className,
      ].filter(Boolean).join(' '),
      style: imageStyle,
    }

    if (sources?.length) {
      return (
        <picture className={`flex h-full w-full items-center justify-center ${embed ? '' : 'md:block md:h-auto md:w-full'}`}>
          {sources.map((source) => (
            <source key={source.type} srcSet={source.srcSet} type={source.type} sizes={sizes} />
          ))}
          <img src={src} {...sharedProps} />
        </picture>
      )
    }

    return <img src={src} {...sharedProps} />
  }

  const frameContent = (
    <>
      {renderImage()}
      {children ? (
        <div className={overlayClassName ?? 'absolute inset-0 z-10'}>
          {children}
        </div>
      ) : null}
    </>
  )

  if (embed) {
    return (
      <div className={frameClassName} style={frameStyle}>
        {frameContent}
      </div>
    )
  }

  return (
    <section
      className={['relative z-0 isolate w-full max-w-[100vw] overflow-x-hidden', sectionClassName]
        .filter(Boolean)
        .join(' ')}
      style={{ backgroundColor: bgColor }}
      aria-label={ariaLabel ?? alt}
    >
      <div className={frameClassName} style={frameStyle}>
        {frameContent}
      </div>
    </section>
  )
}
