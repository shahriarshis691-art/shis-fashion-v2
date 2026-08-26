import { memo } from 'react'
import PrefetchLink from '../common/PrefetchLink'
import { parseBDT } from '../../utils/currency'

export interface AarongProductCardProduct {
  id: string | number
  slug: string
  name: string
  price: string
  image: string
  category: string
  comparePrice?: string
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
}

const DEFAULT_PREFETCH = () => import('../../pages/ProductDetailPage')

function formatAarongListPrice(price: string) {
  const amount = parseBDT(price)
  return `Tk ${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Universal Aarong-style listing card — single source of truth for all category grids.
 * Full-bleed portrait image, outline wishlist, title + price only. No badges/shadows.
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

  return (
    <article className="product-card luxury-tap group relative min-w-0 transition-transform duration-500 ease-out hover:-translate-y-1">
      <PrefetchLink
        to={detailHref}
        prefetchModule={prefetchModule}
        className="block"
        aria-label={`View ${product.name}`}
        onClick={() => onProductClick?.(product)}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f5f5f7]">
          <img
            src={product.image}
            alt={product.name}
            width={640}
            height={853}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'low'}
            decoding="async"
            className="product-card-media absolute inset-0 h-full w-full object-cover object-[center_top]"
            onError={(event) => {
              event.currentTarget.src = '/og-image.svg'
            }}
          />
          <div className="pointer-events-none absolute inset-x-2 bottom-2 z-[1] hidden opacity-0 transition-opacity duration-300 md:flex md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100">
            <span className="btn-glass-cta w-full min-h-10 px-3 py-2 text-[10px] tracking-[0.16em] sm:text-[11px]">
              View
            </span>
          </div>
        </div>

        <h3 className="mt-2.5 line-clamp-1 text-left text-[13px] font-medium tracking-tight text-neutral-900 sm:text-[14px]">
          {product.name}
        </h3>
        <p className="mt-0.5 text-left text-[12px] font-semibold tabular-nums text-neutral-900 sm:text-[13px]">
          {formatAarongListPrice(product.price)}
        </p>
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
          className="absolute top-1.5 right-1.5 z-10 inline-flex h-11 w-11 items-center justify-center text-neutral-600 transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-red-500"
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
