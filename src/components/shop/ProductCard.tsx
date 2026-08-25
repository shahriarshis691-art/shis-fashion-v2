import { memo } from 'react'
import type { ShopProduct } from '../../data/shopData'
import { isDemoImageUrl } from '../../utils/media'
import LuxuryImage from '../common/LuxuryImage'
import PrefetchLink from '../common/PrefetchLink'

interface ProductCardProps {
  product: ShopProduct
  onToggleWishlist?: (product: ShopProduct) => void
  isInWishlist?: boolean
  onProductClick?: (product: ShopProduct) => void
}

const prefetchProductDetail = () => import('../../pages/ProductDetailPage')

const ProductCard = memo(function ProductCard({ product, onToggleWishlist, isInWishlist, onProductClick }: ProductCardProps) {
  const imageToneClass = isDemoImageUrl(product.image) ? 'shis-media-tone' : ''
  const href = `/shop/${product.category}/${product.slug}`

  return (
    <article className="product-card luxury-tap group min-w-0">
      <PrefetchLink
        to={href}
        prefetchModule={prefetchProductDetail}
        className="block"
        onClick={() => onProductClick?.(product)}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--color-studio)]">
          <LuxuryImage
            src={product.image}
            alt={product.name}
            width={960}
            height={1280}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
            widths={[320, 480, 640, 768]}
            hover
            className="h-full w-full"
            aspectClassName="aspect-[3/4]"
            imgClassName={`product-card-media ${imageToneClass}`.trim()}
          />
          {onToggleWishlist ? (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onToggleWishlist(product)
              }}
              className="absolute top-2.5 right-2.5 z-10 text-neutral-600 transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-red-500"
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          ) : null}
        </div>
        <div className="product-card-meta pt-2.5 text-left sm:pt-3">
          <h3 className="line-clamp-2 text-[13px] font-medium tracking-tight text-[var(--color-text)] sm:text-[14px]">
            {product.name}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[12px] font-normal text-[var(--color-ink)] sm:text-[13px]">{product.price}</p>
            {product.comparePrice ? (
              <p className="text-[10px] tracking-wide text-[var(--color-muted)] line-through sm:text-xs">{product.comparePrice}</p>
            ) : null}
          </div>
        </div>
      </PrefetchLink>
    </article>
  )
})

export default ProductCard
