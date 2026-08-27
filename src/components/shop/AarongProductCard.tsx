import { memo, useMemo } from 'react'
import PrefetchLink from '../common/PrefetchLink'
import { formatBDT } from '../../utils/currency'
import { catalogImageAttrs, CATALOG_IMAGE_PLACEHOLDER } from '../../utils/media'
import { getLuxuryBadgeForPrice } from '../../utils/luxuryBadge'

export interface AarongProductCardProduct {
  id: string | number
  slug: string
  name: string
  price: string
  image: string
  category: string
  comparePrice?: string
  /** Distinct design colors for listing swatches (kurti design groups). */
  colors?: string[]
}

export interface AarongProductCardProps {
  product: AarongProductCardProduct
  /** Override PDP path (defaults to `/shop/{category}/{slug}`). */
  href?: string
  prefetchModule?: () => Promise<unknown>
  /** Eager-load above-the-fold listing images (first few cards only). */
  priority?: boolean
  onToggleWishlist?: (product: AarongProductCardProduct) => void
  isInWishlist?: boolean
  onProductClick?: (product: AarongProductCardProduct) => void
  /** Studio-style western / premium listing treatment. */
  variant?: 'default' | 'studio'
}

const DEFAULT_PREFETCH = () => import('../../pages/ProductDetailPage')

const SWATCH_TONES: Record<string, string> = {
  black: '#111111',
  white: '#f4f4f4',
  'off white': '#f0ebe3',
  sand: '#c4b59a',
  beige: '#d6c6a8',
  cream: '#ebe4d4',
  ivory: '#f3efe6',
  blue: '#1e3a5f',
  azure: '#2f5f8a',
  aqua: '#5b8fa8',
  green: '#2f4f3e',
  jade: '#3d6b5a',
  red: '#7a1f1f',
  ruby: '#6b1520',
  maroon: '#5c1a24',
  pink: '#c48b9f',
  rose: '#b76e79',
  purple: '#4a3560',
  violet: '#4a3560',
  yellow: '#c6a24a',
  amber: '#b8893d',
  mustard: '#b08a2e',
  multicolour: 'linear-gradient(135deg, #111 0%, #c4b59a 45%, #f4f4f4 100%)',
}

function swatchBackground(color: string): string {
  const key = color.trim().toLowerCase()
  if (SWATCH_TONES[key]) {
    return SWATCH_TONES[key]!
  }

  for (const [token, value] of Object.entries(SWATCH_TONES)) {
    if (key.includes(token)) {
      return value
    }
  }

  return '#d4d4d4'
}

/**
 * Universal Aarong-style listing card — single source of truth for all category grids.
 * Full-bleed 3/4 studio frame, outline wishlist, bold title + BDT price.
 */
const AarongProductCard = memo(function AarongProductCard({
  product,
  href,
  prefetchModule = DEFAULT_PREFETCH,
  priority = false,
  onToggleWishlist,
  isInWishlist = false,
  onProductClick,
}: AarongProductCardProps) {
  const detailHref = href ?? `/shop/${product.category}/${product.slug}`
  const cardSizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
  const image = useMemo(
    () => catalogImageAttrs(product.image, 640, 853, cardSizes, [320, 480, 640]),
    [product.image],
  )
  const luxuryBadge = useMemo(() => getLuxuryBadgeForPrice(product.price), [product.price])
  const colorSwatches = useMemo(() => {
    const colors = (product.colors ?? []).map((color) => color.trim()).filter(Boolean)
    return colors.slice(0, 5)
  }, [product.colors])

  return (
    <article className="product-card luxury-tap group relative">
      <PrefetchLink
        to={detailHref}
        prefetchModule={prefetchModule}
        className="block"
        aria-label={`View ${product.name}`}
        onClick={() => onProductClick?.(product)}
      >
        <div className="studio-media-frame">
          <img
            src={image.src || CATALOG_IMAGE_PLACEHOLDER}
            srcSet={image.srcSet}
            sizes={image.sizes}
            alt={product.name}
            width={640}
            height={853}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'low'}
            decoding="async"
            className="product-card-media"
            onError={(event) => {
              event.currentTarget.removeAttribute('srcset')
              event.currentTarget.src = CATALOG_IMAGE_PLACEHOLDER
            }}
          />
          {luxuryBadge ? (
            <span className="product-card-badge" aria-label={luxuryBadge}>
              {luxuryBadge}
            </span>
          ) : null}
          {/* Desktop-only subtle VIEW — disabled on mobile so the card itself opens PDP */}
          <div className="pointer-events-none absolute inset-x-2 bottom-2 z-[2] hidden opacity-0 transition-opacity duration-500 md:flex md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100">
            <span className="btn-glass-cta w-full min-h-10 px-3 py-2 text-[10px] tracking-[0.16em] sm:text-[11px]">
              View
            </span>
          </div>
        </div>

        <div className="product-card-meta">
          <h3 className="product-card-title">{product.name}</h3>
          <p className="product-card-price">
            {product.comparePrice ? (
              <span className="is-compare">{formatBDT(product.comparePrice)}</span>
            ) : null}
            <span>{formatBDT(product.price)}</span>
          </p>
          {colorSwatches.length > 1 ? (
            <ul className="product-card-swatches" aria-label={`${colorSwatches.length} color options`}>
              {colorSwatches.map((color) => (
                <li key={color} title={color}>
                  <span
                    className="product-card-swatch"
                    style={{ background: swatchBackground(color) }}
                    aria-hidden
                  />
                </li>
              ))}
              {(product.colors?.length ?? 0) > colorSwatches.length ? (
                <li className="product-card-swatch-more" aria-hidden>
                  +{(product.colors?.length ?? 0) - colorSwatches.length}
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>
      </PrefetchLink>

      {onToggleWishlist ? (
        <button
          type="button"
          onPointerDown={(event) => {
            event.stopPropagation()
          }}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            onToggleWishlist(product)
          }}
          className="studio-wishlist"
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      ) : null}
    </article>
  )
})

export default AarongProductCard
