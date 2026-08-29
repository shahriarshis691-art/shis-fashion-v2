import { memo, useMemo, useState, type MouseEvent } from 'react'
import PrefetchLink from '../common/PrefetchLink'
import { useCart } from '../../context/CartContext'
import type { ShopProduct } from '../../data/shopData'
import { formatBDT } from '../../utils/currency'
import { hasListingRenderableImage, listingProductImageCandidates } from '../../utils/listingProducts'
import { CATALOG_IMAGE_PLACEHOLDER, catalogImageAttrs } from '../../utils/media'
import { getLuxuryBadgeForPrice } from '../../utils/luxuryBadge'
import { getVariantStock } from '../../utils/variantStock'

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
  sizes?: string[]
  description?: string
  stock?: number
  galleryImages?: string[]
  variants?: ShopProduct['variants']
  isPlaceholder?: boolean
  newArrival?: boolean
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
const LISTING_CARD_SIZES = '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'

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
 * Universal listing card — uniform 3:4 portrait frame, centered meta, no placeholder tiles.
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
  const { addToCart } = useCart()
  const [sizePickerOpen, setSizePickerOpen] = useState(false)
  const [imageCandidateIndex, setImageCandidateIndex] = useState(0)
  const [imageFailed, setImageFailed] = useState(false)
  const imageCandidates = useMemo(() => listingProductImageCandidates(product), [product])
  const activeImage = imageCandidates[imageCandidateIndex] ?? product.image
  const detailHref = href ?? `/shop/${product.category}/${product.slug}`
  const image = useMemo(
    () => catalogImageAttrs(activeImage, 640, 853, LISTING_CARD_SIZES, [320, 480, 640, 768], 'cover'),
    [activeImage],
  )
  const displaySrc = imageFailed
    ? CATALOG_IMAGE_PLACEHOLDER
    : (image.src || activeImage || CATALOG_IMAGE_PLACEHOLDER)
  const luxuryBadge = useMemo(() => getLuxuryBadgeForPrice(product.price), [product.price])
  const colorSwatches = useMemo(() => {
    const colors = (product.colors ?? []).map((color) => color.trim()).filter(Boolean)
    return colors.slice(0, 5)
  }, [product.colors])
  const sizes = useMemo(() => (product.sizes ?? []).map((size) => size.trim()).filter(Boolean), [product.sizes])
  const defaultColor = product.colors?.[0]?.trim() || 'Default'

  if (!hasListingRenderableImage(product) && imageCandidates.length === 0) {
    return null
  }

  const addWithSize = (event: MouseEvent, size: string) => {
    event.preventDefault()
    event.stopPropagation()
    const color = defaultColor
    if (getVariantStock(product, size, color) <= 0 && (product.stock ?? 1) <= 0) {
      return
    }

    addToCart(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        comparePrice: product.comparePrice,
        category: product.category,
        image: product.image,
        description: product.description ?? '',
        sizes: product.sizes,
        colors: product.colors,
        variants: product.variants,
        stock: product.stock,
      },
      { size, color, quantity: 1 },
    )
    setSizePickerOpen(false)
  }

  const handleQuickAdd = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (sizes.length > 1) {
      setSizePickerOpen(true)
      return
    }
    addWithSize(event, sizes[0] || 'M')
  }

  const sizePickerVisible = sizePickerOpen && sizes.length > 1

  return (
    <article
      className="product-card luxury-tap group relative border-0"
      onMouseLeave={() => setSizePickerOpen(false)}
    >
      <PrefetchLink
        to={detailHref}
        prefetchModule={prefetchModule}
        className="block"
        aria-label={`View ${product.name}`}
        onClick={() => onProductClick?.(product)}
      >
        <div className="listing-media-frame relative aspect-[3/4] w-full overflow-hidden rounded-none border-0 bg-neutral-100/70">
          <img
            key={displaySrc}
            src={displaySrc}
            srcSet={imageFailed ? undefined : image.srcSet}
            sizes={imageFailed ? undefined : image.sizes}
            alt={imageFailed ? '' : product.name}
            width={640}
            height={853}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'low'}
            decoding="async"
            className="product-card-media absolute inset-0 h-full w-full min-h-full min-w-full object-cover object-top"
            onError={() => {
              if (imageFailed) {
                return
              }

              if (imageCandidateIndex < imageCandidates.length - 1) {
                setImageCandidateIndex((current) => current + 1)
                return
              }

              setImageFailed(true)
            }}
          />
          {product.newArrival ? (
            <span className="product-card-badge product-card-badge-new md:hidden" aria-label="New in">
              NEW IN
            </span>
          ) : null}
          {luxuryBadge ? (
            <span className={`product-card-badge${product.newArrival ? ' max-md:hidden' : ''}`} aria-label={luxuryBadge}>
              {luxuryBadge}
            </span>
          ) : null}
          <div
            className={
              sizePickerVisible
                ? 'absolute inset-x-2 bottom-2 z-[2] flex'
                : 'pointer-events-none absolute inset-x-2 bottom-2 z-[2] hidden opacity-0 transition-opacity duration-300 md:flex md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100'
            }
          >
            {sizePickerVisible ? (
              <div className="flex w-full flex-wrap justify-center gap-1 bg-white/95 p-1.5" role="group" aria-label="Select size">
                {sizes.slice(0, 6).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={(event) => addWithSize(event, size)}
                    className="min-h-8 min-w-8 border border-neutral-200 bg-white px-2 text-[10px] font-semibold tracking-[0.08em] text-neutral-900 uppercase hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
                  >
                    {size}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleQuickAdd}
                className="btn-glass-cta w-full min-h-10 px-3 py-2 text-[10px] tracking-[0.16em] sm:text-[11px]"
              >
                Quick add
              </button>
            )}
          </div>
        </div>

        <div className="product-card-meta mt-2 px-0.5">
          <div className="product-card-meta-row">
            <div className="product-card-meta-copy min-w-0 flex-1">
              <h3 className="product-card-title">{product.name}</h3>
              <p className="product-card-price">
                {product.comparePrice ? (
                  <span className="is-compare">{formatBDT(product.comparePrice)}</span>
                ) : null}
                <span>{formatBDT(product.price)}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleQuickAdd}
              className="product-card-bag md:hidden"
              aria-label={`Add ${product.name} to bag`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l-1 12H7L6 8Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 8V7a3 3 0 0 1 6 0v1" />
              </svg>
            </button>
          </div>
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
          className="studio-wishlist top-2.5 right-2.5 z-10"
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
