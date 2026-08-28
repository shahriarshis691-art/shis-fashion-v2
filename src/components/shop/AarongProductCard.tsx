import { memo, useMemo, useState, type MouseEvent } from 'react'
import PrefetchLink from '../common/PrefetchLink'
import { useCart } from '../../context/CartContext'
import { useCartDrawer } from '../../context/CartDrawerContext'
import type { ShopProduct } from '../../data/shopData'
import { formatBDT } from '../../utils/currency'
import { catalogImageAttrs, CATALOG_IMAGE_PLACEHOLDER } from '../../utils/media'
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
  galleryImages?: string[]
  sizes?: string[]
  description?: string
  stock?: number
  variants?: ShopProduct['variants']
  brand?: string
  featured?: boolean
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

function toShopProduct(product: AarongProductCardProduct): ShopProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    comparePrice: product.comparePrice,
    category: product.category,
    brand: product.brand,
    image: product.image,
    description: product.description ?? '',
    galleryImages: product.galleryImages,
    sizes: product.sizes,
    colors: product.colors,
    variants: product.variants,
    stock: product.stock,
    featured: product.featured,
    newArrival: product.newArrival,
  }
}

/**
 * Universal listing card — 3/4 studio frame, hover image, quick add, bold price.
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
  const { openCart } = useCartDrawer()
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [selectedSize, setSelectedSize] = useState('')
  const detailHref = href ?? `/shop/${product.category}/${product.slug}`
  const cardSizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
  const image = useMemo(
    () => catalogImageAttrs(product.image, 640, 853, cardSizes, [320, 480, 640]),
    [product.image],
  )
  const hoverImageUrl = useMemo(() => {
    const next = (product.galleryImages ?? []).find((url) => url && url !== product.image)
    return next || ''
  }, [product.galleryImages, product.image])
  const hoverImage = useMemo(
    () => (hoverImageUrl ? catalogImageAttrs(hoverImageUrl, 640, 853, cardSizes, [320, 480, 640]) : null),
    [hoverImageUrl],
  )
  const luxuryBadge = useMemo(() => getLuxuryBadgeForPrice(product.price), [product.price])
  const colorSwatches = useMemo(() => {
    const colors = (product.colors ?? []).map((color) => color.trim()).filter(Boolean)
    return colors.slice(0, 5)
  }, [product.colors])
  const sizes = useMemo(() => (product.sizes ?? []).map((size) => size.trim()).filter(Boolean), [product.sizes])
  const defaultColor = product.colors?.[0]?.trim() || 'Default'

  const handleQuickAdd = (event: MouseEvent, sizeOverride?: string) => {
    event.preventDefault()
    event.stopPropagation()
    const size = sizeOverride || selectedSize || sizes[0] || 'M'
    const color = defaultColor
    if (getVariantStock(product, size, color) <= 0 && (product.stock ?? 1) <= 0) {
      return
    }
    addToCart(toShopProduct(product), { size, color, quantity: 1 })
    setQuickAddOpen(false)
    openCart()
  }

  const handleToggleQuickAdd = (event: MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (sizes.length <= 1) {
      handleQuickAdd(event, sizes[0] || 'M')
      return
    }
    setQuickAddOpen((value) => !value)
  }

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
          {hoverImage ? (
            <img
              src={hoverImage.src}
              srcSet={hoverImage.srcSet}
              sizes={hoverImage.sizes}
              alt=""
              width={640}
              height={853}
              loading="lazy"
              decoding="async"
              className="product-card-media-hover"
              aria-hidden
            />
          ) : null}
          {luxuryBadge ? (
            <span className="product-card-badge" aria-label={luxuryBadge}>
              {luxuryBadge}
            </span>
          ) : null}

          <div className={`product-card-quick-add ${quickAddOpen ? 'is-open' : ''}`}>
            {sizes.length > 1 && quickAddOpen ? (
              <div className="flex flex-wrap gap-1" role="group" aria-label="Select size">
                {sizes.slice(0, 6).map((size) => {
                  const inStock = getVariantStock(product, size, defaultColor) > 0 || (product.stock ?? 1) > 0
                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={!inStock}
                      onClick={(event) => {
                        setSelectedSize(size)
                        handleQuickAdd(event, size)
                      }}
                      className={`product-card-size ${selectedSize === size ? 'is-active' : ''}`}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleToggleQuickAdd}
                className="w-full min-h-9 bg-[#111111] text-[10px] font-semibold tracking-[0.16em] text-white uppercase"
              >
                Quick add
              </button>
            )}
          </div>
        </div>

        <div className="product-card-meta">
          <h3 className="product-card-title">{product.name}</h3>
          <p className="product-card-price">
            <span>{formatBDT(product.price)}</span>
            {product.comparePrice ? (
              <span className="is-compare">{formatBDT(product.comparePrice)}</span>
            ) : null}
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
